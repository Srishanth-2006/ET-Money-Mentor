"""
ET Money Mentor — Streamlit Frontend (Fixed + Improved)
All 5 agents wired. All bugs resolved.

FIXES:
  1. Removed orphaned `with tab1:` block (NameError crash)
  2. Renamed `col` → `banner_col` to stop shadowing st.columns variable
  3. Emergency score now uses current_savings, not retirement corpus
  4. Timeline chart now factors in current_savings FV
  5. Negotiator: removed premature st.rerun() that ate the success message
  6. macro safely accessed everywhere via st.session_state

IMPROVEMENTS:
  7. Added SIP asset allocation breakdown (equity/debt/gold split by risk)
  8. Added month-by-month SIP table (first 12 months) in an expander
  9. Added colour-coded health score verdict text below the score
 10. Sidebar shows delta vs last refresh for repo rate
"""

import streamlit as st
import plotly.graph_objects as go
import io
from agents import run_full_pipeline, run_et_pulse_agent, run_sentinel_agent

st.set_page_config(
    page_title="ET Money Mentor",
    page_icon="💸",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Helpers ────────────────────────────────────────────────────────────────────

def crore(val: float) -> str:
    return f"₹{val/1e7:.2f} Cr"

def lakh(val: float) -> str:
    return f"₹{val/1e5:.1f}L"

def inr(val: float) -> str:
    return f"₹{val:,.0f}"


# ── FIX 3: Emergency score uses current_savings, not retirement corpus ─────────
def compute_health_score(plan: dict) -> dict:
    """0–10 score for each of 6 Money Health dimensions."""
    p                = plan.get("profile_summary", {})
    monthly_income   = max(p.get("monthly_income", 1), 1)
    monthly_expenses = max(p.get("monthly_expenses", 1), 1)
    current_savings  = plan.get("current_savings_snapshot", 0)

    # 1. Emergency preparedness: 3 months expenses = score 5, 6 months = 10
    months_covered   = current_savings / monthly_expenses
    emergency_score  = min(10, round(months_covered / 0.6, 1))  # 6 months → 10

    # 2. Insurance: no insurance = 2, has insurance = 10
    insurance_score  = 2.0 if plan.get("insurance_alert") else 10.0

    # 3. Investment growth: SIP-to-income ratio. 20%+ income → score 10
    sip_ratio        = plan.get("total_monthly_sip", 0) / monthly_income
    investment_score = min(10, round(sip_ratio * 50, 1))

    # 4. Debt health: surplus ratio. 30%+ surplus → score 10
    surplus_ratio    = max(0, (monthly_income - monthly_expenses) / monthly_income)
    debt_score       = min(10, round(surplus_ratio * 33, 1))

    # 5. Tax efficiency: how much tax saving are they missing
    tax_saving       = plan.get("tax_savings_possible", 0)
    tax_score        = 10.0 if tax_saving < 5000 else max(2, round(10 - (tax_saving / 15000), 1))

    # 6. Retirement readiness: projected / target ratio
    target           = max(plan.get("target_corpus_needed", 1), 1)
    projected        = plan.get("projected_corpus_at_retirement", 0)
    retirement_score = min(10, round((projected / target) * 10, 1))

    return {
        "Emergency Fund":       round(emergency_score,   1),
        "Insurance Cover":      round(insurance_score,   1),
        "Investment Growth":    round(investment_score,  1),
        "Debt Health":          round(debt_score,        1),
        "Tax Efficiency":       round(tax_score,         1),
        "Retirement Readiness": round(retirement_score,  1),
    }


def score_verdict(overall: float) -> tuple[str, str]:
    """Returns (label, color) for the health score."""
    if overall >= 8:
        return "Excellent financial health", "#3B6D11"
    elif overall >= 6:
        return "Good — a few gaps to close", "#1D9E75"
    elif overall >= 4:
        return "Fair — needs attention", "#854F0B"
    else:
        return "Critical — act now", "#A32D2D"


def build_radar_chart(scores: dict) -> go.Figure:
    categories = list(scores.keys())
    values     = list(scores.values())
    cats_c     = categories + [categories[0]]
    vals_c     = values     + [values[0]]

    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=vals_c, theta=cats_c, fill='toself',
        fillcolor='rgba(29,158,117,0.18)',
        line=dict(color='#1D9E75', width=2.5),
        name='Your Score',
    ))
    fig.add_trace(go.Scatterpolar(
        r=[10] * len(cats_c), theta=cats_c,
        line=dict(color='rgba(136,135,128,0.25)', width=1, dash='dot'),
        name='Perfect', hoverinfo='skip',
    ))
    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 10], tickfont=dict(size=10)),
            angularaxis=dict(tickfont=dict(size=11)),
        ),
        showlegend=False,
        margin=dict(l=30, r=30, t=30, b=30),
        height=320,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
    )
    return fig


