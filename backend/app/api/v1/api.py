from fastapi import APIRouter
from app.api.v1.endpoints import risk

api_router = APIRouter()

# Register risk assessment endpoints under /risk prefix
api_router.include_router(
    risk.router, 
    prefix="/risk", 
    tags=["Cyber Risk Quantification"]
)
