# server.py — lives in ETMoneyMentor/ (NOT in premium-finance-app/)
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from agents import run_full_pipeline
import io, traceback

app = FastAPI(title="ET Sentinel: The Agentic Wealth Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ET Sentinel: The Agentic Wealth Engine is running 🚀"}

@app.post("/api/analyze")
async def analyze(message: str = Form(...), file: UploadFile = File(None)):
    try:
        file_obj = None
        if file and file.filename:
            contents = await file.read()
            file_obj = io.BytesIO(contents)
        plan = run_full_pipeline(message, image_file=file_obj)
        return {"status": "success", "data": plan}
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.post("/api/tax")
async def tax_only(
    annual_income: float = Form(...),
    sec80c: float = Form(0),
    hra: float = Form(0),
    sec80d: float = Form(0),
    nps: float = Form(0),
):
    try:
        from tools import calculate_tax_comparison
        result = calculate_tax_comparison(
            annual_income=annual_income,
            hra_claimed=hra,
            section_80c=sec80c,
            section_80d=sec80d,
            nps_80ccd=nps,
        )
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}