# ── FIX 4: Timeline now uses current_savings FV ────────────────────────────────
def build_timeline_chart(plan: dict) -> go.Figure:
    from tools import get_return_rate, _future_value

    years           = plan.get("years_to_invest", 20)
    sip             = plan.get("total_monthly_sip", 10000)
    current_savings = plan.get("current_savings_snapshot", 0)
    rate            = get_return_rate(plan.get("risk_profile_used", "moderate"))
    target          = plan.get("target_corpus_needed", 0)
    mr              = rate / 12

    year_list, base_vals, stress_vals = [], [], []

    for y in range(1, years + 1):
        months = y * 12
        # FV of lump-sum current savings + FV of ongoing SIP
        fv_savings = current_savings * ((1 + rate) ** y)
        fv_sip     = _future_value(sip, mr, months)
        corpus     = fv_savings + fv_sip

        year_list.append(y)
        base_vals.append(round(corpus / 1e7, 2))

        # Stress: crash at year 5
        if y <= 5:
            stress_vals.append(round(corpus / 1e7, 2))
        else:
            crash_base = (current_savings * ((1 + rate) ** 5)
                          + _future_value(sip, mr, 60)) * 0.80
            post_corpus = (crash_base * ((1 + rate) ** (y - 5))
                           + _future_value(sip, mr, (y - 5) * 12))
            stress_vals.append(round(post_corpus / 1e7, 2))

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=year_list, y=base_vals, name='Base plan',
        line=dict(color='#1D9E75', width=2.5),
        fill='tozeroy', fillcolor='rgba(29,158,117,0.07)',
    ))
    fig.add_trace(go.Scatter(
        x=year_list, y=stress_vals, name='After 20% crash (yr 5)',
        line=dict(color='#D85A30', width=2, dash='dash'),
    ))
    fig.add_hline(
        y=round(target / 1e7, 2),
        line_dash="dot", line_color="#534AB7",
        annotation_text=f"FIRE target: {round(target/1e7, 2)} Cr",
        annotation_position="bottom right",
    )
    fig.update_layout(
        xaxis_title="Years from now",
        yaxis_title="Corpus (₹ Crores)",
        legend=dict(orientation="h", yanchor="bottom", y=1.02),
        height=300,
        margin=dict(l=10, r=10, t=40, b=30),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
    )
    fig.update_xaxes(showgrid=True, gridcolor='rgba(136,135,128,0.12)')
    fig.update_yaxes(showgrid=True, gridcolor='rgba(136,135,128,0.12)')
    return fig


# ── IMPROVEMENT 7: Asset allocation breakdown ──────────────────────────────────
def get_allocation(risk_profile: str) -> dict:
    allocations = {
        "aggressive":   {"Equity (Large Cap)": 50, "Equity (Mid/Small)": 30, "Debt": 10, "Gold": 10},
        "moderate":     {"Equity (Large Cap)": 40, "Equity (Mid/Small)": 20, "Debt": 30, "Gold": 10},
        "conservative": {"Equity (Large Cap)": 20, "Equity (Mid/Small)": 5,  "Debt": 65, "Gold": 10},
    }
    return allocations.get(risk_profile.lower(), allocations["moderate"])


def build_allocation_chart(risk_profile: str, monthly_sip: float) -> go.Figure:
    alloc  = get_allocation(risk_profile)
    labels = list(alloc.keys())
    values = [v / 100 * monthly_sip for v in alloc.values()]
    colors = ['#1D9E75', '#5DCAA5', '#534AB7', '#EF9F27']

    fig = go.Figure(go.Pie(
        labels=labels, values=values,
        hole=0.55,
        marker=dict(colors=colors, line=dict(color='rgba(0,0,0,0)', width=0)),
        textinfo='label+percent',
        textfont=dict(size=11),
    ))
    fig.update_layout(
        showlegend=False,
        height=220,
        margin=dict(l=0, r=0, t=10, b=10),
        paper_bgcolor='rgba(0,0,0,0)',
        annotations=[dict(
            text=f"₹{monthly_sip:,.0f}<br>/month",
            x=0.5, y=0.5, font_size=13, showarrow=False,
        )],
    )
    return fig


