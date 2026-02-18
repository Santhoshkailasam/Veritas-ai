from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
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
from fastapi import WebSocket

# -----------------------------------
# CREATE FASTAPI APP
# -----------------------------------
app = FastAPI()
load_dotenv()
GROK_API_KEY = os.getenv("GROK_API_KEY")

# -----------------------------------
# CORS CONFIGURATION
# -----------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    return JSONResponse({
        "activeUsers": active_users_value,
        "documentsProcessed": documents_processed_value,
        "complianceScore": compliance_score_value,
        "cpuUsage": round(cpu_usage, 1),
        "memoryUsage": round(memory_usage, 1)
    })

# -----------------------------------
# SAFE FILE TEXT EXTRACTION
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
        return JSONResponse(
            {"error": "Could not extract text from document"},
            status_code=400
        )

    text_lower = text.lower()

    # -----------------------------------
    # DOCUMENT TYPE DETECTION
    # -----------------------------------
    policy_keywords = [
        "gdpr",
        "ccpa",
        "data protection",
        "privacy policy",
        "confidentiality",
        "security policy"
    ]

    if not any(keyword in text_lower for keyword in policy_keywords):
        return JSONResponse(
            {"error": "Please upload a valid GDPR, CCPA, or Security Policy document."},
            status_code=400
        )

    # -----------------------------------
    # CLAUSE PRECHECK
    # -----------------------------------
    required_clauses = [
        "encryption",
        "access control",
        "breach notification",
        "data retention"
    ]

    missing_clauses = [
        clause for clause in required_clauses if clause not in text_lower
    ]

    # -----------------------------------
    # AI PROMPT (STRICT SINGLE OBJECT)
    # -----------------------------------
    prompt = f"""
You are a senior legal compliance auditor AI.

Perform deep compliance analysis for:

1. GDPR
2. CCPA
3. Internal Security Policy

Return ONE single valid JSON object.
Do NOT return multiple JSON objects.
Do NOT include markdown.
Do NOT include explanations outside JSON.

JSON structure:

{{
  "frameworks": {{
    "gdpr": {{
      "score": 0-100,
      "confidence": 0-1,
      "risk_level": "LOW/MEDIUM/HIGH",
      "rules_triggered": [],
      "missing_requirements": [],
      "text_evidence": []
    }},
    "ccpa": {{ }},
    "internal_security_policy": {{ }}
  }},
  "finalScore": 0-100,
  "overall_status": "COMPLIANT/NON-COMPLIANT",
  "reasoning_chain": [],
  "improvement_recommendations": []
}}

Document Text:
{text[:8000]}
"""

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
        return JSONResponse(
            {"error": "AI request failed", "details": str(e)},
            status_code=500
        )

    # -----------------------------------
    # SAFE JSON EXTRACTION + REPAIR
    # -----------------------------------
    try:
        ai_text = ai_result["choices"][0]["message"]["content"]
        ai_text = ai_text.replace("```json", "").replace("```", "").strip()

        # Extract first full JSON block safely
        matches = re.findall(r'\{.*?\}', ai_text, re.DOTALL)

        if not matches:
            raise ValueError("No JSON found in AI output")

        # Merge multiple JSON blocks if needed
        if len(matches) > 1:
            combined = {}
            for block in matches:
                try:
                    combined.update(json.loads(block))
                except:
                    continue
            parsed = combined
        else:
            parsed = json.loads(matches[0])

        # Add system fields
        parsed["analysis_time_ms"] = analysis_time
        parsed["missing_clauses_detected"] = missing_clauses

        # Update metrics
        documents_processed.inc()
        documents_processed_value += 1

        if "finalScore" in parsed:
            compliance_score.set(parsed["finalScore"])
            compliance_score_value = parsed["finalScore"]

        return JSONResponse(parsed)

    except Exception as e:
        return JSONResponse(
            {
                "error": "AI parsing failed",
                "details": str(e),
                "raw_ai_output": ai_text if "ai_text" in locals() else None
            },
            status_code=500
        )
@app.websocket("/ws/analyze")
async def websocket_analysis(websocket: WebSocket):
    await websocket.accept()

    try:
        # Stage 1
        await websocket.send_json({"stage": "EXTRACTING"})
        await asyncio.sleep(1)

        # Stage 2
        await websocket.send_json({"stage": "VALIDATING"})
        await asyncio.sleep(1)

        # Stage 3
        await websocket.send_json({"stage": "AI_ANALYSIS"})
        await asyncio.sleep(2)

        # Fake final result
        await websocket.send_json({
            "stage": "COMPLETED",
            "result": {
                "score": 92,
                "confidence": 0.94,
                "risk_level": "LOW"
            }
        })

    except Exception as e:
        await websocket.send_json({"error": str(e)})

    finally:
        await websocket.close()
