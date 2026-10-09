from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router

app = FastAPI(
    title="CyberQuant API",
    description=(
        "Cyber Risk Quantification and Financial Loss Estimation Engine. "
        "Provides REST endpoints for threat frequency analysis, single loss expectancy (SLE), "
        "annual loss expectancy (ALE), security control ROI, and multi-scenario comparison."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for React frontend integration during hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production if necessary
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 API endpoints under /api/v1
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def root():
    """
    Root endpoint welcome message.
    """
    return {
        "message": "Welcome to CyberQuant Engine API",
        "documentation": "/docs",
        "api_v1_prefix": "/api/v1"
    }
