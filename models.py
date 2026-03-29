from pydantic import BaseModel, Field
from typing import Optional, List

class UserProfile(BaseModel):
    age: int = Field(description="The user's current age")
    target_retirement_age: int = Field(description="The age the user wants to retire", default=60)
    monthly_income: float = Field(description="Total monthly post-tax income")
    monthly_expenses: float = Field(description="Total monthly living expenses")
    current_savings: float = Field(description="Total currently invested or saved money", default=0)
    monthly_discretionary_spend: float = Field(description="Optional: monthly spend on food delivery", default=0)
    risk_profile: str = Field(description="Conservative, Moderate, or Aggressive", default="Moderate")
    has_insurance: bool = Field(description="Whether user has life insurance", default=False)
    existing_sip: float = Field(description="Existing monthly SIP amount if any", default=0)
    # --- ADD THIS LINE ---
    invested_funds: list[str] = Field(description="List of specific mutual funds or stocks the user mentions", default=[])
class MacroContext(BaseModel):
    repo_rate: float = Field(default=6.5, description="RBI repo rate percent")
    ltcg_rate: float = Field(default=12.5, description="Long term capital gains tax percent")
    elss_limit: float = Field(default=150000, description="80C limit in rupees")
    nps_extra_limit: float = Field(default=50000, description="80CCD(1B) NPS extra deduction")
    headline: str = Field(default="No live ET news fetched", description="Latest ET macro headline")

class FIREPlan(BaseModel):
    target_corpus_needed: float
    projected_corpus_at_retirement: float
    max_monthly_sip_possible: float
    existing_sip: float
    status: str
    years_to_invest: int
    expected_return_pct: float
    stress_test: dict         # 20% crash scenario
    lost_opportunity_cost: Optional[float] = None
    insurance_alert: bool = False
    tax_savings_possible: float = 0
    macro_note: str = ""