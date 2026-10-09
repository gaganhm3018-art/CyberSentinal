"""Tests for capital_allocator module."""

from app.schemas.allocation import RiskEstimate, MitigationMeasure, AllocationOutput
from app.services.capital_allocator import allocate_capital, allocate_from_input, allocation_summary


class TestCapitalAllocator:
    """Tests for capital allocation optimization."""

    def test_allocation_within_budget(self):
        """Test that selected measures total cost does not exceed budget."""
        budget = 100000
        measures = [
            MitigationMeasure(name="Firewall", cost=50000, risk_reduction_percent=50),
            MitigationMeasure(name="Training", cost=30000, risk_reduction_percent=30),
            MitigationMeasure(name="Encryption", cost=80000, risk_reduction_percent=80),
        ]
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        output = allocate_capital(budget, measures, baseline)

        assert output.total_cost <= budget
        assert output.total_cost > 0

    def test_selected_measures_cost_sum(self):
        """Test that total cost equals sum of selected measure costs."""
        budget = 100000
        measures = [
            MitigationMeasure(name="A", cost=20000, risk_reduction_percent=40),
            MitigationMeasure(name="B", cost=30000, risk_reduction_percent=50),
            MitigationMeasure(name="C", cost=60000, risk_reduction_percent=80),
        ]
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        output = allocate_capital(budget, measures, baseline)

        expected_cost = sum(m.cost for m in output.selected_measures)
        assert output.total_cost == expected_cost

    def test_empty_mitigations(self):
        """Test with no mitigations provided."""
        budget = 100000
        measures: list[MitigationMeasure] = []
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        output = allocate_capital(budget, measures, baseline)

        assert output.selected_measures == []
        assert output.total_cost == 0.0
        assert output.baseline_expected_loss == output.residual_expected_loss
        assert output.expected_loss_reduction == 0.0

    def test_zero_budget(self):
        """Test with zero budget - no mitigations can be selected."""
        budget = 0
        measures = [
            MitigationMeasure(name="Firewall", cost=50000, risk_reduction_percent=50),
        ]
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        output = allocate_capital(budget, measures, baseline)

        assert output.total_cost == 0.0
        assert output.selected_measures == []
        assert output.baseline_expected_loss == output.residual_expected_loss

    def test_mitigations_more_expensive_than_budget(self):
        """Test when all mitigations exceed the available budget."""
        budget = 10000
        measures = [
            MitigationMeasure(name="Expensive", cost=50000, risk_reduction_percent=80),
        ]
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        output = allocate_capital(budget, measures, baseline)

        assert output.total_cost == 0.0
        assert output.selected_measures == []
        assert output.baseline_expected_loss == output.residual_expected_loss

    def test_internal_consistency(self):
        """Test that baseline and residual EL are internally consistent."""
        budget = 50000
        measures = [
            MitigationMeasure(name="A", cost=20000, risk_reduction_percent=50),
            MitigationMeasure(name="B", cost=25000, risk_reduction_percent=40),
        ]
        baseline = RiskEstimate(probability=0.2, impact=2_000_000)
        output = allocate_capital(budget, measures, baseline)

        # baseline EL = 0.2 * 2M = 400000
        assert output.baseline_expected_loss == 400000.0

        # After mitigations A and B (cost 45k <= 50k):
        # probability reduction factor = (1-0.5) * (1-0.4) = 0.5 * 0.6 = 0.3
        # post_probability = 0.2 * 0.3 = 0.06
        # residual EL = 0.06 * 2M = 120000
        expected_residual = 0.06 * 2_000_000
        assert abs(output.residual_expected_loss - expected_residual) < 0.01

        # EL reduction = 400000 - 120000 = 280000
        assert abs(output.expected_loss_reduction - 280000.0) < 0.01

    def test_cost_effectiveness_ordering(self):
        """Test that more cost-effective measures are preferred."""
        budget = 100000
        # Measure X: 50% reduction at $100 cost = 0.5/100 = 0.005 per dollar
        # Measure Y: 30% reduction at $50 cost = 0.3/50 = 0.006 per dollar (more efficient)
        # Measure Z: 80% reduction at $200 cost = 0.8/200 = 0.004 per dollar (less efficient)
        measures = [
            MitigationMeasure(name="X", cost=100, risk_reduction_percent=50),
            MitigationMeasure(name="Y", cost=50, risk_reduction_percent=30),
            MitigationMeasure(name="Z", cost=200, risk_reduction_percent=80),
        ]
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        output = allocate_capital(budget, measures, baseline)

        # Y is most efficient, should be selected first
        # After selecting Y ($50), X ($50) = $100 total, leaving $99k unused but no more fit
        # Actually Y(50) + X(100) = 150 <= 100k, so both should be selected
        # Z costs 200 but with 100k budget, Y + X + Z = 50 + 100 + 200 = 350 <= 100k, so all fit
        # Wait, all three fit within 100k budget (50+100+200=350). Let me re-check.
        # The test should verify that cost-effectiveness ordering matters.

        # With budget=100, only Y(50) + X(100) would exceed, so only Y fits
        # Let me adjust the test
        budget_tight = 100
        output_tight = allocate_capital(budget_tight, measures, baseline)
        # Most cost-effective (Y at 0.006) should be selected first
        selected_names = [m.name for m in output_tight.selected_measures]
        assert "Y" in selected_names  # Y should be selected due to best cost-effectiveness

    def test_allocate_from_input(self):
        """Test convenience function with raw parameters."""
        budget = 50000
        measures = [
            MitigationMeasure(name="Firewall", cost=30000, risk_reduction_percent=50),
        ]
        output = allocate_from_input(budget, measures, 0.1, 1_000_000)

        assert output.total_cost == 30000
        assert output.baseline_expected_loss == 100000.0  # 0.1 * 1M
        # After firewall: 0.1 * 0.5 * 1M = 50000
        assert abs(output.residual_expected_loss - 50000.0) < 0.01
        assert abs(output.expected_loss_reduction - 50000.0) < 0.01

    def test_allocation_summary(self):
        """Test summary creation from allocation output."""
        budget = 100000
        measures = [
            MitigationMeasure(name="Firewall", cost=50000, risk_reduction_percent=50),
        ]
        baseline = RiskEstimate(probability=0.1, impact=1_000_000)
        output = allocate_capital(budget, measures, baseline)
        summary = allocation_summary(output, budget)

        assert summary.total_budget == budget
        assert summary.budget_used == 50000
        assert summary.measures_allocated == 1
        assert summary.baseline_el == 100000.0
        assert summary.residual_el == 50000.0
        assert summary.el_reduction == 50000.0