from fastapi import APIRouter
from app.api.v1.endpoints import risk, simulation

api_router = APIRouter()

# Register risk assessment endpoints under /risk prefix
api_router.include_router(
    risk.router, 
    prefix="/risk", 
    tags=["Cyber Risk Quantification"]
)

# Register AI agent simulation endpoints under /simulation prefix
api_router.include_router(
    simulation.router,
    prefix="/simulation",
    tags=["AI Agent Cyber Simulation"]
)
