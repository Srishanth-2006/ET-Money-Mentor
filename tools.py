"""
Core math engine — all formulas are pure Python, no ML needed.
Every number here must be explainable to a judge in plain English.
"""

NIFTY_CAGR = 0.12          # Nifty 50 long-run historical average
CRASH_FACTOR = 0.80        # 20% market crash simulation
SAFE_WITHDRAWAL_RATE = 25  # 4% rule → 25x annual expenses


def _monthly_rate(annual_pct: float) -> float:
    return annual_pct / 12


def _future_value(monthly_amount: float, monthly_rate: float, months: int) -> float:
    """Standard SIP future value formula: FV = P × [((1+i)^n − 1) / i] × (1+i)"""
    if monthly_rate == 0:
        return monthly_amount * months
    return monthly_amount * (((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate)


def get_return_rate(risk_profile: str) -> float:
    mapping = {
        "aggressive": 0.12,
        "moderate": 0.10,
        "conservative": 0.07,
    }
    return mapping.get(risk_profile.lower(), 0.10)


def calculate_fire_sip(
    monthly_income: float,
    monthly_expenses: float,
    years_to_retire: int,
    risk_profile: str,
    current_savings: float = 0,
    existing_sip: float = 0,
    monthly_discretionary_spend: float = 0,
    repo_rate: float = 6.5,
) -> dict:
    """
    Full FIRE plan with:
    - projected corpus (base case)
    - stress test corpus (20% crash in year 5)
    - lost opportunity cost on discretionary spend
    - insurance alert flag
    - macro note using live repo rate
    """
    annual_return = get_return_rate(risk_profile)
    mr = _monthly_rate(annual_return)
    months = years_to_retire * 12

    # ── Target corpus ──────────────────────────────────────────────────────────
    annual_expenses = monthly_expenses * 12
    target_corpus = annual_expenses * SAFE_WITHDRAWAL_RATE

    # ── Investable surplus ─────────────────────────────────────────────────────
    monthly_surplus = monthly_income - monthly_expenses
    new_sip = max(0, monthly_surplus - existing_sip)  # what they CAN add

    # ── Base case corpus ───────────────────────────────────────────────────────
    # Future value of existing savings growing at the same rate
    savings_fv = current_savings * ((1 + annual_return) ** years_to_retire)

    # FV of total SIP (existing + new)
    total_sip = existing_sip + new_sip
    sip_fv = _future_value(total_sip, mr, months)

    projected_corpus = savings_fv + sip_fv

    # ── Stress test: 20% crash in year 5 ──────────────────────────────────────
    # Corpus accumulated after 5 years, then crashes 20%, then grows for remaining years
    months_before_crash = 5 * 12
    months_after_crash = max(0, months - months_before_crash)

    corpus_at_crash = (
        current_savings * ((1 + annual_return) ** 5)
        + _future_value(total_sip, mr, months_before_crash)
    )
    corpus_after_crash = corpus_at_crash * CRASH_FACTOR  # 20% wiped

    # Continue SIP after crash for remaining years
    sip_fv_post_crash = _future_value(total_sip, mr, months_after_crash)
    stressed_corpus = corpus_after_crash * ((1 + annual_return) ** (months_after_crash / 12)) + sip_fv_post_crash

    extra_years_needed = 0
    if stressed_corpus < target_corpus:
        # How many extra years to recover
        temp = stressed_corpus
        while temp < target_corpus and extra_years_needed < 20:
            temp = temp * (1 + annual_return) + total_sip * 12
            extra_years_needed += 1

    # ── Lost Opportunity Cost (LOC) ────────────────────────────────────────────
    # What would ₹X/month of discretionary spend become if invested at Nifty CAGR?
    loc = None
    if monthly_discretionary_spend > 0:
        loc = round(_future_value(monthly_discretionary_spend, _monthly_rate(NIFTY_CAGR), months), 2)

    # ── Tax savings estimate ───────────────────────────────────────────────────
    # Simple: if SIP < 1.5L/year via ELSS, flag the gap
    annual_sip = total_sip * 12
    elss_gap = max(0, 150000 - annual_sip)          # Section 80C headroom
    # Assume 30% tax bracket — max tax saving at 30% slab
    tax_saving = min(elss_gap, 150000) * 0.30

    # ── Status ────────────────────────────────────────────────────────────────
    status = "✅ On Track" if projected_corpus >= target_corpus else "⚠️ Falling Short"

    # ── Macro note ────────────────────────────────────────────────────────────
    macro_note = (
        f"RBI repo rate is {repo_rate}%. "
        f"{'Debt funds are attractive now — consider tilting conservative allocation.' if repo_rate > 6.0 else 'Rate cuts ahead — equity heavy allocation makes sense.'}"
    )

    return {
        "target_corpus_needed": round(target_corpus, 2),
        "projected_corpus_at_retirement": round(projected_corpus, 2),
        "max_monthly_sip_possible": round(new_sip, 2),
        "existing_sip": existing_sip,
        "total_monthly_sip": round(total_sip, 2),
        "status": status,
        "years_to_invest": years_to_retire,
        "expected_return_pct": annual_return * 100,
        "stress_test": {
            "stressed_corpus": round(stressed_corpus, 2),
            "extra_years_if_crash": extra_years_needed,
            "status": "✅ Survives crash" if stressed_corpus >= target_corpus else f"⚠️ Need {extra_years_needed} extra year(s)",
        },
        "lost_opportunity_cost": loc,
        "tax_savings_possible": round(tax_saving, 2),
        "macro_note": macro_note,
    }


def calculate_tax_comparison(
    annual_income: float,
    hra_claimed: float = 0,
    section_80c: float = 0,
    section_80d: float = 0,
    nps_80ccd: float = 0,
) -> dict:
    """
    Old vs New tax regime comparison.
    Returns which regime saves more and by how much.
    """
    # ── Old regime ─────────────────────────────────────────────────────────────
    standard_deduction = 50000
    deductions = standard_deduction + hra_claimed + min(section_80c, 150000) + min(section_80d, 25000) + min(nps_80ccd, 50000)
    old_taxable = max(0, annual_income - deductions)
    old_tax = _slab_tax_old(old_taxable)

    # ── New regime (FY 2024-25) ────────────────────────────────────────────────
    new_standard_deduction = 75000
    new_taxable = max(0, annual_income - new_standard_deduction)
    new_tax = _slab_tax_new(new_taxable)

    delta = abs(old_tax - new_tax)
    better = "Old Regime" if old_tax < new_tax else "New Regime"

    return {
        "old_regime_tax": round(old_tax, 2),
        "new_regime_tax": round(new_tax, 2),
        "better_regime": better,
        "savings": round(delta, 2),
        "deductions_used": round(deductions, 2),
    }


def _slab_tax_old(taxable: float) -> float:
    tax = 0
    slabs = [(250000, 0), (500000, 0.05), (1000000, 0.20), (float("inf"), 0.30)]
    prev = 0
    for limit, rate in slabs:
        if taxable <= prev:
            break
        tax += min(taxable, limit) * rate - prev * rate
        prev = limit
    return max(0, tax)


def _slab_tax_new(taxable: float) -> float:
    tax = 0
    slabs = [
        (300000, 0), (600000, 0.05), (900000, 0.10),
        (1200000, 0.15), (1500000, 0.20), (float("inf"), 0.30)
    ]
    prev = 0
    for limit, rate in slabs:
        if taxable <= prev:
            break
        tax += min(taxable, limit) * rate - prev * rate
        prev = limit
    return max(0, tax)