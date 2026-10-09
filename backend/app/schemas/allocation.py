from pydantic import BaseModel, Field, validator
from typing import List, Optional


class RiskEstimate(BaseModel):
    """Risk estimate produced by risk_engine.py."""
    probability: float = Field(..., ge=0, le=1, description="Annual breach probability [0,1]")
    impact: float = Field(..., gt=0, description="Expected dollar loss if breach occurs")
    
    @property
    def expected_loss(self) -> float:
        return self.probability * self.impact


class MitigationMeasure(BaseModel):
    """A candidate security mitigation measure."""
    name: str = Field(..., description="Human-readable mitigation name")
    cost: float = Field(..., gt=0, description="Implementation cost in dollars")
    risk_reduction_percent: float = Field(
        ..., ge=0, le=100,
        description="Percentage reduction in breach probability (0-100)"
    )
    
    @property
    def risk_reduction_factor(self) -> float:
        return 1 - (self.risk_reduction_percent / 100)


class ScenarioInput(BaseModel):
    """Input definition for a cyber-risk scenario."""
    name: str = Field(..., description="Scenario name/identifier")
    probability: float = Field(..., ge=0, le=1, description="Annual breach probability [0,1]")
    impact: float = Field(..., gt=0, description="Dollar impact if breach occurs")
    description: Optional[str] = Field(None, description="Optional free-text description")


class ScenarioComparison(BaseModel):
    """Result of comparing baseline vs post-mitigation scenario."""
    scenario_name: str
    baseline_el: float
    post_mitigation_el: float
    expected_loss_reduction: float
    probability_reduction: float
    assumptions: List[str] = Field(default_factory=list)


class AllocationInput(BaseModel):
    """Input for capital allocation optimization."""
    budget: float = Field(..., gt=0, description="Total security budget in dollars")
    mitigations: List[MitigationMeasure] = Field(
        ..., description="Candidate mitigation measures"
    )


class AllocationOutput(BaseModel):
    """Output from capital allocation optimization."""
    selected_measures: List[MitigationMeasure]
    total_cost: float
    total_risk_reduction_percent: float
    baseline_expected_loss: float
    residual_expected_loss: float
    expected_loss_reduction: float
    allocation_efficiency: float  # reduction_per_dollar
    assumptions: List[str] = Field(default_factory=list)


class CapitalAllocationSummary(BaseModel):
    """High-level summary for API response."""
    total_budget: float
    budget_used: float
    measures_allocated: int
    baseline_el: float
    residual_el: float
    el_reduction: float
    recommended_allocations: List[MitigationMeasure]