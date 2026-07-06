from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import RandomForestClassifier

router = APIRouter()

# Pre-trained classifier using synthetic decision boundaries
# In production, this would be trained on historical NHCC project data
clf = RandomForestClassifier(n_estimators=50, random_state=42)

# Generate synthetic training data
np.random.seed(42)
n_samples = 500
X_train = np.column_stack([
    np.random.uniform(0, 100, n_samples),       # completion %
    np.random.uniform(0, 150, n_samples),        # budget utilization %
    np.random.uniform(0, 36, n_samples),         # months elapsed
    np.random.uniform(0, 36, n_samples),         # planned duration
    np.random.randint(0, 50, n_samples),         # open tasks
    np.random.randint(0, 10, n_samples),         # blocked tasks
])

# Risk labels based on heuristic rules
y_train = []
for row in X_train:
    completion, util, elapsed, planned, open_tasks, blocked = row
    schedule_ratio = elapsed / max(planned, 1)
    risk_score = 0
    if util > 100: risk_score += 2
    if util > 80 and completion < 50: risk_score += 1
    if schedule_ratio > 0.8 and completion < 60: risk_score += 2
    if blocked > 3: risk_score += 1
    if risk_score >= 3:
        y_train.append("red")
    elif risk_score >= 1:
        y_train.append("amber")
    else:
        y_train.append("green")

clf.fit(X_train, y_train)


class RiskRequest(BaseModel):
    completion: float
    budget_utilization: float
    months_elapsed: int
    planned_duration_months: int
    open_tasks: int
    blocked_tasks: int


class RiskResponse(BaseModel):
    predicted_rag: str
    confidence: float
    risk_factors: list[str]
    recommendation: str


@router.post("/classify", response_model=RiskResponse)
def classify_risk(req: RiskRequest):
    """Classify project risk using ML model."""
    features = np.array([[
        req.completion, req.budget_utilization, req.months_elapsed,
        req.planned_duration_months, req.open_tasks, req.blocked_tasks,
    ]])

    prediction = clf.predict(features)[0]
    probas = clf.predict_proba(features)[0]
    confidence = float(max(probas))

    factors = []
    if req.budget_utilization > 100:
        factors.append(f"Budget overrun: {req.budget_utilization:.0f}% utilization")
    if req.budget_utilization > 80 and req.completion < 50:
        factors.append("High spending with low completion")
    schedule_ratio = req.months_elapsed / max(req.planned_duration_months, 1)
    if schedule_ratio > 0.8 and req.completion < 60:
        factors.append(f"Schedule risk: {req.completion:.0f}% done with {schedule_ratio:.0%} time elapsed")
    if req.blocked_tasks > 3:
        factors.append(f"{req.blocked_tasks} blocked tasks need attention")
    if not factors:
        factors.append("No significant risk factors identified")

    recommendations = {
        "red": "Immediate management intervention required. Consider project restructuring or additional resources.",
        "amber": "Close monitoring needed. Address risk factors to prevent escalation.",
        "green": "Project is on track. Continue with current approach.",
    }

    return RiskResponse(
        predicted_rag=prediction,
        confidence=round(confidence, 2),
        risk_factors=factors,
        recommendation=recommendations.get(prediction, "Monitor project status."),
    )


@router.post("/batch")
def batch_classify(projects: list[dict]):
    """Classify risk for multiple projects."""
    results = []
    for p in projects:
        req = RiskRequest(
            completion=p.get("completion", 0),
            budget_utilization=p.get("budget_utilization", 0),
            months_elapsed=p.get("months_elapsed", 0),
            planned_duration_months=p.get("planned_duration_months", 12),
            open_tasks=p.get("open_tasks", 0),
            blocked_tasks=p.get("blocked_tasks", 0),
        )
        result = classify_risk(req)
        results.append({"project_id": p.get("project_id"), "name": p.get("name"), **result.model_dump()})
    return results
