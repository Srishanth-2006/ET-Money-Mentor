"""
ET Wealth Engine — Agent Pipeline
──────────────────────────────────
Agent 1 (Sentinel)    → PII redaction before anything touches the model
Agent 2 (ET Pulse)    → Live ET RSS macro context (runs independently)
Agent 3 (Extractor)   → Gemini extracts structured JSON from messy user text
Agent 4 (Sandbox)     → Python math engine: FIRE + stress test + tax
"""

import os
import re
import json
import time
import feedparser
import google.generativeai as genai
from dotenv import load_dotenv

from models import UserProfile, MacroContext
from tools import calculate_fire_sip, calculate_tax_comparison

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ── ET Mutual Fund DB (Hackathon Demo Data) ────────────────────────────────
ET_MUTUAL_FUND_DB = {
    "HDFC Mid-Cap": {"downside_protection_score": 52, "et_verdict": "High Volatility"},
    "SBI Small Cap": {"downside_protection_score": 45, "et_verdict": "Very High Risk"},
    "Axis Bluechip": {"downside_protection_score": 71, "et_verdict": "Moderate Safety"},
    "Nippon India Growth": {"downside_protection_score": 48, "et_verdict": "High Volatility"},
    "Quant Small Cap": {"downside_protection_score": 38, "et_verdict": "Extremely High Risk"},
    "Mirae Asset": {"downside_protection_score": 74, "et_verdict": "Good Protection"},
    "Parag Parikh Flexi Cap": {"downside_protection_score": 85, "et_verdict": "Excellent Protection"},
    "UTI Nifty Index": {"downside_protection_score": 80, "et_verdict": "Strong Protection"},
}

# ── ET RSS Feeds ───────────────────────────────────────────────────────────────
ET_RSS_FEEDS = [
    "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",  # Markets
    "https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms",    # Wealth
    "https://economictimes.indiatimes.com/rssfeedsdefault.cms",              # Main
]

# Keywords that trigger macro variable updates
MACRO_KEYWORDS = {
    "repo rate": "repo_rate",
    "rbi rate": "repo_rate",
    "ltcg": "ltcg_rate",
    "long term capital gains": "ltcg_rate",
    "section 80c": "elss_limit",
    "elss": "elss_limit",
    "nps": "nps_extra_limit",
}


# ══════════════════════════════════════════════════════════════════════════════
# AGENT 1 — SENTINEL (Privacy & PII Redaction)
# ══════════════════════════════════════════════════════════════════════════════

def run_sentinel_agent(raw_text: str) -> str:
    """
    Redacts PAN, Aadhaar, phone numbers, and email addresses from any text.
    Returns clean text safe to pass to the LLM.
    """
    print("🛡️  SENTINEL: Scanning for PII...")

    patterns = {
        "PAN":     (r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",       "[PAN-REDACTED]"),
        "Aadhaar": (r"\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b",  "[AADHAAR-REDACTED]"),
        "Phone":   (r"\b(?:\+91[\-\s]?)?[6-9]\d{9}\b",  "[PHONE-REDACTED]"),
        "Email":   (r"\b[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}\b","[EMAIL-REDACTED]"),
        "Account": (r"\b\d{9,18}\b",                      "[ACCOUNT-REDACTED]"),
    }

    redacted = raw_text
    redacted_fields = []

    for name, (pattern, replacement) in patterns.items():
        new_text, count = re.subn(pattern, replacement, redacted)
        if count > 0:
            redacted_fields.append(f"{name} ({count} found)")
            redacted = new_text

    if redacted_fields:
        print(f"   ✅ Redacted: {', '.join(redacted_fields)}")
    else:
        print("   ✅ No PII found — text is clean")

    return redacted


# ══════════════════════════════════════════════════════════════════════════════
# AGENT 2 — ET PULSE (Live Macro Context)
# ══════════════════════════════════════════════════════════════════════════════

def run_et_pulse_agent() -> MacroContext:
    """
    Reads ET RSS feeds and extracts macro signals.
    Falls back to sensible defaults if fetch fails (offline / rate limited).
    """
    print("📡 ET PULSE: Fetching live Economic Times data...")
    
    context = MacroContext()  # start with defaults

    try:
        headlines = []
        for feed_url in ET_RSS_FEEDS:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:10]:
                headlines.append(entry.title.lower())

        # Check for repo rate mentions and extract number
        repo_pattern = re.compile(r"repo rate.*?(\d+\.?\d*)\s*(?:per\s*cent|%|bps)?", re.IGNORECASE)
        bps_pattern = re.compile(r"(?:cuts?|raises?|hikes?)\s+(?:repo\s+rate\s+by\s+)?(\d+)\s*bps", re.IGNORECASE)

        for headline in headlines:
            # Direct repo rate number extraction
            m = repo_pattern.search(headline)
            if m:
                rate = float(m.group(1))
                if 4.0 <= rate <= 10.0:  # sanity check — repo rate is always in this range
                    context.repo_rate = rate
                    print(f"   📌 Repo rate updated: {rate}%")

            # BPS change detection
            m = bps_pattern.search(headline)
            if m:
                bps = int(m.group(1))
                if "cut" in headline or "reduce" in headline:
                    context.repo_rate = round(context.repo_rate - bps / 100, 2)
                elif "hike" in headline or "raise" in headline:
                    context.repo_rate = round(context.repo_rate + bps / 100, 2)
                print(f"   📌 Rate change detected: {bps} bps")

        # Best headline for UI display
        top_headlines = [h for h in headlines if any(kw in h for kw in ["rate", "rbi", "tax", "budget", "inflation", "gdp"])]
        if top_headlines:
            context.headline = top_headlines[0].title()

        print(f"   ✅ ET Pulse context: repo={context.repo_rate}%, headline='{context.headline}'")

    except Exception as e:
        print(f"   ⚠️  ET Pulse fetch failed ({e}), using defaults")

    return context