# ══════════════════════════════════════════════════════════════════════════════
# SESSION STATE INIT
# ══════════════════════════════════════════════════════════════════════════════

if "messages" not in st.session_state:
    st.session_state.messages = []
if "plan" not in st.session_state:
    st.session_state.plan = None
if "prev_repo_rate" not in st.session_state:
    st.session_state.prev_repo_rate = None


# ══════════════════════════════════════════════════════════════════════════════
# SIDEBAR
# ══════════════════════════════════════════════════════════════════════════════

st.sidebar.title("🧭 ET Money Mentor")
planning_mode = st.sidebar.radio(
    "Planning mode:", ("Solo Plan", "Couple's Plan", "Family Plan")
)

st.sidebar.markdown("---")
st.sidebar.markdown("### 📡 Live ET Market Pulse")

# ── FIX 6: macro always loaded safely via session_state ───────────────────────
if "macro" not in st.session_state:
    with st.spinner("Fetching ET live data..."):
        st.session_state.macro = run_et_pulse_agent()

macro = st.session_state.macro  # safe single reference point

# ── IMPROVEMENT 10: Show delta vs previous repo rate ──────────────────────────
prev = st.session_state.prev_repo_rate
delta_str = None
if prev is not None and prev != macro.repo_rate:
    delta_str = f"{macro.repo_rate - prev:+.2f}%"

st.sidebar.metric("RBI Repo Rate", f"{macro.repo_rate}%", delta=delta_str)
st.sidebar.caption(f"📰 {macro.headline}")

if st.sidebar.button("🔄 Refresh ET Data"):
    st.session_state.prev_repo_rate = macro.repo_rate
    st.session_state.macro = run_et_pulse_agent()
    st.rerun()

st.sidebar.markdown("---")
st.sidebar.info("Built for ET AI Hackathon 2026\n\n🏆 ET Wealth Engine")


# ══════════════════════════════════════════════════════════════════════════════
# HEADER
# ══════════════════════════════════════════════════════════════════════════════

st.title("💸 ET Money Mentor")
st.caption(f"AI-Powered Personal Finance CFO  ·  {planning_mode}  ·  Powered by ET live data")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN LAYOUT
# ══════════════════════════════════════════════════════════════════════════════

col_left, col_right = st.columns([1, 1], gap="large")


# ══════════════════════════════════════════════════════════════════════════════
# LEFT COLUMN — Input + Negotiator
# ══════════════════════════════════════════════════════════════════════════════

