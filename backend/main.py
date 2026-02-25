from fastapi import FastAPI, UploadFile, File, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi import Request
from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST
import psutil
import pdfplumber
from docx import Document
import os
import requests
import json
import tempfile
import time
import re
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import asyncio

# -----------------------------------
# DATABASE CONFIG (SQLite)
# -----------------------------------
DATABASE_URL = "sqlite:///./audit_logs.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, index=True)
    action = Column(String)
    status = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# -----------------------------------
# FASTAPI APP
# -----------------------------------
app = FastAPI()
load_dotenv()
GROK_API_KEY = os.getenv("GROK_API_KEY")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------
# AUDIT LOG FUNCTION
# -----------------------------------
def create_audit_log(user, action, status):
    db = SessionLocal()
    log = AuditLog(
        user=user,
        action=action,
        status=status,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.close()

# -----------------------------------
# PROMETHEUS METRICS
# -----------------------------------
active_users = Gauge("active_users_total", "Number of active users")
documents_processed = Counter("documents_processed_total", "Total documents processed")
compliance_score = Gauge("average_compliance_score", "Average compliance score")

active_users_value = 0
documents_processed_value = 0
compliance_score_value = 0

# -----------------------------------
# BASIC ROUTES
# -----------------------------------
@app.get("/")
def home():
    return {"message": "Compliance AI Backend Running"}

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/dashboard-metrics")
def dashboard_metrics():
    cpu_usage = psutil.cpu_percent(interval=0.3)
    memory_usage = psutil.virtual_memory().percent

    return {
        "activeUsers": active_users_value,
        "documentsProcessed": documents_processed_value,
        "complianceScore": compliance_score_value,
        "cpuUsage": round(cpu_usage, 1),
        "memoryUsage": round(memory_usage, 1)
    }

# -----------------------------------
# TEXT EXTRACTION
# -----------------------------------
def extract_text(filename: str, content: bytes) -> str:
    text = ""

    if filename.endswith(".txt"):
        text = content.decode("utf-8", errors="ignore")

    elif filename.endswith(".pdf"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            temp_path = tmp.name

        with pdfplumber.open(temp_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""

        os.remove(temp_path)

    elif filename.endswith(".docx"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            tmp.write(content)
            temp_path = tmp.name

        doc = Document(temp_path)
        for para in doc.paragraphs:
            text += para.text + "\n"

        os.remove(temp_path)

    return text

# -----------------------------------
# MAIN ANALYSIS ENDPOINT
# -----------------------------------
@app.post("/upload-nda")
async def upload_nda(file: UploadFile = File(...)):

    global documents_processed_value, compliance_score_value

    content = await file.read()
    filename = file.filename.lower()

    text = extract_text(filename, content)

    if not text.strip():
        create_audit_log("admin@company.com", "UPLOAD_POLICY", "FAILED")
        return JSONResponse(
            {"error": "Could not extract text from document"},
            status_code=400
        )

    text_lower = text.lower()

    policy_keywords = [
        "gdpr", "ccpa", "data protection",
        "privacy policy", "confidentiality",
        "security policy"
    ]

    if not any(keyword in text_lower for keyword in policy_keywords):
        create_audit_log("admin@company.com", "UPLOAD_POLICY", "FAILED")
        return JSONResponse(
            {"error": "Invalid policy document"},
            status_code=400
        )

    required_clauses = [
        "encryption", "access control",
        "breach notification", "data retention"
    ]

    missing_clauses = [
        clause for clause in required_clauses if clause not in text_lower
    ]

    prompt = f"""
    Perform compliance analysis for GDPR, CCPA and Internal Security Policy.
    Return ONE valid JSON object only.

    Document Text:
    {text[:8000]}
    """

    # ---------- AI REQUEST ----------
    try:
        start_time = time.time()

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": "Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            },
            timeout=60
        )

        ai_result = response.json()
        analysis_time = int((time.time() - start_time) * 1000)

    except Exception as e:
        create_audit_log("admin@company.com", "UPLOAD_POLICY", "FAILED")
        return JSONResponse(
            {"error": "AI request failed", "details": str(e)},
            status_code=500
        )

    # ---------- JSON PARSING ----------
    try:
        ai_text = ai_result["choices"][0]["message"]["content"]
        ai_text = ai_text.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(ai_text)

        parsed["analysis_time_ms"] = analysis_time
        parsed["missing_clauses_detected"] = missing_clauses

        documents_processed.inc()
        documents_processed_value += 1

        if "finalScore" in parsed:
            compliance_score.set(parsed["finalScore"])
            compliance_score_value = parsed["finalScore"]

        create_audit_log("admin@company.com", "UPLOAD_POLICY", "SUCCESS")

        return JSONResponse(parsed)

    except Exception as e:
        create_audit_log("admin@company.com", "UPLOAD_POLICY", "FAILED")
        return JSONResponse(
            {
                "error": "AI parsing failed",
                "details": str(e),
                "raw_ai_output": ai_text if "ai_text" in locals() else None
            },
            status_code=500
        )

# -----------------------------------
# WEBSOCKET
# -----------------------------------
@app.websocket("/ws/analyze")
async def websocket_analysis(websocket: WebSocket):
    await websocket.accept()
    try:
        await websocket.send_json({"stage": "EXTRACTING"})
        await asyncio.sleep(1)

        await websocket.send_json({"stage": "VALIDATING"})
        await asyncio.sleep(1)

        await websocket.send_json({"stage": "AI_ANALYSIS"})
        await asyncio.sleep(2)

        await websocket.send_json({
            "stage": "COMPLETED",
            "result": {
                "score": 92,
                "confidence": 0.94,
                "risk_level": "LOW"
            }
        })
    finally:
        await websocket.close()

# -----------------------------------
# GET AUDIT LOGS
# -----------------------------------
@app.get("/audit")
def get_audit_logs():
    db = SessionLocal()
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    db.close()

    return [
        {
            "id": log.id,
            "user": log.user,
            "action": log.action,
            "status": log.status,
            "timestamp": log.timestamp
        }
        for log in logs
    ]