import PIL.Image

# ══════════════════════════════════════════════════════════════════════════════
# AGENT 3 — EXTRACTOR (Gemini-powered JSON extraction)
# ══════════════════════════════════════════════════════════════════════════════

def run_extractor_agent(clean_text: str, image_file=None) -> UserProfile:
    """
    Uses Gemini to extract structured financial data from text AND images.
    """
    print("🔍 EXTRACTOR: Structuring user data with Gemini...")

    # THE FIX: Upgraded to 2.5-flash to resolve the 404 v1beta API error
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are a strict financial data extraction assistant for an Indian personal finance app.
Extract the financial details from the user input and the uploaded image (if provided).

If an image is provided (like a Swiggy/Zomato receipt), calculate the total amount spent 
and add it to the `monthly_discretionary_spend`.

RULES:
- If a value is missing, use a logical default (0 for savings, "Moderate" for risk).
- Return ONLY a valid JSON object. No preamble, no markdown, no explanation.

JSON Schema:
{{
    "age": integer,
    "target_retirement_age": integer (default 60 if not mentioned),
    "monthly_income": float,
    "monthly_expenses": float,
    "current_savings": float,
    "monthly_discretionary_spend": float,
    "risk_profile": "Conservative" | "Moderate" | "Aggressive",
    "has_insurance": boolean,
    "existing_sip": float
}}

