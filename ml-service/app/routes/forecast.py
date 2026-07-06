from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np
from sklearn.linear_model import LinearRegression

router = APIRouter()


class ForecastRequest(BaseModel):
    budget: float
    spent: float
    completion: float
    months_elapsed: int
    planned_duration_months: int


class ForecastResponse(BaseModel):
    projected_total_cost: float
    projected_overrun: float
    overrun_percentage: float
    monthly_burn_rate: float
    months_remaining: int
    confidence: float
    recommendation: str


@router.post("/budget", response_model=ForecastResponse)
def forecast_budget(req: ForecastRequest):
    """Forecast final project cost based on current spending trajectory."""
    months_elapsed = max(req.months_elapsed, 1)
    months_remaining = max(req.planned_duration_months - months_elapsed, 1)
    monthly_burn = req.spent / months_elapsed

    # Simple linear projection
    if req.completion > 0:
        cost_per_percent = req.spent / req.completion
        projected_total = cost_per_percent * 100
    else:
        projected_total = monthly_burn * req.planned_duration_months

    overrun = projected_total - req.budget
    overrun_pct = (overrun / req.budget * 100) if req.budget > 0 else 0

    # Confidence based on completion
    confidence = min(0.5 + (req.completion / 200), 0.95)

    if overrun_pct > 20:
        recommendation = "CRITICAL: Project is projected to significantly exceed budget. Immediate cost review recommended."
    elif overrun_pct > 10:
        recommendation = "WARNING: Budget overrun likely. Consider scope adjustments or additional funding."
    elif overrun_pct > 0:
        recommendation = "CAUTION: Minor budget overrun projected. Monitor spending closely."
    else:
        recommendation = "ON TRACK: Project spending is within budget projections."

    return ForecastResponse(
        projected_total_cost=round(projected_total, 2),
        projected_overrun=round(max(overrun, 0), 2),
        overrun_percentage=round(max(overrun_pct, 0), 2),
        monthly_burn_rate=round(monthly_burn, 2),
        months_remaining=months_remaining,
        confidence=round(confidence, 2),
        recommendation=recommendation,
    )


class BatchForecastItem(BaseModel):
    project_id: int
    name: str
    budget: float
    spent: float
    completion: float
    months_elapsed: int
    planned_duration_months: int


@router.post("/batch")
def batch_forecast(projects: list[BatchForecastItem]):
    """Forecast budgets for multiple projects."""
    results = []
    for p in projects:
        req = ForecastRequest(
            budget=p.budget, spent=p.spent, completion=p.completion,
            months_elapsed=p.months_elapsed,
            planned_duration_months=p.planned_duration_months,
        )
        forecast = forecast_budget(req)
        results.append({"project_id": p.project_id, "name": p.name, **forecast.model_dump()})
    return results
