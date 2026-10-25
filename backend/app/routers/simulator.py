import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from ..config import settings
from ..services.simulator import (
    ComplianceTimeMachineSimulator,
    InstitutionProfile,
    SimulationReport,
    SUPPORTED_RULE_VERSIONS
)

router = APIRouter(prefix="/simulator", tags=["Compliance Time Machine Simulator"])

SCENARIOS_DIR = settings.RECORDS_DIR / "scenarios"
SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)

class SimulationRequest(BaseModel):
    baseline: InstitutionProfile
    proposed: InstitutionProfile
    rule_version: str = "v2025_26"
    scenario_name: str = "Proposed Institutional Expansion"

@router.get("/rulesets")
def get_rulesets() -> List[Dict[str, Any]]:
    """Return configured versioned compliance rulebooks (2024-25, 2025-26, 2026-27 projected)."""
    return list(SUPPORTED_RULE_VERSIONS.values())

@router.post("/evaluate", response_model=SimulationReport)
def evaluate_scenario(payload: SimulationRequest) -> SimulationReport:
    """
    Run versioned compliance checks against both baseline and proposed scenario configurations.
    Returns structured before/after comparison with transitions, dependency cascade, and explanations.
    """
    try:
        report = ComplianceTimeMachineSimulator.run_simulation(
            baseline=payload.baseline,
            proposed=payload.proposed,
            rule_version_code=payload.rule_version,
            scenario_name=payload.scenario_name
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scenario simulation calculation failed: {str(e)}"
        )

@router.post("/save")
def save_scenario_report(report: SimulationReport) -> Dict[str, str]:
    """Save a scenario report to persistent storage."""
    file_path = SCENARIOS_DIR / f"{report.scenario_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(report.model_dump_json(indent=2))
    return {
        "status": "success",
        "message": f"Scenario '{report.scenario_name}' ({report.scenario_id}) persisted successfully.",
        "scenario_id": report.scenario_id
    }

@router.get("/saved-scenarios")
def list_saved_scenarios() -> List[Dict[str, Any]]:
    """List all saved scenario reports, newest first."""
    saved = []
    for f in SCENARIOS_DIR.glob("SIM-*.json"):
        try:
            with open(f, "r", encoding="utf-8") as fp:
                saved.append(json.load(fp))
        except Exception:
            continue
    saved.sort(key=lambda s: s.get("created_at", ""), reverse=True)
    return saved

@router.get("/saved-scenarios/{scenario_id}")
def get_saved_scenario(scenario_id: str) -> Dict[str, Any]:
    """Retrieve an individual saved scenario report by ID."""
    file_path = SCENARIOS_DIR / f"{scenario_id}.json"
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario report '{scenario_id}' not found."
        )
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)
