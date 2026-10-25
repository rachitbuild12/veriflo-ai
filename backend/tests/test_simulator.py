import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.simulator import (
    ComplianceTimeMachineSimulator,
    InstitutionProfile,
    CourseItem
)

client = TestClient(app)

def create_sample_baseline() -> InstitutionProfile:
    return InstitutionProfile(
        pid="1-4359812451",
        name="Apex Horizon Institute of Technology & Management",
        category="Engineering & Technology",
        approved_intake_total=240,
        admitted_strength_total=920,
        total_faculty_count=52,
        professors_count=6,
        associate_professors_count=12,
        assistant_professors_count=34,
        phd_faculty_count=18,
        total_land_acres=4.5,
        total_builtup_area_sqm=4200.0,
        classrooms_count=22,
        laboratories_count=14,
        computer_terminals=280,
        library_volumes=18500,
        annual_budget_lakhs=280.0,
        courses=[
            CourseItem(id="C1", name="Computer Science & Engineering", intake=120, level="UG", is_nba_accredited=True),
            CourseItem(id="C2", name="Mechanical Engineering", intake=60, level="UG", is_nba_accredited=True),
            CourseItem(id="C3", name="Electronics & Communication", intake=60, level="UG", is_nba_accredited=False),
        ],
        has_architect_certificate=True,
        has_land_mutation_clearance=True,
        has_fire_safety_noc=True,
        has_university_affiliation=True,
        nba_accredited_programs_count=2
    )

def test_scenario_comparison_intake_expansion_creates_deficit():
    """Increasing intake from 240 to 360 without adding faculty creates PASS_TO_FAIL transitions."""
    baseline = create_sample_baseline()
    proposed = baseline.model_copy(deep=True)
    
    # Propose intake expansion from 240 to 360 (+120 seats), without increasing faculty (52)
    proposed.approved_intake_total = 360

    report = ComplianceTimeMachineSimulator.run_simulation(
        baseline=baseline,
        proposed=proposed,
        rule_version_code="v2025_26",
        scenario_name="Expansion to 360 without Faculty Growth"
    )

    assert report.baseline_pid == baseline.pid
    assert report.metric_deltas["intake"]["delta"] == 120
    assert report.transition_counts["PASS_TO_FAIL"] >= 1

    # SFR Check: For 360 intake (1,440 students at 1:20 SFR), 72 faculty required; only 52 available -> PASS_TO_FAIL
    sfr_check = [c for c in report.checks if c.rule_id == "RULE-SIM-SFR-01"][0]
    assert sfr_check.baseline_passed is True
    assert sfr_check.proposed_passed is False
    assert sfr_check.transition == "PASS_TO_FAIL"
    assert "New Deficit Created" in sfr_check.transition_label
    assert "[Illustrative Demo Rule" in sfr_check.rule_label

def test_scenario_comparison_remediation_creates_fail_to_pass():
    """Remediating deficient senior cadre produces a FAIL_TO_PASS transition."""
    baseline = create_sample_baseline()
    # Baseline has deficient professors (0 professors)
    baseline.professors_count = 0
    
    proposed = baseline.model_copy(deep=True)
    # Proposed hires 6 professors
    proposed.professors_count = 6
    proposed.phd_faculty_count = 20

    report = ComplianceTimeMachineSimulator.run_simulation(
        baseline=baseline,
        proposed=proposed,
        rule_version_code="v2025_26",
        scenario_name="Cadre Remediation Scenario"
    )

    cadre_check = [c for c in report.checks if c.rule_id == "RULE-SIM-CAD-02"][0]
    assert cadre_check.baseline_passed is False
    assert cadre_check.proposed_passed is True
    assert cadre_check.transition == "FAIL_TO_PASS"
    assert "Deficiency Remediated" in cadre_check.transition_label

def test_missing_inputs_and_assumptions_handling():
    """Missing architect certificate or unverified land mutation triggers UNRESOLVED_ASSUMPTION."""
    baseline = create_sample_baseline()
    proposed = baseline.model_copy(deep=True)
    
    # Propose expansion with unverified municipal/architect documentation
    proposed.has_architect_certificate = False
    proposed.has_land_mutation_clearance = False

    report = ComplianceTimeMachineSimulator.run_simulation(
        baseline=baseline,
        proposed=proposed,
        rule_version_code="v2025_26",
        scenario_name="Unverified Assumption Simulation"
    )

    assert report.transition_counts["UNRESOLVED_ASSUMPTION"] >= 1
    evidence_check = [c for c in report.checks if c.rule_id == "RULE-SIM-ASM-10"][0]
    assert evidence_check.transition == "UNRESOLVED_ASSUMPTION"
    assert evidence_check.is_assumption is True
    assert "assumed readiness" in evidence_check.explanation.lower()
    assert "unverified assumption" in evidence_check.proposed_value.lower()

