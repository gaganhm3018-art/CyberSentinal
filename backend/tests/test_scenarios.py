"""Tests for scenario_engine module."""

from app.schemas.allocation import RiskEstimate, MitigationMeasure, ScenarioInput
from app.services.scenario_engine import compare_scenarios, compare_scenario_objects, scenario_from_input


class TestScenarioComparison:
    """Tests for a scenario comparison functionality."""

    def test_basic_comparison(self):
        """Test basic baseline vs post-mitigation comparison."""
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        mitigation = MitigationMeasure(name="Firewall", cost=50000, risk_reduction_percent=50)
        result = compare_scenarios(baseline, mitigation)

        assert result.baseline_el == 100000.0
        assert result.post_mitigation_el == 50000.0
        assert result.expected_loss_reduction == 50000.0
        assert result.probability_reduction == 0.05
        assert len(result.assumptions) == 0

    def test_probability_reduction(self):
        """Test that probability reduction is correctly calculated."""
        baseline = RiskEstimate(probability=0.2, impact=500000)
        mitigation = MitigationMeasure(name="Training", cost=20000, risk_reduction_percent=80)
        result = compare_scenarios(baseline, mitigation)

        # post_probability = 0.2 * (1 - 0.8) = 0.04
        # baseline_el = 0.2 * 500000 = 100000
        # post_mitigation_el = 0.04 * 500000 = 20000
        # el_reduction = 100000 - 20000 = 80000
        assert abs(result.post_mitigation_el - 20000.0) < 0.01
        assert abs(result.expected_loss_reduction - 80000.0) < 0.01
        assert abs(result.probability_reduction - 0.16) < 0.001

    def test_no_reduction(self):
        """Test with 0% risk reduction - no change."""
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        mitigation = MitigationMeasure(name="No-op", cost=1000, risk_reduction_percent=0)
        result = compare_scenarios(baseline, mitigation)

        assert result.baseline_el == result.post_mitigation_el
        assert result.expected_loss_reduction == 0.0
        assert result.probability_reduction == 0.0

    def test_full_reduction(self):
        """Test with 100% risk reduction - probability goes to zero."""
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        mitigation = MitigationMeasure(name="Kill Switch", cost=100000, risk_reduction_percent=100)
        result = compare_scenarios(baseline, mitigation)

        assert result.post_mitigation_el == 0.0
        assert result.expected_loss_reduction == 100000.0
        assert result.probability_reduction == 0.1

    def test_compare_scenario_objects(self):
        """Test the convenience function."""
        baseline_scenario = ScenarioInput(probability=0.1, impact=1_000_000, name="Baseline")
        mitigation = MitigationMeasure(name="Firewall", cost=50000, risk_reduction_percent=50)
        result = compare_scenario_objects(baseline_scenario, mitigation)

        assert result.expected_loss_reduction == 50000.0
        assert result.baseline_el == 100000.0

    def test_scenario_from_input(self):
        """Test ScenarioInput to RiskEstimate conversion."""
        sci = ScenarioInput(probability=0.15, impact=200000, name="Test")
        re = scenario_from_input(sci)
        assert re.probability == 0.15
        assert re.impact == 200000
        assert re.expected_loss == 30000.0