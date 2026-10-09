from typing import List, Optional
from pydantic import BaseModel, Field


class RiskAssessmentRequest(BaseModel):
    """
    Input schema for quantifying a single cyber risk scenario.
    Based on standard FAIR (Factor Analysis of Information Risk) framework metrics.
    """
    scenario_name: str = Field(
        ..., 
        example="Ransomware attack on primary customer database",
        description="A descriptive name for the cyber risk scenario."
    )
    asset_name: str = Field(
        ..., 
        example="Customer PII Database",
        description="The primary IT or business asset at risk."
    )
    asset_value: float = Field(
        ..., 
        gt=0, 
        example=5000000.0,
        description="Total estimated value of the asset in USD."
    )
    threat_event_frequency: float = Field(
        ..., 
        ge=0.0, 
        example=2.0,
        description="Estimated number of threat attempts or incidents per year (TEF)."
    )
    vulnerability_probability: float = Field(
        ..., 
        ge=0.0, 
        le=1.0, 
        example=0.35,
        description="Probability that a threat attempt successfully causes a breach (0.0 to 1.0)."
    )
    direct_loss: float = Field(
        ..., 
        ge=0, 
        example=150000.0,
        description="Direct incident response, forensic, and repair costs per breach event (USD)."
    )
    indirect_loss: float = Field(
        ..., 
        ge=0, 
        example=300000.0,
        description="Indirect costs like regulatory fines, reputational damage, customer churn (USD)."
    )
    proposed_security_cost: Optional[float] = Field(
        default=0.0, 
        ge=0, 
        example=50000.0,
        description="Optional security control investment cost for calculating ROI (USD)."
    )
    mitigated_vulnerability_probability: Optional[float] = Field(
        default=None, 
        ge=0.0, 
        le=1.0, 
        example=0.10,
        description="Optional reduced vulnerability probability if proposed security control is deployed."
    )


class RiskMetrics(BaseModel):
    """
    Calculated quantitative financial metrics for a cyber risk scenario.
    """
    loss_event_frequency: float = Field(
        ..., 
        description="Expected number of successful breaches per year (LEF = TEF * Vulnerability)."
    )
    single_loss_expectancy: float = Field(
        ..., 
        description="Estimated monetary loss for a single breach event (SLE = Direct + Indirect)."
    )
    annual_loss_expectancy: float = Field(
        ..., 
        description="Expected financial loss per year without proposed security controls (ALE = LEF * SLE)."
    )
    mitigated_annual_loss_expectancy: Optional[float] = Field(
        default=None, 
        description="Expected financial loss per year with proposed security controls applied."
    )
    annual_risk_reduction: Optional[float] = Field(
        default=None, 
        description="Annual dollar savings achieved by proposed security control."
    )
    security_roi_percentage: Optional[float] = Field(
        default=None, 
        description="Return on Investment percentage for the proposed security control."
    )


class RiskAssessmentResponse(BaseModel):
    """
    Complete response returned by the CyberQuant risk quantification engine.
    """
    scenario_name: str
    asset_name: str
    asset_value: float
    metrics: RiskMetrics
    assumptions: List[str] = Field(
        ..., 
        description="Explicit methodological assumptions and model parameters used."
    )
    recommendation: str = Field(
        ..., 
        description="Actionable executive summary or financial recommendation."
    )


class ScenarioComparisonRequest(BaseModel):
    """
    Input schema to compare multiple risk scenarios side by side.
    """
    scenarios: List[RiskAssessmentRequest] = Field(
        ..., 
        min_items=1, 
        description="List of risk scenarios to evaluate and compare."
    )


class ScenarioComparisonResponse(BaseModel):
    """
    Response schema returning comparison metrics across multiple risk scenarios.
    """
    assessments: List[RiskAssessmentResponse]
    total_baseline_ale: float = Field(
        ..., 
        description="Sum of annual loss expectancies across all unmitigated scenarios."
    )
    total_mitigated_ale: float = Field(
        ..., 
        description="Sum of annual loss expectancies assuming security controls are deployed."
    )
    total_potential_savings: float = Field(
        ..., 
        description="Total annual financial risk reduction across all scenarios."
    )
