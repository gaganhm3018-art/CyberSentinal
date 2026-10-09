from fastapi import APIRouter, status
from app.schemas.risk import (
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
)
from app.services.risk_engine import RiskEngineService

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """
    Health check endpoint for the Risk Quantification Service.
    Used by frontend and monitoring tools to verify backend status.
    """
    return {
        "status": "online",
        "service": "CyberQuant Risk Engine API",
        "version": "1.0.0"
    }


@router.post(
    "/assess",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Quantify Cyber Risk Scenario",
    description="Calculates annual loss expectancy (ALE), single loss expectancy (SLE), and security ROI for a cyber risk scenario."
)
def assess_risk(request: RiskAssessmentRequest) -> RiskAssessmentResponse:
    """
    Accepts cyber risk parameters, validates inputs, and returns financial risk metrics.
    """
    return RiskEngineService.calculate_single_risk(request)


@router.post(
    "/compare",
    response_model=ScenarioComparisonResponse,
    status_code=status.HTTP_200_OK,
    summary="Compare Multiple Cyber Risk Scenarios",
    description="Evaluates multiple risk scenarios side-by-side to compare financial impact and total risk reduction potential."
)
def compare_scenarios(request: ScenarioComparisonRequest) -> ScenarioComparisonResponse:
    """
    Accepts a list of risk scenarios and returns aggregated baseline vs mitigated metrics.
    """
    return RiskEngineService.compare_scenarios(request)
