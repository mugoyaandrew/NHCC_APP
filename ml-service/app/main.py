from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import forecast, risk

app = FastAPI(
    title="NHCC Financial Advisor",
    description="AI-powered budget forecasting and risk analysis for NHCC projects",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast.router, prefix="/api/forecast", tags=["Forecast"])
app.include_router(risk.router, prefix="/api/risk", tags=["Risk"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "nhcc-ml"}
