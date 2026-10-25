from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class CourseItem(BaseModel):
    id: str
    name: str
    intake: int
    level: str = "UG"  # UG, PG, Diploma
    is_nba_accredited: bool = False

class InstitutionProfile(BaseModel):
    pid: str
    name: str
    category: str = "Engineering & Technology"
    approved_intake_total: int
    admitted_strength_total: int
    total_faculty_count: int
    professors_count: int
    associate_professors_count: int
    assistant_professors_count: int
    phd_faculty_count: int
    total_land_acres: float
    total_builtup_area_sqm: float
    classrooms_count: int
    laboratories_count: int
    computer_terminals: int
    library_volumes: int
    annual_budget_lakhs: float
    courses: List[CourseItem] = []
    # Evidence & Assumption Flags
    has_architect_certificate: bool = True
    has_land_mutation_clearance: bool = True
    has_fire_safety_noc: bool = True
    has_university_affiliation: bool = True
    nba_accredited_programs_count: int = 2

class ScenarioCheckResult(BaseModel):
    rule_id: str
    clause: str
    title: str
    category: str
    severity: str  # 'Critical' | 'Major' | 'Minor'
    rule_version: str
    is_illustrative_demo_rule: bool = True
    rule_label: str = "[Illustrative Demo Rule - Simulation Benchmark]"
    baseline_value: str
    proposed_value: str
    benchmark_threshold: str
    baseline_passed: Optional[bool] = None
    proposed_passed: Optional[bool] = None
    transition: str  # 'PASS_TO_FAIL' | 'FAIL_TO_PASS' | 'PASS_TO_PASS' | 'FAIL_TO_FAIL' | 'UNRESOLVED_ASSUMPTION'
    transition_label: str
    explanation: str
    required_evidence: str
    affected_records: List[str] = []
    is_assumption: bool = False

class DependencyCascadeItem(BaseModel):
    driver_parameter: str
    delta: str
    impacted_domain: str
    requirement_summary: str
    affected_asset: str
    recommended_procurement: str

class SimulationReport(BaseModel):
    scenario_id: str
    scenario_name: str
    rule_version: str
    rule_version_name: str
    baseline_pid: str
    baseline_name: str
    created_at: str
    disclaimer: str = (
        "SIMULATION SANDBOX ONLY — Scenario simulation never mutates official institutional "
        "records, registers live applications, or grants regulatory approvals. All rules are "
        "explicitly labeled illustrative demo rules until verified regulatory requirements are configured."
    )
    metric_deltas: Dict[str, Any]
    transition_counts: Dict[str, int]
    checks: List[ScenarioCheckResult]
    dependency_cascade: List[DependencyCascadeItem]
    overall_feasibility: str  # 'Feasible' | 'Remediation Required' | 'High Risk / Severe Deficits'
    summary_verdict: str

# Supported versioned rulebooks
SUPPORTED_RULE_VERSIONS = {
    "v2024_25": {
        "code": "v2024_25",
        "name": "AICTE APH 2024-25 (v3.2 Baseline)",
        "sfr_ratio": 20.0,
        "cadre_ratio_str": "1:2:6",
        "space_per_student": 4.0,
        "computers_per_student": 0.20,
        "max_expansion_without_nba": 120,
        "description": "Baseline norms for 2024-25 cycle with standard 1:20 Student-Faculty Ratio."
    },
    "v2025_26": {
        "code": "v2025_26",
        "name": "AICTE APH 2025-26 (v4.0 Current Benchmark)",
        "sfr_ratio": 20.0,
        "cadre_ratio_str": "1:2:6",
        "space_per_student": 4.0,
        "computers_per_student": 0.25,
        "max_expansion_without_nba": 120,
        "description": "Current standard framework with enhanced computing requirements for emerging tech."
    },
    "v2026_27": {
        "code": "v2026_27",
        "name": "AICTE APH 2026-27 (v4.2 Draft Projected Norms)",
        "sfr_ratio": 15.0,  # Stricter projected SFR
        "cadre_ratio_str": "1:2:6",
        "space_per_student": 4.5,
        "computers_per_student": 0.33,
        "max_expansion_without_nba": 60,  # Stricter expansion cap
        "description": "Projected regulatory drift incorporating stricter 1:15 SFR and expanded instructional spaces."
    }
}

