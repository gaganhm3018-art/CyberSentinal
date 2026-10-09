from typing import List
from app.schemas.risk import (
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskMetrics,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
)


class RiskEngineService:
    """
    Core financial risk quantification service.
    Implements quantitative risk analysis based on FAIR (Factor Analysis of Information Risk).
    """

    @staticmethod
    def calculate_single_risk(request: RiskAssessmentRequest) -> RiskAssessmentResponse:
        """
        Quantify annual financial risk metrics for a given cyber risk scenario.
        """
        # 1. Single Loss Expectancy (SLE) = Direct Loss + Indirect Loss
        sle = request.direct_loss + request.indirect_loss

        # 2. Baseline Loss Event Frequency (LEF) = Threat Event Frequency * Vulnerability Probability
        lef = request.threat_event_frequency * request.vulnerability_probability

        # 3. Baseline Annual Loss Expectancy (ALE) = LEF * SLE
        baseline_ale = lef * sle

        mitigated_ale = None
        annual_risk_reduction = None
        security_roi = None

        # 4. If mitigated vulnerability probability is provided, calculate mitigated risk metrics
        if request.mitigated_vulnerability_probability is not None:
            mitigated_lef = request.threat_event_frequency * request.mitigated_vulnerability_probability
            mitigated_ale = mitigated_lef * sle
            annual_risk_reduction = baseline_ale - mitigated_ale

            # Calculate Security ROI percentage if security control cost is specified and > 0
            if request.proposed_security_cost and request.proposed_security_cost > 0:
                net_savings = annual_risk_reduction - request.proposed_security_cost
                security_roi = (net_savings / request.proposed_security_cost) * 100.0

        # Construct explicit model assumptions list
        assumptions = [
            f"Threat Event Frequency (TEF): {request.threat_event_frequency:.2f} attempts/year.",
            f"Baseline Vulnerability Probability: {request.vulnerability_probability * 100:.1f}%.",
            f"Single Loss Expectancy (SLE): ${sle:,.2f} per event (${request.direct_loss:,.2f} direct + ${request.indirect_loss:,.2f} indirect).",
            "Linear Loss Event Frequency (LEF = TEF * Vulnerability) assumed under standard FAIR principles.",
            "Calculations use deterministic expected annual monetary values."
        ]

        # Generate actionable financial recommendation
        if mitigated_ale is not None and request.proposed_security_cost:
            if annual_risk_reduction > request.proposed_security_cost:
                recommendation = (
                    f"RECOMMENDED: Deploy security controls. The proposed investment of ${request.proposed_security_cost:,.2f} "
                    f"yields an estimated annual financial risk reduction of ${annual_risk_reduction:,.2f} "
                    f"(Net ROI: {security_roi:.1f}%)."
                )
            else:
                recommendation = (
                    f"CAUTION: The proposed security control cost (${request.proposed_security_cost:,.2f}) exceeds "
                    f"the expected annual risk reduction (${annual_risk_reduction:,.2f}). Re-evaluate control scope or vendor pricing."
                )
        else:
            recommendation = (
                f"BASELINE RISK: Unmitigated Annual Loss Expectancy is ${baseline_ale:,.2f}. "
                "Provide proposed control costs and mitigated vulnerability to compute investment ROI."
            )

        metrics = RiskMetrics(
            loss_event_frequency=round(lef, 4),
            single_loss_expectancy=round(sle, 2),
            annual_loss_expectancy=round(baseline_ale, 2),
            mitigated_annual_loss_expectancy=round(mitigated_ale, 2) if mitigated_ale is not None else None,
            annual_risk_reduction=round(annual_risk_reduction, 2) if annual_risk_reduction is not None else None,
            security_roi_percentage=round(security_roi, 2) if security_roi is not None else None,
        )

        return RiskAssessmentResponse(
            scenario_name=request.scenario_name,
            asset_name=request.asset_name,
            asset_value=request.asset_value,
            metrics=metrics,
            assumptions=assumptions,
            recommendation=recommendation,
        )

    @classmethod
    def compare_scenarios(cls, request: ScenarioComparisonRequest) -> ScenarioComparisonResponse:
        """
        Evaluate and aggregate financial risk metrics across multiple cyber risk scenarios.
        """
        assessments: List[RiskAssessmentResponse] = []
        total_baseline_ale = 0.0
        total_mitigated_ale = 0.0
        total_potential_savings = 0.0

        for scenario in request.scenarios:
            assessment = cls.calculate_single_risk(scenario)
            assessments.append(assessment)

            total_baseline_ale += assessment.metrics.annual_loss_expectancy
            if assessment.metrics.mitigated_annual_loss_expectancy is not None:
                total_mitigated_ale += assessment.metrics.mitigated_annual_loss_expectancy
                total_potential_savings += (assessment.metrics.annual_risk_reduction or 0.0)
            else:
                total_mitigated_ale += assessment.metrics.annual_loss_expectancy

        return ScenarioComparisonResponse(
            assessments=assessments,
            total_baseline_ale=round(total_baseline_ale, 2),
            total_mitigated_ale=round(total_mitigated_ale, 2),
            total_potential_savings=round(total_potential_savings, 2),
        )
