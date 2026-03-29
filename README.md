# 💸 ET Sentinel: The Agentic Wealth Engine

**An AI-powered personal finance CFO featuring a zero-trust 5-agent Gemini pipeline, live Economic Times market intelligence, and FIRE stress-testing.** *Built for the ET Gen AI Hackathon 2026.*

---

## 🚀 The Problem We Solve
Most AI financial apps are dangerous—they wrap an LLM in a pretty UI and allow it to hallucinate math and retirement projections. 

**ET Sentinel** uses a completely decoupled, Zero-Trust Multi-Agent architecture. We use AI strictly for what it's good at (understanding messy human context and extracting data from documents) and hand the actual financial planning off to a flawless, hard-coded Python math engine.

## ✨ Key Features
* 📡 **ET Pulse Integration:** Actively scrapes live Economic Times RSS feeds to bake today's RBI Repo Rate and market sentiment into your retirement math.
* 🛡️ **Zero-Trust Privacy:** Our *Sentinel Agent* intercepts and redacts PII (PAN, Aadhaar, Phone numbers) before it ever touches an LLM.
* 📉 **The 20% Crash Sandbox:** Doesn't just give rosy projections. Simulates a 2008-style market crash in Year 5 to stress-test the user's retirement corpus.
* 🍕 **Lost Opportunity Cost:** Calculates exactly how much discretionary spending (like food delivery) is costing the user in millions of lost retirement wealth over 20 years.
* 🏦 **ET Validator:** Cross-references user portfolios against ET's proprietary Downside Protection scores to flag high-risk mutual funds.

## 🏗️ Architecture & Tech Stack
This project uses a production-grade decoupled architecture.

**Frontend:**
* Next.js 16.2.1 (App Router)
* React 19
* Tailwind CSS v4 (with custom CSS Marquee animations)
* Framer Motion 12 (Micro-interactions & Glassmorphism)

**Backend:**
* Python (FastAPI + Uvicorn)
* Google Gemini 2.5 Flash (via `google-generativeai`)
* `feedparser` (for ET RSS live feeds)
* Pydantic (Strict JSON data validation)

## 🧠 The 5-Agent Pipeline
When a user chats with the AI CFO or uploads a tax document, the data flows through this strict pipeline:
1. **Agent 1 (Sentinel):** PII redaction.
2. **Agent 2 (ET Pulse):** Live macro context injection.
3. **Agent 3 (Extractor):** Gemini Vision extracts structured JSON (age, income, expenses, risk).
4. **Agent 3.5 (ET Validator):** Mutual fund downside protection check.
5. **Agent 4 (Sandbox):** Pure Python FIRE math, stress testing, and Old vs. New tax regime comparison.

## 💻 How to Run Locally

### 1. Start the Backend API
```bash
cd ETMoneyMentor
python -m venv venv
venv\Scripts\activate  # Or `source venv/bin/activate` on Mac
pip install fastapi uvicorn feedparser google-generativeai python-multipart python-dotenv pillow pydantic
uvicorn server:app --reload