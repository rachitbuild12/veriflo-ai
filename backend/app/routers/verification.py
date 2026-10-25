from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from ..schemas import RuleDefinition
from ..services.storage import StorageService

router = APIRouter(prefix="/verification", tags=["Verification Records & Compliance Rules"])

@router.get("/results")
def list_verification_results() -> List[Dict[str, Any]]:
    """Retrieve all persisted verification records, ordered by timestamp descending."""
    return StorageService.list_all_records()

@router.get("/results/{record_id}")
def get_verification_result(record_id: str) -> Dict[str, Any]:
    """Retrieve an individual verification report by its document ID."""
    record = StorageService.get_verification_record(record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record with ID '{record_id}' not found."
        )
    return record

@router.get("/rules", response_model=List[RuleDefinition])
def get_compliance_rules() -> List[RuleDefinition]:
    """Return available deterministic AICTE APH compliance rules."""
    return [
        RuleDefinition(
            rule_id="RULE-DUP-004",
            clause_code="APH Ch.1 Clause 4.2",
            category="Forensic Integrity",
            title="Exact Duplicate Document Check (SHA-256)",
            description="Prevents duplicate document dossier filing by comparing binary SHA-256 cryptographic hashes against the national repository index.",
            severity="Critical"
        ),
        RuleDefinition(
            rule_id="RULE-PID-005",
            clause_code="APH Ch.2 Clause 1.4",
            category="Institutional Validation",
            title="Mismatched Institution Identifier (PID)",
            description="Validates that Permanent Institute ID cited on certificates matches the applicant institution PID.",
            severity="Critical"
        ),
        RuleDefinition(
            rule_id="RULE-EXP-002",
            clause_code="APH Ch.2 Clause 3.1",
            category="Statutory Compliance",
            title="Expired Certificate Verification",
            description="Validates that statutory Fire & Life Safety NOCs, Pollution Control NOCs, and Affiliation letters cover the current scrutiny cycle.",
            severity="Critical"
        ),
        RuleDefinition(
            rule_id="RULE-FLD-003",
            clause_code="APH Ch.1 Clause 5.1",
            category="Data Completeness",
            title="Mandatory Field Completeness Check",
            description="Checks presence of certificate numbers, issue dates, issuing authority signatures, and key identifying metadata.",
            severity="Major"
        ),
        RuleDefinition(
            rule_id="RULE-CAD-006",
            clause_code="APH Ch.7 Clause 2.1",
            category="Faculty & Cadre Norms",
            title="Faculty Qualification Norm Check (Senior Cadre Ph.D.)",
            description="Enforces mandatory Ph.D. degree qualifications for Professor and Associate Professor cadres.",
            severity="Major"
        ),
        RuleDefinition(
            rule_id="RULE-CAD-006B",
            clause_code="APH Ch.7 Clause 2.3",
            category="Faculty & Cadre Norms",
            title="Cadre Ratio Proportion Check (1:2:6)",
            description="Enforces balanced cadre distribution of 1 Professor : 2 Associate Professors : 6 Assistant Professors.",
            severity="Major"
        ),
        RuleDefinition(
            rule_id="RULE-FEE-007",
            clause_code="APH Ch.1 Clause 6.3",
            category="Financial Soundness",
            title="Statutory Regulatory Fee Discrepancy",
            description="Verifies that regulatory processing fees paid meet or exceed prescribed statutory amounts.",
            severity="Major"
        ),
        RuleDefinition(
            rule_id="RULE-EOA-008",
            clause_code="APH Ch.2 Clause 4.1",
            category="Intake & Program Compliance",
            title="Variance from Past Sanctioned Intake (EoA)",
            description="Prevents unauthorized expansion in routine Extension of Approval dossiers by comparing against previous year approval records.",
            severity="Critical"
        )
    ]
