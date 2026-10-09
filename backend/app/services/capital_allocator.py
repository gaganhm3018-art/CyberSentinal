from typing import List
from app.schemas.allocation import (
    AllocationInput,
    AllocationOutput,
    MitigationMeasure,
    RiskEstimate,
    CapitalAllocationSummary,
)


def allocate_capital(
    budget: float,
    mitigations: List[MitigationMeasure],
    baseline_risk: RiskEstimate,
) -> AllocationOutput:
    """Identify a feasible allocation within the available budget.

    Uses a greedy cost-effectiveness approach:
        1. Sort mitigations by risk_reduction_percent / cost ratio (descending)
        2. Select mitigations from most cost-effective until budget is exhausted
        3. Calculate baseline vs residual expected loss

    Mathematical model:
        - Expected Loss (EL) = probability × impact
        - Each mitigation reduces probability by its risk_reduction_percent
        - Applied reductions are multiplicative: final_probability =
          baseline_probability × product of (1 - r_i/100) for selected mitigations i

    Args:
        budget: Total security budget in dollars
        mitigations: List of candidate mitigation measures
        baseline_risk: RiskEstimate representing current risk before any allocation

    Returns:
        AllocationOutput with selected measures and risk comparison
    """
    # Sort by cost-effectiveness: more risk reduction per dollar first
    sorted_measures = sorted(
        mitigations,
        key=lambda m: m.risk_reduction_percent / m.cost if m.cost > 0 else float("inf"),
        reverse=True,
    )

    selected: List[MitigationMeasure] = []
    total_cost = 0.0

    for measure in sorted_measures:
        if total_cost + measure.cost <= budget:
            selected.append(measure)
            total_cost += measure.cost

    # Calculate risk before and after allocation
    # Baseline expected loss
    baseline_el = baseline_risk.expected_loss

    # Post-allocation probability: multiplicative reduction
    # If no mitigations selected, probability remains unchanged
    probability_reduction_factor = 1.0
    for measure in selected:
        probability_reduction_factor *= measure.risk_reduction_factor

    post_probability = baseline_risk.probability * probability_reduction_factor
    residual_el = post_probability * baseline_risk.impact

    el_reduction = baseline_el - residual_el

    # Efficiency: expected loss reduction per dollar spent
    allocation_efficiency = el_reduction / total_cost if total_cost > 0 else 0.0

    # Total risk reduction percentage (vs baseline)
    total_risk_reduction_percent = (
        100.0 * (1 - probability_reduction_factor) if probability_reduction_factor <= 1.0 else 0.0
    )

    return AllocationOutput(
        selected_measures=selected,
        total_cost=total_cost,
        total_risk_reduction_percent=total_risk_reduction_percent,
        baseline_expected_loss=baseline_el,
        residual_expected_loss=residual_el,
        expected_loss_reduction=el_reduction,
        allocation_efficiency=allocation_efficiency,
        assumptions=[
            "Mitigations are applied independently and their probability-reduction effects are multiplicative",
            "Risk-reduction percentages are annual and hold constant over the analysis period",
            "Costs are deterministic and fully available within the budget",
            "Baseline risk parameters (probability, impact) are known without estimation error",
        ],
    )


def allocate_from_input(
    budget: float,
    mitigations: List[MitigationMeasure],
    baseline_probability: float,
    baseline_impact: float,
) -> AllocationOutput:
    """Allocate capital given raw risk parameters instead of a RiskEstimate.

    Convenience wrapper that constructs a RiskEstimate internally.

    Args:
        budget: Total security budget in dollars
        mitigations: List of candidate mitigation measures
        baseline_probability: Annual breach probability [0,1] before any mitigation
        baseline_impact: Dollar impact if breach occurs

    Returns:
        AllocationOutput with selected measures and risk comparison
    """
    baseline_risk = RiskEstimate(
        probability=baseline_probability,
        impact=baseline_impact,
    )
    return allocate_capital(budget, mitigations, baseline_risk)


def allocation_summary(
    output: AllocationOutput,
    total_budget: float,
) -> CapitalAllocationSummary:
    """Create a high-level summary from an AllocationOutput.

    Args:
        output: AllocationOutput from allocate_capital or allocate_from_input
        total_budget: The original total budget considered

    Returns:
        CapitalAllocationSummary with key figures for display
    """
    return CapitalAllocationSummary(
        total_budget=total_budget,
        budget_used=output.total_cost,
        measures_allocated=len(output.selected_measures),
        baseline_el=output.baseline_expected_loss,
        residual_el=output.residual_expected_loss,
        el_reduction=output.expected_loss_reduction,
        recommended_allocations=output.selected_measures,
    )