class ComplianceTimeMachineSimulator:
    """
    Interactive Scenario Simulator for Veriflo AI.
    Runs versioned illustrative compliance checks across baseline and proposed institutional states.
    Never alters persistent institution records.
    """

    @classmethod
    def run_simulation(
        cls,
        baseline: InstitutionProfile,
        proposed: InstitutionProfile,
        rule_version_code: str = "v2025_26",
        scenario_name: str = "Proposed Institutional Expansion"
    ) -> SimulationReport:
        # Load rulebook version (default to current 2025-26 if invalid)
        version_config = SUPPORTED_RULE_VERSIONS.get(rule_version_code, SUPPORTED_RULE_VERSIONS["v2025_26"])
        
        checks: List[ScenarioCheckResult] = []

        # 1. Check: Student-to-Faculty Ratio (SFR)
        checks.append(cls._eval_sfr(baseline, proposed, version_config))

        # 2. Check: Cadre Distribution (1:2:6 Ratio)
        checks.append(cls._eval_cadre_ratio(baseline, proposed, version_config))

        # 3. Check: Senior Faculty Ph.D. Requirement
        checks.append(cls._eval_phd_requirement(baseline, proposed, version_config))

        # 4. Check: Built-up Area Adequacy
        checks.append(cls._eval_builtup_area(baseline, proposed, version_config))

        # 5. Check: Campus Land Area Norm
        checks.append(cls._eval_land_area(baseline, proposed, version_config))

        # 6. Check: Classroom Divisions Count
        checks.append(cls._eval_classrooms(baseline, proposed, version_config))

        # 7. Check: Computer Terminals Capacity
        checks.append(cls._eval_computing(baseline, proposed, version_config))

        # 8. Check: Annual Operating Budget Soundness
        checks.append(cls._eval_budget(baseline, proposed, version_config))

        # 9. Check: Single-Cycle Expansion Cap
        checks.append(cls._eval_expansion_cap(baseline, proposed, version_config))

        # 10. Check: Statutory Documentation & Evidence Assumption
        checks.append(cls._eval_statutory_evidence(baseline, proposed, version_config))

        # Compute transitions count
        transition_counts = {
            "PASS_TO_FAIL": sum(1 for c in checks if c.transition == "PASS_TO_FAIL"),
            "FAIL_TO_PASS": sum(1 for c in checks if c.transition == "FAIL_TO_PASS"),
            "PASS_TO_PASS": sum(1 for c in checks if c.transition == "PASS_TO_PASS"),
            "FAIL_TO_FAIL": sum(1 for c in checks if c.transition == "FAIL_TO_FAIL"),
            "UNRESOLVED_ASSUMPTION": sum(1 for c in checks if c.transition == "UNRESOLVED_ASSUMPTION"),
        }

        # Calculate deltas
        intake_delta = proposed.approved_intake_total - baseline.approved_intake_total
        faculty_delta = proposed.total_faculty_count - baseline.total_faculty_count
        area_delta = proposed.total_builtup_area_sqm - baseline.total_builtup_area_sqm
        classrooms_delta = proposed.classrooms_count - baseline.classrooms_count
        courses_delta = len(proposed.courses) - len(baseline.courses)

        metric_deltas = {
            "intake": {"baseline": baseline.approved_intake_total, "proposed": proposed.approved_intake_total, "delta": intake_delta},
            "faculty": {"baseline": baseline.total_faculty_count, "proposed": proposed.total_faculty_count, "delta": faculty_delta},
            "builtup_area": {"baseline": baseline.total_builtup_area_sqm, "proposed": proposed.total_builtup_area_sqm, "delta": area_delta},
            "classrooms": {"baseline": baseline.classrooms_count, "proposed": proposed.classrooms_count, "delta": classrooms_delta},
            "courses_count": {"baseline": len(baseline.courses), "proposed": len(proposed.courses), "delta": courses_delta},
        }

        # Compute Dependency Cascade
        dependency_cascade = cls._compute_cascade(baseline, proposed, version_config)

        # Compute Feasibility
        if transition_counts["PASS_TO_FAIL"] > 1 or transition_counts["FAIL_TO_FAIL"] > 2:
            overall_feasibility = "High Risk / Severe Deficits"
            summary_verdict = f"Proposed changes introduce {transition_counts['PASS_TO_FAIL']} new critical non-compliance violation(s). Substantial capital & recruitment remediation required before submission."
        elif transition_counts["PASS_TO_FAIL"] == 1 or transition_counts["UNRESOLVED_ASSUMPTION"] > 0:
            overall_feasibility = "Remediation Required"
            summary_verdict = f"Proposed scenario has {transition_counts['PASS_TO_FAIL']} newly created deficit(s) and {transition_counts['UNRESOLVED_ASSUMPTION']} unresolved assumption(s). Can become compliant with targeted adjustments."
        else:
            overall_feasibility = "Feasible"
            summary_verdict = f"All {len(checks)} illustrative regulatory standards satisfied in the proposed model ({transition_counts['FAIL_TO_PASS']} prior deficit(s) remediated)."

        import uuid
        from datetime import datetime

        return SimulationReport(
            scenario_id=f"SIM-{uuid.uuid4().hex[:8].upper()}",
            scenario_name=scenario_name,
            rule_version=version_config["code"],
            rule_version_name=version_config["name"],
            baseline_pid=baseline.pid,
            baseline_name=baseline.name,
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            metric_deltas=metric_deltas,
            transition_counts=transition_counts,
            checks=checks,
            dependency_cascade=dependency_cascade,
            overall_feasibility=overall_feasibility,
            summary_verdict=summary_verdict
        )

    # ----------------- Check Evaluators -----------------

    @classmethod
    def _eval_sfr(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        sfr = v["sfr_ratio"]
        # Required faculty based on 4-year cumulative student population: (intake * 4) / sfr
        b_req = round((b.approved_intake_total * 4) / sfr)
        p_req = round((p.approved_intake_total * 4) / sfr)

        b_pass = b.total_faculty_count >= b_req
        p_pass = p.total_faculty_count >= p_req
        trans = cls._get_transition(b_pass, p_pass)

        return ScenarioCheckResult(
            rule_id="RULE-SIM-SFR-01",
            clause="APH Ch.7 Clause 1.2 - Student-to-Faculty Ratio Norm",
            title="Student-to-Faculty Ratio (SFR) Compliance",
            category="Faculty Norms",
            severity="Critical",
            rule_version=v["code"],
            baseline_value=f"{b.total_faculty_count} faculty ({b.approved_intake_total * 4} students, 1:{((b.approved_intake_total*4)/max(b.total_faculty_count,1)):.1f})",
            proposed_value=f"{p.total_faculty_count} faculty ({p.approved_intake_total * 4} students, 1:{((p.approved_intake_total*4)/max(p.total_faculty_count,1)):.1f})",
            benchmark_threshold=f"Min {p_req} faculty for {p.approved_intake_total * 4} students (Benchmark SFR 1:{int(sfr)})",
            baseline_passed=b_pass,
            proposed_passed=p_pass,
            transition=trans,
            transition_label=cls._transition_label(trans),
            explanation=(
                f"Under {v['name']}, an annual intake of {p.approved_intake_total} produces a 4-year student body of "
                f"{p.approved_intake_total * 4}, requiring at least {p_req} full-time faculty members at an SFR of 1:{int(sfr)}."
            ),
            required_evidence="Institutional Faculty Roster, Form-16 Salary Disbursement Statements, and University Selection Minutes.",
            affected_records=["Faculty Register", "Statutory Salary Ledger", "Academic Department Roster"]
        )

    @classmethod
    def _eval_cadre_ratio(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        # Standard Cadre proportion 1:2:6 requires at least 1 Professor per ~9 faculty and 2 Assoc Profs
        # Total faculty / 9 determines professor requirement
        p_req_prof = max(1, p.total_faculty_count // 9)
        p_req_assoc = max(2, (p.total_faculty_count * 2) // 9)

        b_req_prof = max(1, b.total_faculty_count // 9)
        b_req_assoc = max(2, (b.total_faculty_count * 2) // 9)

        b_pass = (b.professors_count >= b_req_prof and b.associate_professors_count >= b_req_assoc)
        p_pass = (p.professors_count >= p_req_prof and p.associate_professors_count >= p_req_assoc)
        trans = cls._get_transition(b_pass, p_pass)

        return ScenarioCheckResult(
            rule_id="RULE-SIM-CAD-02",
            clause="APH Ch.7 Clause 2.3 - Cadre Proportion Norm (1:2:6)",
            title="Senior Cadre Distribution Proportion",
            category="Faculty Norms",
            severity="Major",
            rule_version=v["code"],
            baseline_value=f"{b.professors_count} Prof, {b.associate_professors_count} Assoc Prof, {b.assistant_professors_count} Asst Prof",
            proposed_value=f"{p.professors_count} Prof, {p.associate_professors_count} Assoc Prof, {p.assistant_professors_count} Asst Prof",
            benchmark_threshold=f"Min {p_req_prof} Professor(s) and {p_req_assoc} Associate Professor(s) for {p.total_faculty_count} faculty",
            baseline_passed=b_pass,
            proposed_passed=p_pass,
            transition=trans,
            transition_label=cls._transition_label(trans),
            explanation=(
                f"AICTE cadre distribution mandates a 1 Professor : 2 Associate Professors : 6 Assistant Professors hierarchy. "
                f"With {p.total_faculty_count} faculty, minimum requirements are {p_req_prof} Professor(s) and {p_req_assoc} Associate Professor(s)."
            ),
            required_evidence="Cadre endorsement notifications, University selection committee approval orders, and designated designation payroll.",
            affected_records=["Faculty Cadre Schedule", "University Approval Dossier"]
        )

    @classmethod
    def _eval_phd_requirement(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        b_seniors = b.professors_count + b.associate_professors_count
        p_seniors = p.professors_count + p.associate_professors_count

        b_pass = b.phd_faculty_count >= b_seniors
        p_pass = p.phd_faculty_count >= p_seniors
        trans = cls._get_transition(b_pass, p_pass)

        return ScenarioCheckResult(
            rule_id="RULE-SIM-PHD-03",
            clause="APH Ch.7 Clause 2.1 - Doctoral Qualifications for Senior Cadre",
            title="Ph.D. Qualifications for Professors & Associate Professors",
            category="Faculty Norms",
            severity="Critical",
            rule_version=v["code"],
            baseline_value=f"{b.phd_faculty_count} Ph.D. holders out of {b_seniors} senior faculty",
            proposed_value=f"{p.phd_faculty_count} Ph.D. holders out of {p_seniors} senior faculty",
            benchmark_threshold=f"100% Ph.D. mandatory for senior cadre ({p_seniors} Ph.D. holders required)",
            baseline_passed=b_pass,
            proposed_passed=p_pass,
            transition=trans,
            transition_label=cls._transition_label(trans),
            explanation=(
                f"Every appointment at Professor or Associate Professor rank legally requires a doctoral (Ph.D.) degree. "
                f"The proposed cadre of {p.professors_count} Prof and {p.associate_professors_count} Assoc Prof demands at least {p_seniors} doctoral holders."
            ),
            required_evidence="UGC recognized University Doctoral Degree Certificates, Convocation scrolls, and thesis verification records.",
            affected_records=["Faculty Qualification Dossier", "Academic Credential Ledger"]
        )

    @classmethod
    def _eval_builtup_area(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        space_factor = v["space_per_student"]
        b_students = b.approved_intake_total * 4
        p_students = p.approved_intake_total * 4
        b_req_area = b_students * space_factor
        p_req_area = p_students * space_factor

        b_pass = b.total_builtup_area_sqm >= b_req_area
        p_pass = p.total_builtup_area_sqm >= p_req_area
        trans = cls._get_transition(b_pass, p_pass)

        return ScenarioCheckResult(
            rule_id="RULE-SIM-BLD-04",
            clause="APH Ch.4 Clause 1.1 - Instructional & Administrative Built-up Area",
            title="Total Built-up Area Adequacy",
            category="Infrastructure Norms",
            severity="Critical",
            rule_version=v["code"],
            baseline_value=f"{b.total_builtup_area_sqm:,.0f} sq.m ({b.total_builtup_area_sqm / max(b_students, 1):.1f} sq.m/student)",
            proposed_value=f"{p.total_builtup_area_sqm:,.0f} sq.m ({p.total_builtup_area_sqm / max(p_students, 1):.1f} sq.m/student)",
            benchmark_threshold=f"Min {p_req_area:,.0f} sq.m ({space_factor:.1f} sq.m per student for {p_students} students)",
            baseline_passed=b_pass,
            proposed_passed=p_pass,
            transition=trans,
            transition_label=cls._transition_label(trans),
            explanation=(
                f"Under {v['name']}, technical institutions must provide {space_factor:.1f} sq.m of instructional, administrative, "
                f"and amenities built-up space per enrolled student. An intake of {p.approved_intake_total} requires {p_req_area:,.0f} sq.m."
            ),
            required_evidence="Registered Architect Built-up Area Certificate with geo-tagged building floor plans and Municipal Occupancy Certificate.",
            affected_records=["Infrastructure Ledger", "Campus Master Plan", "Municipal Building Sanction"]
        )

    @classmethod
    def _eval_land_area(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        # Standard benchmark: 2.5 acres for Mega/Metro or 4.0 acres for other locations
        min_land_acres = 2.5
        b_pass = b.total_land_acres >= min_land_acres
        p_pass = p.total_land_acres >= min_land_acres
        trans = cls._get_transition(b_pass, p_pass)

        return ScenarioCheckResult(
            rule_id="RULE-SIM-LND-05",
            clause="APH Ch.4 Clause 1.3 - Contiguous Land Area Norm",
            title="Contiguous Campus Land Area",
            category="Infrastructure Norms",
            severity="Major",
            rule_version=v["code"],
            baseline_value=f"{b.total_land_acres:.1f} acres",
            proposed_value=f"{p.total_land_acres:.1f} acres",
            benchmark_threshold=f"Min {min_land_acres} acres contiguous titled land",
            baseline_passed=b_pass,
            proposed_passed=p_pass,
            transition=trans,
            transition_label=cls._transition_label(trans),
            explanation=(
                f"Institutions must hold a minimum contiguous land title of {min_land_acres} acres registered in the name of the Trust/Society/Company."
            ),
            required_evidence="Land Sale Deed, Khasra/Mutation Certificate, and Sub-Divisional Magistrate Non-Encumbrance Certificate.",
            affected_records=["Land Title Deed", "State Revenue Mutation Registry"]
        )

    @classmethod
    def _eval_classrooms(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        # 1 classroom per 60 student annual intake division * 4 years * 0.75 utilization factor = ~1 classroom per 20 annual intake
        b_req_classrooms = max(4, round((b.approved_intake_total * 4) / 45))
        p_req_classrooms = max(4, round((p.approved_intake_total * 4) / 45))

        b_pass = b.classrooms_count >= b_req_classrooms
        p_pass = p.classrooms_count >= p_req_classrooms
        trans = cls._get_transition(b_pass, p_pass)

        return ScenarioCheckResult(
            rule_id="RULE-SIM-CLS-06",
            clause="APH Ch.4 Clause 2.1 - Classroom & Instructional Space Allocation",
            title="Instructional Classrooms Allocation",
            category="Infrastructure Norms",
            severity="Major",
            rule_version=v["code"],
            baseline_value=f"{b.classrooms_count} classrooms",
            proposed_value=f"{p.classrooms_count} classrooms",
            benchmark_threshold=f"Min {p_req_classrooms} classrooms for {p.approved_intake_total} annual intake",
            baseline_passed=b_pass,
            proposed_passed=p_pass,
            transition=trans,
            transition_label=cls._transition_label(trans),
            explanation=(
                f"Each 60-student batch division across 4 academic years requires dedicated instructional lecture halls. "
                f"Expanding intake to {p.approved_intake_total} requires a minimum of {p_req_classrooms} furnished classrooms with ICT projection."
            ),
            required_evidence="Building Room-Wise Schedule endorsed by chartered architect and photographs of smart classrooms.",
            affected_records=["Room Allocation Register", "Time Table Schedule"]
        )

    @classmethod
    def _eval_computing(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        comp_ratio = v["computers_per_student"]
        b_students = b.approved_intake_total * 4
        p_students = p.approved_intake_total * 4
        b_req_terminals = round(b_students * comp_ratio)
        p_req_terminals = round(p_students * comp_ratio)

        b_pass = b.computer_terminals >= b_req_terminals
        p_pass = p.computer_terminals >= p_req_terminals
        trans = cls._get_transition(b_pass, p_pass)

        return ScenarioCheckResult(
            rule_id="RULE-SIM-CMP-07",
            clause="APH Ch.5 Clause 1.4 - Computing Facilities & LAN Terminals",
            title="Computing Center & Laboratory Terminals",
            category="Instructional Resources",
            severity="Major",
            rule_version=v["code"],
            baseline_value=f"{b.computer_terminals} terminals ({b.computer_terminals / max(b_students, 1):.2f}/student)",
            proposed_value=f"{p.computer_terminals} terminals ({p.computer_terminals / max(p_students, 1):.2f}/student)",
            benchmark_threshold=f"Min {p_req_terminals} terminals (1 per {int(1/comp_ratio)} students for {p_students} students)",
            baseline_passed=b_pass,
            proposed_passed=p_pass,
            transition=trans,
            transition_label=cls._transition_label(trans),
            explanation=(
                f"Under {v['name']}, computing centers must support 1 terminal per {int(1/comp_ratio)} students on Gigabit LAN with legal software licenses. "
                f"For {p_students} students, at least {p_req_terminals} operational terminals are mandatory."
            ),
            required_evidence="IT Asset Invoices, Legal Software Volume Licenses, and Internet Leased Line Bandwidth SLA Certificate.",
            affected_records=["IT Hardware Asset Inventory", "Software Compliance Ledger"]
        )

    @classmethod
    def _eval_budget(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        # Minimum operational expenditure: ₹25,000 per student per annum = ₹0.25 Lakhs per student
        b_req_budget = (b.approved_intake_total * 4) * 0.25
        p_req_budget = (p.approved_intake_total * 4) * 0.25

        b_pass = b.annual_budget_lakhs >= b_req_budget
        p_pass = p.annual_budget_lakhs >= p_req_budget
        trans = cls._get_transition(b_pass, p_pass)

        return ScenarioCheckResult(
            rule_id="RULE-SIM-FIN-08",
            clause="APH Ch.1 Clause 6.1 - Financial Soundness & Operational Budget",
            title="Operational Recurring Budget Soundness",
            category="Financial Soundness",
            severity="Minor",
            rule_version=v["code"],
            baseline_value=f"₹{b.annual_budget_lakhs:,.1f} Lakhs (₹{b.annual_budget_lakhs / max(b.approved_intake_total*4, 1):.2f}L/student)",
            proposed_value=f"₹{p.annual_budget_lakhs:,.1f} Lakhs (₹{p.annual_budget_lakhs / max(p.approved_intake_total*4, 1):.2f}L/student)",
            benchmark_threshold=f"Min ₹{p_req_budget:,.1f} Lakhs recurring budget per annum for {p.approved_intake_total * 4} students",
            baseline_passed=b_pass,
            proposed_passed=p_pass,
            transition=trans,
            transition_label=cls._transition_label(trans),
            explanation=(
                f"To sustain recurring faculty remuneration, library subscriptions, and laboratory maintenance, "
                f"annual expenditure must reach ₹{p_req_budget:,.1f} Lakhs (₹25,000 per enrolled seat)."
            ),
            required_evidence="Audited Annual Accounts Balance Sheet signed by Chartered Accountant and Bank Corpus Fixed Deposit receipts.",
            affected_records=["Audited Financial Statements", "Corpus Bank Ledger"]
        )

    @classmethod
    def _eval_expansion_cap(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        max_expansion = v["max_expansion_without_nba"]
        delta = p.approved_intake_total - b.approved_intake_total

        if delta <= 0:
            b_pass = True
            p_pass = True
            trans = "PASS_TO_PASS"
            explanation = "No seat increase proposed in this scenario; routine renewal thresholds apply."
        else:
            # If expansion > max allowed without NBA, verify if institute has sufficient NBA accreditations
            if delta > max_expansion:
                p_pass = p.nba_accredited_programs_count >= 2
                b_pass = True
                trans = "PASS_TO_PASS" if p_pass else "PASS_TO_FAIL"
                explanation = (
                    f"Expansion of +{delta} seats exceeds the baseline single-cycle cap of +{max_expansion} seats. "
                    f"Under {v['name']}, expansions exceeding {max_expansion} seats require at least 2 NBA-accredited programs."
                )
            else:
                p_pass = True
                b_pass = True
                trans = "PASS_TO_PASS"
                explanation = f"Proposed expansion of +{delta} seats falls within the single-cycle standard allowance (+{max_expansion} seats)."

        return ScenarioCheckResult(
            rule_id="RULE-SIM-EXP-09",
            clause="APH Ch.2 Clause 4.2 - Annual Sanctioned Expansion Limitation",
            title="Single-Cycle Seat Expansion Cap & NBA Requirement",
            category="Academic Approvals",
            severity="Critical",
            rule_version=v["code"],
            baseline_value=f"{b.approved_intake_total} sanctioned seats",
            proposed_value=f"{p.approved_intake_total} seats (+{delta} seats delta)",
            benchmark_threshold=f"Max +{max_expansion} seats expansion per cycle without mandatory NBA accreditation",
            baseline_passed=b_pass,
            proposed_passed=p_pass,
            transition=trans,
            transition_label=cls._transition_label(trans),
            explanation=explanation,
            required_evidence="National Board of Accreditation (NBA) Certificate of Quality Accreditation (valid for current academic year).",
            affected_records=["Academic Program Sanction File", "NBA Accreditation Portfolio"]
        )

    @classmethod
    def _eval_statutory_evidence(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> ScenarioCheckResult:
        # Check if proposed changes rely on unverified assumptions or missing evidence
        assumptions = []
        if not p.has_architect_certificate:
            assumptions.append("Architect built-up certificate not uploaded / pending endorsement")
        if not p.has_land_mutation_clearance:
            assumptions.append("Land conversion / mutation clearance unverified in revenue registry")
        if not p.has_fire_safety_noc:
            assumptions.append("Fire and Life Safety NOC renewal unconfirmed")
        if not p.has_university_affiliation:
            assumptions.append("Affiliating University provisional consent pending")

        if assumptions:
            trans = "UNRESOLVED_ASSUMPTION"
            return ScenarioCheckResult(
                rule_id="RULE-SIM-ASM-10",
                clause="APH Ch.1 Clause 4.1 - Evidence Verification & Assumption Flags",
                title="Statutory Evidence Verification & Assumption Flags",
                category="Documentation Integrity",
                severity="Major",
                rule_version=v["code"],
                baseline_value="All baseline statutory evidence documented in existing records",
                proposed_value=f"Simulation depends on {len(assumptions)} unverified assumption(s)",
                benchmark_threshold="All proposed physical expansions must be backed by verified statutory documentation",
                baseline_passed=True,
                proposed_passed=None,  # Inconclusive / assumption
                transition=trans,
                transition_label="Unresolved Assumption (Missing Evidence)",
                explanation=f"Scenario relies on assumed readiness: {'; '.join(assumptions)}. Rule outcomes are conditional on obtaining official seals.",
                required_evidence="State Fire NOC, Registered Architect Certificate, Affiliation Sanction, and Revenue Mutation Entry.",
                affected_records=["Pending Evidence Queue", "Pre-requisite Filing Dossier"],
                is_assumption=True
            )
        else:
            return ScenarioCheckResult(
                rule_id="RULE-SIM-ASM-10",
                clause="APH Ch.1 Clause 4.1",
                title="Statutory Evidence Verification & Assumption Flags",
                category="Documentation Integrity",
                severity="Info",
                rule_version=v["code"],
                baseline_value="Baseline statutory evidence documented",
                proposed_value="All proposed changes backed by marked evidence files",
                benchmark_threshold="Statutory evidence confirmed",
                baseline_passed=True,
                proposed_passed=True,
                transition="PASS_TO_PASS",
                transition_label="Remains Compliant",
                explanation="All statutory documents and municipal clearances required for the proposed change are marked as attached.",
                required_evidence="Uploaded and verified NOC certificates.",
                affected_records=["Verified Dossier Archive"],
                is_assumption=False
            )

    @staticmethod
    def _get_transition(b_pass: Optional[bool], p_pass: Optional[bool]) -> str:
        if b_pass is True and p_pass is False:
            return "PASS_TO_FAIL"
        elif b_pass is False and p_pass is True:
            return "FAIL_TO_PASS"
        elif b_pass is True and p_pass is True:
            return "PASS_TO_PASS"
        elif b_pass is False and p_pass is False:
            return "FAIL_TO_FAIL"
        return "UNRESOLVED_ASSUMPTION"

    @staticmethod
    def _transition_label(trans: str) -> str:
        mapping = {
            "PASS_TO_FAIL": "New Deficit Created (Pass -> Fail)",
            "FAIL_TO_PASS": "Deficiency Remediated (Fail -> Pass)",
            "PASS_TO_PASS": "Remains Compliant (Pass -> Pass)",
            "FAIL_TO_FAIL": "Unresolved Deficit (Fail -> Fail)",
            "UNRESOLVED_ASSUMPTION": "Unresolved Assumption (Missing Data)",
        }
        return mapping.get(trans, trans)

    @classmethod
    def _compute_cascade(cls, b: InstitutionProfile, p: InstitutionProfile, v: dict) -> List[DependencyCascadeItem]:
        cascade: List[DependencyCascadeItem] = []
        intake_delta = p.approved_intake_total - b.approved_intake_total
        sfr = v["sfr_ratio"]

        if intake_delta != 0:
            add_faculty = round((intake_delta * 4) / sfr)
            cascade.append(DependencyCascadeItem(
                driver_parameter="Approved Intake Total",
                delta=f"{'+' if intake_delta > 0 else ''}{intake_delta} seats",
                impacted_domain="Faculty Recruitment & Cadre",
                requirement_summary=f"Requires {'+' if add_faculty > 0 else ''}{add_faculty} full-time faculty to maintain SFR 1:{int(sfr)}.",
                affected_asset="Institutional Payroll & Faculty Roster",
                recommended_procurement=f"Advertise recruitment for {max(1, add_faculty // 9)} Professor(s) and {max(1, add_faculty // 4)} Associate Professor(s)."
            ))

            add_sqm = intake_delta * 4 * v["space_per_student"]
            cascade.append(DependencyCascadeItem(
                driver_parameter="Approved Intake Total",
                delta=f"{'+' if intake_delta > 0 else ''}{intake_delta} seats",
                impacted_domain="Instructional & Administrative Area",
                requirement_summary=f"Requires {'+' if add_sqm > 0 else ''}{int(add_sqm):,} sq.m instructional built-up space.",
                affected_asset="Campus Physical Infrastructure",
                recommended_procurement="Construct or reallocate instructional wings with chartered architect certification."
            ))

            add_classrooms = max(1, round((intake_delta * 4) / 45))
            cascade.append(DependencyCascadeItem(
                driver_parameter="Approved Intake Total",
                delta=f"{'+' if intake_delta > 0 else ''}{intake_delta} seats",
                impacted_domain="Classroom Facilities",
                requirement_summary=f"Requires {'+' if add_classrooms > 0 else ''}{add_classrooms} dedicated ICT lecture halls.",
                affected_asset="Instructional Building Allocation",
                recommended_procurement="Equip additional lecture halls with digital projectors, acoustics, and smart furniture."
            ))

            add_computers = round(intake_delta * 4 * v["computers_per_student"])
            cascade.append(DependencyCascadeItem(
                driver_parameter="Approved Intake Total",
                delta=f"{'+' if intake_delta > 0 else ''}{intake_delta} seats",
                impacted_domain="Computing Center & Laboratories",
                requirement_summary=f"Demands {'+' if add_computers > 0 else ''}{add_computers} desktop terminals with LAN connectivity.",
                affected_asset="IT Infrastructure & Software Licensing",
                recommended_procurement="Procure branded desktop nodes with Windows/Linux dual boot and upgrade campus bandwidth."
            ))

        return cascade