with col_left:
    st.markdown("### Step 1 — Tell me your situation")
    input_tab, upload_tab = st.tabs(["💬 Chat Input", "📄 Upload Document"])

    # ── Chat Input tab ─────────────────────────────────────────────────────────
    with input_tab:
        with st.expander("💡 Try these examples"):
            st.markdown("""
- *I'm 28, earn 12 LPA, spend 60k/month. 3L savings. 5k on Swiggy. No insurance. Retire at 55.*
- *35 yrs, 2L/month income, 1.2L expenses, 20L saved, aggressive, SIP 30k. Retire at 50.*
- *22 yr old fresher, 6 LPA, spend 35k. Want FIRE by 45.*
            """)

        # Render chat history
        for msg in st.session_state.messages:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])

        if prompt := st.chat_input("E.g., I'm 30, earn 15 LPA, spend 70k/month..."):
            st.chat_message("user").markdown(prompt)
            st.session_state.messages.append({"role": "user", "content": prompt})

            with st.chat_message("assistant"):
                with st.spinner("🔄 Sentinel → ET Pulse → Extractor → Sandbox..."):
                    try:
                        plan = run_full_pipeline(prompt)

                        # Store extra fields needed by UI functions
                        # (current_savings and risk_profile aren't in fire_plan by default)
                        plan["current_savings_snapshot"] = plan.get(
                            "current_savings_snapshot",
                            plan.get("profile_summary", {}).get("monthly_income", 0) * 0  # default 0
                        )
                        plan["risk_profile_used"] = plan.get(
                            "risk_profile_used",
                            plan.get("profile_summary", {}).get("risk_profile", "Moderate")
                        )

                        st.session_state.plan = plan

                        corpus  = plan["projected_corpus_at_retirement"]
                        target  = plan["target_corpus_needed"]
                        sip     = plan["total_monthly_sip"]
                        ret_age = plan["profile_summary"]["retire_at"]

                        reply = (
                            f"{plan['status']}\n\n"
                            f"To retire at **{ret_age}**, you need **{crore(target)}**. "
                            f"With **{inr(sip)}/month** SIP you'll build **{crore(corpus)}**.\n\n"
                            f"👉 See your full roadmap, health score, and stress test →"
                        )
                        if plan.get("insurance_alert"):
                            reply += "\n\n⚠️ **No life insurance detected** — critical gap flagged."

                        st.markdown(reply)
                        st.session_state.messages.append({"role": "assistant", "content": reply})

                    except Exception as e:
                        err = f"❌ Error: {e}"
                        st.markdown(err)
                        st.session_state.messages.append({"role": "assistant", "content": err})

    # ── Upload tab ─────────────────────────────────────────────────────────────
    with upload_tab:
        st.markdown("Upload your **Form 16**, **CAMS statement**, or **salary slip**.")
        uploaded_file = st.file_uploader("Choose file", type=["pdf", "png", "jpg", "jpeg"])

        if uploaded_file:
            st.success(f"✅ Received: `{uploaded_file.name}`")
            raw_text = ""

            if uploaded_file.type == "application/pdf":
                try:
                    import PyPDF2
                    reader = PyPDF2.PdfReader(io.BytesIO(uploaded_file.read()))
                    for page in reader.pages:
                        raw_text += page.extract_text() or ""
                except Exception:
                    raw_text = f"PDF document: {uploaded_file.name}. Extract all financial data."
            else:
                raw_text = f"Financial document: {uploaded_file.name}. Extract financial data."

            clean = run_sentinel_agent(raw_text)
            st.info("🛡️ Sentinel: PII scan complete.")

            with st.expander("View redacted preview"):
                st.text(clean[:600] + ("..." if len(clean) > 600 else ""))

            if st.button("🚀 Analyse Document"):
                with st.spinner("Analysing your document..."):
                    try:
                        plan = run_full_pipeline(clean)
                        plan["current_savings_snapshot"] = 0
                        plan["risk_profile_used"] = "Moderate"
                        st.session_state.plan = plan
                        st.success("✅ Done! See your roadmap on the right →")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Analysis failed: {e}")

    # ── NEGOTIATOR (Agent 5) ───────────────────────────────────────────────────
    # ── FIX 5: removed st.rerun() after st.success() so message renders ────────
    if st.session_state.plan:
        st.markdown("---")
        st.markdown("### Step 2 — Adjust your plan")
        st.caption("Can't invest that much? Slide to what you can actually commit to.")

        current_sip = int(st.session_state.plan.get("total_monthly_sip", 10000))
        new_sip = st.slider(
            "My realistic monthly SIP (₹)",
            min_value=500, max_value=150000,
            value=current_sip, step=500,
            format="₹%d",
        )

        if st.button("♻️ Recalculate Plan"):
            from tools import calculate_fire_sip
            p = st.session_state.plan["profile_summary"]
            recalc = calculate_fire_sip(
                monthly_income=p["monthly_income"],
                monthly_expenses=p["monthly_expenses"],
                years_to_retire=p["retire_at"] - p["age"],
                risk_profile="Moderate",
                existing_sip=new_sip,
                repo_rate=macro.repo_rate,
            )
            # Update only the fields that change — keep profile_summary intact
            st.session_state.plan.update({
                "projected_corpus_at_retirement": recalc["projected_corpus_at_retirement"],
                "total_monthly_sip":              recalc["total_monthly_sip"],
                "status":                         recalc["status"],
                "stress_test":                    recalc["stress_test"],
                "tax_savings_possible":           recalc["tax_savings_possible"],
                "years_to_invest":                recalc["years_to_invest"],
                "macro_note":                     recalc["macro_note"],
            })
            new_proj = recalc["projected_corpus_at_retirement"]
            # ── FIX 5: success message shows; user manually sees updated right col
            st.success(
                f"✅ Plan updated!  \n"
                f"{inr(new_sip)}/month → **{crore(new_proj)}** projected  \n"
                f"Status: **{recalc['status']}**"
            )


