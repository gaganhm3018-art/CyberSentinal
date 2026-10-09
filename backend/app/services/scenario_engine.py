from typing import List
from app.schemas.allocation import (
    RiskEstimate,
    MitigationMeasure,
    ScenarioInput,
    ScenarioComparison,
)


def compare_scenarios(
    baseline: RiskEstimate,
    mitigation: MitigationMeasure,
    assumptions: List[str] = None,
) -> ScenarioComparison:
    """Compare baseline risk with risk after a proposed mitigation.

    Calculates the change in expected loss from applying a mitigation measure.

    Mathematical model:
        - Expected Loss (EL) = probability × impact
        - Post-mitigation probability = probability × (1 - risk_reduction_percent/100)
        - EL reduction = baseline_el - post_mitigation_el

    Args:
        baseline: RiskEstimate before mitigation
        mitigation: MitigationMeasure with risk_reduction_percent
        assumptions: Optional list of assumptions/uncertainties

    Returns:
        ScenarioComparison with structured results
    """
    if assumptions is None:
        assumptions = []

    baseline_el = baseline.expected_loss
    post_probability = baseline.probability * mitigation.risk_reduction_factor
    post_mitigation_el = post_probability * baseline.impact
    el_reduction = baseline_el - post_mitigation_el
    probability_reduction = baseline.probability - post_probability

    return ScenarioComparison(
        scenario_name="",
        baseline_el=baseline_el,
        post_mitigation_el=post_mitigation_el,
        expected_loss_reduction=el_reduction,
        probability_reduction=probability_reduction,
        assumptions=assumptions,
    )


def scenario_from_input(
    scenario: ScenarioInput,
) -> RiskEstimate:
    """Convert a ScenarioInput into a RiskEstimate."""
    return RiskEstimate(
        probability=scenario.probability,
        impact=scenario.impact,
    )


def compare_scenario_objects(
    baseline_scenario: ScenarioInput,
    mitigation: MitigationMeasure,
    assumptions: List[str] = None,
) -> ScenarioComparison:
    """Compare two scenario objects with a mitigation.

    Convenience function that converts ScenarioInput to RiskEstimate
    and then compares baseline vs post-mitigation.

    Args:
        baseline_scenario: ScenarioInput representing the baseline risk
        mitigation: MitigationMeasure to apply
        assumptions: Optional list of assumptions/uncertainties

    Returns:
        ScenarioComparison with results
    """
    baseline = scenario_from_input(baseline_scenario)
    return compare_scenarios(baseline, mitigation, assumptions)