User Input: "{clean_text}"
"""
    
    # Prepare contents array (Text + Optional Image)
    contents = [prompt]
    if image_file is not None:
        print("   📸 Vision AI Activated: Processing uploaded image...")
        img = PIL.Image.open(image_file)
        contents.append(img)

    response = model.generate_content(
        contents,
        generation_config=genai.GenerationConfig(response_mime_type="application/json"),
    )

    extracted = json.loads(response.text)
    profile = UserProfile(**extracted)
    print(f"   ✅ Extracted: age={profile.age}, income=₹{profile.monthly_income:,.0f}/mo, "
          f"expenses=₹{profile.monthly_expenses:,.0f}/mo, risk={profile.risk_profile}")
    return profile


# ══════════════════════════════════════════════════════════════════════════════
# MASTER ORCHESTRATOR — Runs all 4 agents in sequence
# ══════════════════════════════════════════════════════════════════════════════

# In agents.py, update the function to expect the image_file:

def run_full_pipeline(raw_user_input: str, image_file=None) -> dict:
    print("\n" + "═" * 55)
    print("  ET WEALTH ENGINE — PIPELINE START")
    print("═" * 55)

    clean_text = run_sentinel_agent(raw_user_input)
    macro = run_et_pulse_agent()
    profile = run_extractor_agent(clean_text, image_file=image_file)
    
    # --- NEW: Run the ET Validator ---
    et_alerts = run_et_validator_agent(profile)
    
    plan = run_sandbox_agent(profile, macro)
    
    # Attach the alerts to the final plan so the UI can show them
    plan["et_fund_alerts"] = et_alerts

    print("═" * 55)
    print("  PIPELINE COMPLETE")
    print("═" * 55 + "\n")

    return plan

# ══════════════════════════════════════════════════════════════════════════════
# AGENT 4 — SANDBOX (Math engine + stress test)
# ══════════════════════════════════════════════════════════════════════════════
# ══════════════════════════════════════════════════════════════════════════════
# AGENT 2.5 — ET WEALTH VALIDATOR (Sponsor Integration)
# ══════════════════════════════════════════════════════════════════════════════

def run_et_validator_agent(profile: UserProfile) -> list:
    """
    Checks the user's extracted mutual funds against ET's proprietary 
    Downside Protection rankings to recommend safer alternatives.
    """
    print("🏦 ET VALIDATOR: Cross-referencing portfolio with ET Fund Report Card...")
    
    alerts = []
    for fund in profile.invested_funds:
        # Simple string matching for the hackathon demo
        for et_fund, data in ET_MUTUAL_FUND_DB.items():
            if et_fund.lower() in fund.lower():
                if data["downside_protection_score"] < 60:
                    alert = (
                        f"⚠️ **Portfolio Risk Detected:** You are invested in '{et_fund}'. "
                        f"The ET Money Fund Report Card gives this a low Downside Protection Score of "
                        f"**{data['downside_protection_score']}/100** ({data['et_verdict']}). "
                        f"Consider shifting to 'Parag Parikh Flexi Cap' (Score: 85/100) to survive market crashes."
                    )
                    alerts.append(alert)
                    print(f"   ⚠️ Flagged: {et_fund}")
    
    if not alerts:
         print("   ✅ No risky funds detected based on ET criteria.")
         
    return alerts

def run_sandbox_agent(profile: UserProfile, macro: MacroContext) -> dict:
    """
    Runs the FIRE math engine with live macro context baked in.
    Returns a complete plan dict ready for the UI.
    """
    print("⚙️  SANDBOX: Running FIRE math & stress test...")

    years = profile.target_retirement_age - profile.age

    fire_plan = calculate_fire_sip(
        monthly_income=profile.monthly_income,
        monthly_expenses=profile.monthly_expenses,
        years_to_retire=years,
        risk_profile=profile.risk_profile,
        current_savings=profile.current_savings,
        existing_sip=profile.existing_sip,
        monthly_discretionary_spend=profile.monthly_discretionary_spend,
        repo_rate=macro.repo_rate,
    )

    # Tax comparison using annual income
    annual_income = profile.monthly_income * 12
    tax_plan = calculate_tax_comparison(
        annual_income=annual_income,
        section_80c=profile.existing_sip * 12,  # assume SIP is in ELSS
    )

    fire_plan["tax_comparison"] = tax_plan
    fire_plan["macro_headline"] = macro.headline
    fire_plan["insurance_alert"] = not profile.has_insurance
    fire_plan["profile_summary"] = {
        "age": profile.age,
        "retire_at": profile.target_retirement_age,
        "monthly_income": profile.monthly_income,
        "monthly_expenses": profile.monthly_expenses,
    }

    print(f"   ✅ Sandbox: {fire_plan['status']} | Corpus: ₹{fire_plan['projected_corpus_at_retirement']:,.0f}")
    return fire_plan


# ── Quick test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_input = (
        "Hi, I'm Rahul, 30 years old. My PAN is ABCDE1234F and phone is 9876543210. "
        "I earn 18 LPA and spend around 85k a month in Bangalore. "
        "I already invest 10k/month in SIP and have 8 lakhs in FDs. "
        "I spend around 6k on Zomato and Swiggy. No life insurance. "
        "Moderate risk. Want to retire at 50."
    )

    plan = run_full_pipeline(test_input)
    print(json.dumps(plan, indent=2))