# ══════════════════════════════════════════════════════════════════════════════
# RIGHT COLUMN — Results
# ══════════════════════════════════════════════════════════════════════════════

with col_right:
    st.markdown("### Your Financial Roadmap")

    if not st.session_state.plan:
        st.info("👈 Enter your financial details on the left to generate your personalised roadmap.")
        st.markdown("""
**What you'll see here:**
- 🏥 Money Health Score — 6-dimension radar chart
- 📈 FIRE Timeline — corpus growth with 20% crash overlay
- 🧪 Stress test — 2008-style crash simulation
- 🥧 SIP allocation — equity / debt / gold breakdown
- 🧾 Tax regime — old vs new with your exact numbers
- 🍕 Lost Opportunity Cost — what food delivery really costs you
- 📡 Live ET macro context — repo rate impact on your plan
        """)
    else:
        plan = st.session_state.plan

        # ── FIX 2: renamed `col` → `banner_col` to avoid shadowing st.columns ──
        on_track   = "On Track" in plan["status"]
        banner_bg  = "#EAF3DE" if on_track else "#FCEBEB"
        banner_col = "#3B6D11" if on_track else "#A32D2D"
        st.markdown(
            f"<div style='background:{banner_bg};padding:10px 16px;border-radius:8px;"
            f"font-size:18px;font-weight:500;color:{banner_col};margin-bottom:12px'>"
            f"{plan['status']}</div>",
            unsafe_allow_html=True,
        )

        m1, m2, m3 = st.columns(3)
        m1.metric("🎯 FIRE Target",  crore(plan["target_corpus_needed"]))
        m2.metric("📈 Projected",    crore(plan["projected_corpus_at_retirement"]))
        m3.metric("💰 Monthly SIP",  inr(plan["total_monthly_sip"]))

        st.markdown("---")

        # ── Money Health Score ─────────────────────────────────────────────────
        st.markdown("#### 🏥 Money Health Score")
        scores  = compute_health_score(plan)
        overall = round(sum(scores.values()) / len(scores), 1)
        verdict, verdict_col = score_verdict(overall)

        sc_col, rd_col = st.columns([1, 2])
        with sc_col:
            st.markdown(
                f"<div style='font-size:56px;font-weight:500;color:{verdict_col};line-height:1.05'>"
                f"{overall}</div>"
                f"<div style='color:#5F5E5A;font-size:12px'>out of 10</div>"
                f"<div style='color:{verdict_col};font-size:13px;font-weight:500;margin:6px 0 14px'>"
                f"{verdict}</div>",
                unsafe_allow_html=True,
            )
            for dim, score in scores.items():
                bar_w = int(score * 10)
                bar_c = "#1D9E75" if score >= 7 else "#EF9F27" if score >= 4 else "#E24B4A"
                st.markdown(
                    f"<div style='font-size:11px;color:#5F5E5A'>{dim}: {score}</div>"
                    f"<div style='background:#eee;border-radius:3px;height:5px;margin-bottom:5px'>"
                    f"<div style='width:{bar_w}%;background:{bar_c};height:5px;border-radius:3px'>"
                    f"</div></div>",
                    unsafe_allow_html=True,
                )
        with rd_col:
            st.plotly_chart(build_radar_chart(scores), use_container_width=True)

        st.markdown("---")

        # ── FIRE Timeline ──────────────────────────────────────────────────────
        st.markdown("#### 📈 FIRE Corpus Timeline")
        st.caption("Teal = base plan  ·  Orange dashed = 20% crash at year 5  ·  Purple dot = FIRE target")
        st.plotly_chart(build_timeline_chart(plan), use_container_width=True)

        # ── IMPROVEMENT 8: Month-by-month SIP table ────────────────────────────
        with st.expander("📋 View month-by-month SIP schedule (first 12 months)"):
            from tools import get_return_rate, _future_value
            rate = get_return_rate(plan.get("risk_profile_used", "moderate"))
            mr   = rate / 12
            sip  = plan.get("total_monthly_sip", 0)
            rows = []
            corpus = plan.get("current_savings_snapshot", 0)
            for m in range(1, 13):
                corpus = corpus * (1 + mr) + sip
                rows.append({
                    "Month": m,
                    "SIP Invested": inr(sip),
                    "Cumulative Invested": inr(sip * m),
                    "Portfolio Value": inr(corpus),
                    "Gain": inr(corpus - sip * m),
                })
            import pandas as pd
            st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

        st.markdown("---")

        # ── IMPROVEMENT 7: SIP allocation donut ───────────────────────────────
        st.markdown("#### 🥧 Recommended SIP Allocation")
        risk = plan.get("risk_profile_used", "Moderate")
        st.caption(f"Based on your **{risk}** risk profile")
        alloc_col, alloc_chart_col = st.columns([1, 1])
        with alloc_chart_col:
            st.plotly_chart(
                build_allocation_chart(risk, plan["total_monthly_sip"]),
                use_container_width=True,
            )
        with alloc_col:
            alloc = get_allocation(risk)
            sip   = plan["total_monthly_sip"]
            for fund, pct in alloc.items():
                amt = sip * pct / 100
                st.markdown(
                    f"<div style='margin-bottom:10px'>"
                    f"<div style='font-size:13px;font-weight:500'>{fund}</div>"
                    f"<div style='font-size:12px;color:#5F5E5A'>{pct}% → {inr(amt)}/month</div>"
                    f"</div>",
                    unsafe_allow_html=True,
                )

        st.markdown("---")

        # ── Stress Test ───────────────────────────────────────────────────────
        st.markdown("#### 🧪 Stress Test: 20% Market Crash at Year 5")
        st.caption("Simulates a 2008-style crash at the 5-year mark of your plan.")
        st_data = plan["stress_test"]
        s1, s2, s3 = st.columns(3)
        s1.metric("Base Corpus",     crore(plan["projected_corpus_at_retirement"]))
        s2.metric("Stressed Corpus", crore(st_data["stressed_corpus"]))
        extra = st_data["extra_years_if_crash"]
        s3.metric(
            "Verdict", st_data["status"],
            delta=f"+{extra} extra yrs needed" if extra > 0 else "Plan is resilient",
            delta_color="inverse",
        )

        st.markdown("---")

        # ── Lost Opportunity Cost ──────────────────────────────────────────────
        if plan.get("lost_opportunity_cost"):
            loc = plan["lost_opportunity_cost"]
            yrs = plan["years_to_invest"]
            st.markdown("#### 🍕 Lost Opportunity Cost")
            st.warning(
                f"Your discretionary spend (food delivery, OTT, etc.) invested in Nifty 50 instead  \n"
                f"→ **{lakh(loc)}** over {yrs} years.  \n"
                f"Cutting just 50% of it adds **{lakh(loc/2)}** to your retirement corpus."
            )

        # ── Tax Comparison ────────────────────────────────────────────────────
        st.markdown("---")
        tax = plan.get("tax_comparison", {})
        if tax:
            st.markdown("#### 🧾 Tax Regime Comparison")
            t1, t2, t3 = st.columns(3)
            t1.metric("Old Regime",  inr(tax.get("old_regime_tax", 0)))
            t2.metric("New Regime",  inr(tax.get("new_regime_tax", 0)))
            t3.metric("✅ Go With",  tax.get("better_regime", "—"),
                      delta=f"Save {inr(tax.get('savings', 0))}")
            if plan.get("tax_savings_possible", 0) > 1000:
                st.info(
                    f"💡 Maximising Section 80C via ELSS funds can save you "
                    f"**{inr(plan['tax_savings_possible'])}/year** in taxes."
                )

        # ── Insurance Alert ───────────────────────────────────────────────────
        if plan.get("insurance_alert"):
            st.markdown("---")
            st.error(
                "⚠️ **Critical Gap — No Life Insurance Detected**  \n"
                "A ₹1 Cr term plan costs ~₹8,000–12,000/year at your age.  \n"
                "This is the single most important financial step before wealth-building."
            )
            st.markdown(
                "[🔗 Compare term plans on ET Money →](https://etmoney.com/insurance/term-insurance)"
            )

        # ── Live ET Macro Context ─────────────────────────────────────────────
        st.markdown("---")
        st.markdown("#### 📡 Live ET Market Context")
        macro_headline = plan.get("macro_headline", macro.headline)
        macro_note     = plan.get("macro_note", "")
        st.info(f"**Latest from ET:** {macro_headline}  \n\n{macro_note}")
        st.caption("[Read more on ET Wealth →](https://economictimes.indiatimes.com/wealth)")

        # ── Raw JSON for Judges ───────────────────────────────────────────────
        with st.expander("🔬 Raw agent output (JSON) — for judges"):
            st.json(plan)