def test_rule_version_changes_impact():
    """Same faculty strength passes under v2025_26 (SFR 1:20) but fails under stricter v2026_27 (SFR 1:15)."""
    baseline = create_sample_baseline()
    baseline.approved_intake_total = 240
    # 240 * 4 = 960 students
    # 52 faculty:
    # At 1:20 SFR (v2025_26): 960 / 20 = 48 required faculty -> 52 >= 48 (PASS)
    # At 1:15 SFR (v2026_27): 960 / 15 = 64 required faculty -> 52 < 64 (FAIL)

    proposed = baseline.model_copy(deep=True)

    report_current = ComplianceTimeMachineSimulator.run_simulation(
        baseline=baseline,
        proposed=proposed,
        rule_version_code="v2025_26"
    )
    sfr_current = [c for c in report_current.checks if c.rule_id == "RULE-SIM-SFR-01"][0]
    assert sfr_current.proposed_passed is True

    report_projected = ComplianceTimeMachineSimulator.run_simulation(
        baseline=baseline,
        proposed=proposed,
        rule_version_code="v2026_27"
    )
    sfr_projected = [c for c in report_projected.checks if c.rule_id == "RULE-SIM-SFR-01"][0]
    assert sfr_projected.proposed_passed is False
    assert "1:15" in sfr_projected.benchmark_threshold

def test_zero_mutation_guarantee():
    """Verification that running simulation never alters the baseline institution object."""
    baseline = create_sample_baseline()
    original_intake = baseline.approved_intake_total
    original_faculty = baseline.total_faculty_count

    proposed = baseline.model_copy(deep=True)
    proposed.approved_intake_total = 540
    proposed.total_faculty_count = 100

    report = ComplianceTimeMachineSimulator.run_simulation(
        baseline=baseline,
        proposed=proposed,
        rule_version_code="v2025_26"
    )

    # Baseline remains 100% pristine and unaltered
    assert baseline.approved_intake_total == original_intake == 240
    assert baseline.total_faculty_count == original_faculty == 52

def test_api_simulator_endpoints():
    """Test FastAPI simulator endpoints (rulesets, evaluate, save, get)."""
    # 1. Rulesets
    rulesets_res = client.get("/api/simulator/rulesets")
    assert rulesets_res.status_code == 200
    versions = rulesets_res.json()
    assert len(versions) >= 3
    version_codes = [v["code"] for v in versions]
    assert "v2025_26" in version_codes
    assert "v2026_27" in version_codes

    # 2. Evaluate
    baseline = create_sample_baseline()
    proposed = baseline.model_copy(deep=True)
    proposed.approved_intake_total = 300

    eval_res = client.post(
        "/api/simulator/evaluate",
        json={
            "baseline": baseline.model_dump(),
            "proposed": proposed.model_dump(),
            "rule_version": "v2025_26",
            "scenario_name": "API Test Scenario"
        }
    )
    assert eval_res.status_code == 200
    report_data = eval_res.json()
    assert report_data["scenario_name"] == "API Test Scenario"
    assert "checks" in report_data
    assert "dependency_cascade" in report_data
    scenario_id = report_data["scenario_id"]

    # 3. Save Scenario
    save_res = client.post("/api/simulator/save", json=report_data)
    assert save_res.status_code == 200
    assert save_res.json()["status"] == "success"

    # 4. List Saved Scenarios
    list_res = client.get("/api/simulator/saved-scenarios")
    assert list_res.status_code == 200
    saved_list = list_res.json()
    saved_ids = [s["scenario_id"] for s in saved_list]
    assert scenario_id in saved_ids

    # 5. Get Saved Scenario by ID
    get_res = client.get(f"/api/simulator/saved-scenarios/{scenario_id}")
    assert get_res.status_code == 200
    assert get_res.json()["scenario_id"] == scenario_id
