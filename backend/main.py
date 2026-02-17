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
from dotenv import load_dotenv

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
    allow_origins=["*"],  # Change in production
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
    return {"message": "FastAPI Backend Running"}

@app.post("/login")
def login():
    global active_users_value
    active_users.inc()
    active_users_value += 1
    return {"message": "User logged in"}

@app.post("/logout")
def logout():
    global active_users_value
    active_users.dec()
    active_users_value -= 1
    return {"message": "User logged out"}

# -----------------------------------
# PROMETHEUS METRICS ENDPOINT
# -----------------------------------
@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# -----------------------------------
# DASHBOARD METRICS
# -----------------------------------
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
# UPLOAD + VALIDATION + AI ANALYSIS
# -----------------------------------
@app.post("/upload-nda")
async def upload_nda(file: UploadFile = File(...)):

    global documents_processed_value, compliance_score_value

    content = await file.read()
    filename = file.filename
    text = ""

    # -------------------------------
    # FILE EXTRACTION
    # -------------------------------
    if filename.endswith(".txt"):
        text = content.decode("utf-8", errors="ignore")

    elif filename.endswith(".pdf"):
        with open("temp.pdf", "wb") as f:
            f.write(content)

        with pdfplumber.open("temp.pdf") as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""

    elif filename.endswith(".docx"):
        with open("temp.docx", "wb") as f:
            f.write(content)

        doc = Document("temp.docx")
        for para in doc.paragraphs:
            text += para.text + "\n"

    if not text.strip():
        return JSONResponse(
            {"error": "Could not extract text from document"},
            status_code=400
        )

    text_lower = text.lower()

    # -----------------------------------
    # STAGE 1: DOCUMENT TYPE DETECTION
    # -----------------------------------
    policy_keywords = [
        "gdpr",
        "ccpa",
        "data protection",
        "privacy policy",
        "confidentiality",
        "security policy"
    ]

    keyword_matches = sum(1 for word in policy_keywords if word in text_lower)

    if keyword_matches == 0:
        return JSONResponse(
            {
                "error": "Please upload a valid GDPR, CCPA, or Security Policy document."
            },
            status_code=400
        )

    # -----------------------------------
    # STAGE 2: CHECK MISSING CRITICAL CLAUSES
    # -----------------------------------
    required_clauses = {
        "encryption": "Encryption policy",
        "access control": "Access control policy",
        "breach notification": "Breach notification procedure",
        "data retention": "Data retention policy"
    }

    missing_clauses = []

    for key, description in required_clauses.items():
        if key not in text_lower:
            missing_clauses.append(description)

    # If policy exists but missing important clauses
    if len(missing_clauses) >= 2:
        return JSONResponse(
            {
                "status": "INCOMPLETE_POLICY",
                "missing_clauses": missing_clauses,
                "message": "The uploaded policy is missing critical security components."
            },
            status_code=200
        )

    # -----------------------------------
    # STAGE 3: AI COMPLIANCE ANALYSIS
    # -----------------------------------
    prompt = f"""
You are a senior legal compliance AI.

Analyze the document for:

1. GDPR
2. CCPA
3. Internal Security Policy

Return STRICT JSON ONLY.

Format:

{{
  "frameworks": {{
    "GDPR": 0-100,
    "CCPA": 0-100,
    "InternalPolicy": 0-100
  }},
  "finalScore": 0-100,
  "status": "COMPLIANT" or "NON-COMPLIANT",
  "reasoning_chain": ["list findings"]
}}

Document Text:
{text[:8000]}
"""

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a legal compliance AI. Return valid JSON only."
                    },
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            },
            timeout=60
        )

        ai_result = response.json()

    except Exception as e:
        return JSONResponse(
            {"error": "AI request failed", "details": str(e)},
            status_code=500
        )

    # -----------------------------------
    # SAFE JSON PARSING
    # -----------------------------------
    try:
        ai_text = ai_result["choices"][0]["message"]["content"]
        ai_text = ai_text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(ai_text)

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
                "ai_text": ai_text if "ai_text" in locals() else None
            },
            status_code=500
        )
