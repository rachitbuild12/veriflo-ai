import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..schemas import ExtractedEntityData, VerificationFinding

class RulesEngine:
    """
    Deterministic, configurable regulatory compliance rules engine
    adhering to the AICTE Approval Process Handbook (APH) standards.
    """

    REFERENCE_DATE = datetime(2025, 4, 1)  # Academic Scrutiny Cycle 2025-26

    @classmethod
    def evaluate(
        cls,
        extracted: ExtractedEntityData,
        document_filename: str,
        document_type: str,
        expected_pid: Optional[str] = None,
        expected_institution_name: Optional[str] = None,
        is_duplicate: bool = False,
        duplicate_of: Optional[str] = None,
        previous_approved_intake: Optional[int] = None,
        expected_fee_amount: Optional[float] = 100000.0,
        application_type: str = "Extension of Approval (EoA)"
    ) -> List[VerificationFinding]:
        findings: List[VerificationFinding] = []

        # 1. RULE-DUP-004: Exact Duplicate Document Check (SHA-256)
        findings.append(cls._check_duplicate_document(
            is_duplicate, duplicate_of, document_filename, extracted
        ))

        # 2. RULE-PID-005: Mismatched Institution Identifier
        if expected_pid and extracted.institution_id:
            findings.append(cls._check_pid_match(
                extracted, expected_pid, document_filename
            ))

        # 3. RULE-EXP-002: Expired Certificate Check
        findings.append(cls._check_certificate_expiry(
            extracted, document_filename, document_type
        ))

        # 4. RULE-FLD-003: Incomplete Required Fields
        findings.append(cls._check_incomplete_fields(
            extracted, document_filename, document_type
        ))

        # 5. RULE-CAD-006: Faculty Cadre & Qualification Inconsistency
        if extracted.faculty_members:
            findings.extend(cls._check_faculty_cadre_and_qualifications(
                extracted, document_filename
            ))

        # 6. RULE-FEE-007: Fee Discrepancy Check
        if "regulatory_fee" in extracted.fee_amounts:
            findings.append(cls._check_fee_amount(
                extracted, expected_fee_amount or 100000.0, document_filename
            ))

        # 7. RULE-EOA-008: Variance from Previous Approval Record (EoA)
        if extracted.approved_intake_total and previous_approved_intake:
            findings.append(cls._check_eoa_variance(
                extracted, previous_approved_intake, application_type, document_filename
            ))

        return findings

    @staticmethod
    def _check_duplicate_document(
        is_duplicate: bool,
        duplicate_of: Optional[str],
        document_filename: str,
        extracted: ExtractedEntityData
    ) -> VerificationFinding:
        if is_duplicate:
            return VerificationFinding(
                rule_id="RULE-DUP-004",
                rule_name="Exact Duplicate Document Check (SHA-256)",
                clause="APH Ch.1 Clause 4.2 - Identity and Authenticity of Uploaded Evidences",
                category="Forensic Integrity",
                severity="Critical",
                observed_value=f"Binary SHA-256 collision with previously registered document record {duplicate_of}",
                expected_value="Unique original institutional submission specific to this dossier",
                source_document=document_filename,
                page_number=1,
                applicable_rule="AICTE APH Rule 4.2: Resubmission of identical digital documents across different applications constitutes duplicate dossier filing.",
                recommended_action="Flag for Scrutiny Committee hearing. Request clarification whether document was submitted inadvertently or shared between separate institutes.",
                passed=False
            )
        return VerificationFinding(
            rule_id="RULE-DUP-004",
            rule_name="Exact Duplicate Document Check (SHA-256)",
            clause="APH Ch.1 Clause 4.2",
            category="Forensic Integrity",
            severity="Info",
            observed_value="SHA-256 hash unique across national repository index",
            expected_value="Unique original document",
            source_document=document_filename,
            page_number=1,
            applicable_rule="AICTE APH Rule 4.2: Unique evidence submission check.",
            recommended_action="No action required.",
            passed=True
        )

    @staticmethod
    def _check_pid_match(
        extracted: ExtractedEntityData,
        expected_pid: str,
        document_filename: str
    ) -> VerificationFinding:
        observed_pid = extracted.institution_id or "Not Detected"
        page_num = extracted.source_page_references.get("institution_id", 1)
        
        # Clean both for robust comparison
        clean_obs = re.sub(r'[^0-9]', '', observed_pid)
        clean_exp = re.sub(r'[^0-9]', '', expected_pid)

        passed = (clean_obs == clean_exp)
        if not passed:
            return VerificationFinding(
                rule_id="RULE-PID-005",
                rule_name="Mismatched Institution Identifier (PID)",
                clause="APH Ch.2 Clause 1.4 - Institutional Identity Verification",
                category="Institutional Validation",
                severity="Critical",
                observed_value=f"Permanent Institute ID: {observed_pid} (Page {page_num})",
                expected_value=f"Application Permanent Institute ID: {expected_pid}",
                source_document=document_filename,
                page_number=page_num,
                applicable_rule="AICTE APH Rule 1.4: All supporting NOCs, letters, and affidavits must explicitly cite the assigned Permanent Institute ID.",
                recommended_action="Reject document association. Require upload of certificate carrying correct Permanent Institute ID.",
                passed=False
            )
        return VerificationFinding(
            rule_id="RULE-PID-005",
            rule_name="Mismatched Institution Identifier (PID)",
            clause="APH Ch.2 Clause 1.4",
            category="Institutional Validation",
            severity="Info",
            observed_value=f"PID {observed_pid} verified match",
            expected_value=f"PID {expected_pid}",
            source_document=document_filename,
            page_number=page_num,
            applicable_rule="AICTE APH Rule 1.4: Permanent Institute ID validation.",
            recommended_action="No action required.",
            passed=True
        )

    @classmethod
    def _check_certificate_expiry(
        cls,
        extracted: ExtractedEntityData,
        document_filename: str,
        document_type: str
    ) -> VerificationFinding:
        expiry_str = extracted.dates.get("expiry_date")
        page_num = extracted.source_page_references.get("expiry_date", 1)

        if not expiry_str:
            # Check if this document type legally requires a renewal expiry date (e.g., Fire NOC, SPCB NOC)
            time_sensitive_types = [
                "Fire & Life Safety NOC", "State Pollution Control Board", "Affiliation Letter"
            ]
            is_time_sensitive = any(t in document_type for t in time_sensitive_types)
            if is_time_sensitive:
                return VerificationFinding(
                    rule_id="RULE-EXP-002",
                    rule_name="Mandatory Validity / Expiry Date Verification",
                    clause="APH Ch.2 Clause 3.1 - Statutory Clearance Validity",
                    category="Statutory Compliance",
                    severity="Major",
                    observed_value="Expiry / Validity date missing from statutory document text",
                    expected_value="Explicit validity period covering current academic year (2025-26)",
                    source_document=document_filename,
                    page_number=page_num,
                    applicable_rule="AICTE APH Rule 3.1: Statutory clearances must explicitly state their valid duration.",
                    recommended_action="Officer manual review required: Check physical seal/stamp for validity period or request renewal endorsement from issuing authority.",
                    passed=False
                )
            return VerificationFinding(
                rule_id="RULE-EXP-002",
                rule_name="Mandatory Validity / Expiry Date Verification",
                clause="APH Ch.2 Clause 3.1",
                category="Statutory Compliance",
                severity="Info",
                observed_value="Perpetual / Non-expiring document type",
                expected_value="Valid standing document",
                source_document=document_filename,
                page_number=page_num,
                applicable_rule="AICTE APH Rule 3.1: Validity verification.",
                recommended_action="No action required.",
                passed=True
            )

        # Attempt date parse
        parsed_date = cls._parse_date_string(expiry_str)
        if parsed_date:
            if parsed_date < cls.REFERENCE_DATE:
                return VerificationFinding(
                    rule_id="RULE-EXP-002",
                    rule_name="Expired Certificate Verification",
                    clause="APH Ch.2 Clause 3.1 - Validity of Statutory Approvals",
                    category="Statutory Compliance",
                    severity="Critical",
                    observed_value=f"Expired on {parsed_date.strftime('%d-%b-%Y')} (Observed: '{expiry_str}')",
                    expected_value=f"Valid through current academic cycle (minimum {cls.REFERENCE_DATE.strftime('%d-%b-%Y')})",
                    source_document=document_filename,
                    page_number=page_num,
                    applicable_rule="AICTE APH Rule 3.1: Expired fire, environmental, or affiliation clearances invalidate application processing.",
                    recommended_action="Issue immediate Deficiency Notice: Upload updated renewal NOC or provisional extension order from the competent authority.",
                    passed=False
                )
            else:
                return VerificationFinding(
                    rule_id="RULE-EXP-002",
                    rule_name="Certificate Validity Check",
                    clause="APH Ch.2 Clause 3.1",
                    category="Statutory Compliance",
                    severity="Info",
                    observed_value=f"Valid until {parsed_date.strftime('%d-%b-%Y')}",
                    expected_value="Valid through current academic year",
                    source_document=document_filename,
                    page_number=page_num,
                    applicable_rule="AICTE APH Rule 3.1: Certificate validity check.",
                    recommended_action="No action required.",
                    passed=True
                )

        return VerificationFinding(
            rule_id="RULE-EXP-002",
            rule_name="Certificate Validity Check",
            clause="APH Ch.2 Clause 3.1",
            category="Statutory Compliance",
            severity="Minor",
            observed_value=f"Date string '{expiry_str}' format unrecognized",
            expected_value="Standard DD/MM/YYYY date format",
            source_document=document_filename,
            page_number=page_num,
            applicable_rule="AICTE APH Rule 3.1: Validity check.",
            recommended_action="Manual review of date text in document preview.",
            passed=True
        )

    @staticmethod
    def _check_incomplete_fields(
        extracted: ExtractedEntityData,
        document_filename: str,
        document_type: str
    ) -> VerificationFinding:
        missing = []
        if not extracted.certificate_number:
            missing.append("Certificate / Order Reference Number")
        if not extracted.dates.get("issue_date") and not extracted.dates.get("expiry_date"):
            missing.append("Issue or Validity Date")

        if missing:
            return VerificationFinding(
                rule_id="RULE-FLD-003",
                rule_name="Mandatory Field Completeness Check",
                clause="APH Ch.1 Clause 5.1 - Documentation Requirements",
                category="Data Completeness",
                severity="Major",
                observed_value=f"Missing key fields: {', '.join(missing)}",
                expected_value="All standard reference numbers and dispatch dates clearly legible",
                source_document=document_filename,
                page_number=1,
                applicable_rule="AICTE APH Rule 5.1: Regulatory documents must carry an identifiable certificate serial number and execution date.",
                recommended_action="Review scan resolution. If scan is cropped or obscured, request high-resolution re-upload.",
                passed=False
            )
        return VerificationFinding(
            rule_id="RULE-FLD-003",
            rule_name="Mandatory Field Completeness Check",
            clause="APH Ch.1 Clause 5.1",
            category="Data Completeness",
            severity="Info",
            observed_value=f"Certificate No: {extracted.certificate_number}",
            expected_value="Mandatory fields complete",
            source_document=document_filename,
            page_number=1,
            applicable_rule="AICTE APH Rule 5.1: Field completeness check.",
            recommended_action="No action required.",
            passed=True
        )

    @staticmethod
    def _check_faculty_cadre_and_qualifications(
        extracted: ExtractedEntityData,
        document_filename: str
    ) -> List[VerificationFinding]:
        findings = []
        faculties = extracted.faculty_members
        
        professors = [f for f in faculties if "professor" == f.cadre.lower() or "principal" in f.cadre.lower() or "director" in f.cadre.lower()]
        assoc_profs = [f for f in faculties if "associate" in f.cadre.lower()]
        asst_profs = [f for f in faculties if "assistant" in f.cadre.lower() or "lecturer" in f.cadre.lower()]

        # Qualification check for Senior Cadre (Prof & Assoc Prof require Ph.D.)
        unqualified_seniors = []
        for p in professors + assoc_profs:
            qual_upper = p.qualification.upper()
            if "PH.D" not in qual_upper and "PHD" not in qual_upper and "DOCTOR" not in qual_upper:
                unqualified_seniors.append(f"{p.name} ({p.cadre}, {p.qualification})")

        if unqualified_seniors:
            findings.append(VerificationFinding(
                rule_id="RULE-CAD-006",
                rule_name="Faculty Qualification Norm Check (Senior Cadre)",
                clause="APH Ch.7 Clause 2.1 - Minimum Qualifications for Teachers",
                category="Faculty & Cadre Norms",
                severity="Major",
                observed_value=f"{len(unqualified_seniors)} Senior Faculty without documented Ph.D.: {', '.join(unqualified_seniors[:2])}",
                expected_value="Ph.D. mandatory for Professor and Associate Professor appointments",
                source_document=document_filename,
                page_number=professors[0].page_ref if professors else 1,
                applicable_rule="AICTE APH Rule 2.1: Ph.D. degree in relevant discipline is mandatory for appointment as Professor or Associate Professor.",
                recommended_action="Request doctoral degree certificates or downgrade cadre designation to Assistant Professor.",
                passed=False
            ))
        else:
            findings.append(VerificationFinding(
                rule_id="RULE-CAD-006",
                rule_name="Faculty Qualification Norm Check (Senior Cadre)",
                clause="APH Ch.7 Clause 2.1",
                category="Faculty & Cadre Norms",
                severity="Info",
                observed_value="All senior cadre faculty hold requisite Ph.D. qualifications",
                expected_value="Ph.D. mandatory for senior cadre",
                source_document=document_filename,
                page_number=1,
                applicable_rule="AICTE APH Rule 2.1: Senior faculty qualifications verified.",
                recommended_action="No action required.",
                passed=True
            ))

        # Cadre Ratio Check (1:2:6 ratio)
        total_faculty = len(faculties)
        if total_faculty >= 9:
            prof_count = len(professors)
            assoc_count = len(assoc_profs)
            asst_count = len(asst_profs)
            
            # If zero professors or zero assoc profs
            if prof_count == 0 or assoc_count == 0:
                findings.append(VerificationFinding(
                    rule_id="RULE-CAD-006B",
                    rule_name="Cadre Ratio Proportion Check (1:2:6)",
                    clause="APH Ch.7 Clause 2.3 - Cadre Proportion Norms",
                    category="Faculty & Cadre Norms",
                    severity="Major",
                    observed_value=f"Cadre distribution: {prof_count} Prof, {assoc_count} Assoc Prof, {asst_count} Asst Prof",
                    expected_value="Cadre proportion of 1 Professor : 2 Associate Professors : 6 Assistant Professors",
                    source_document=document_filename,
                    page_number=1,
                    applicable_rule="AICTE APH Rule 2.3: Institutions must maintain balanced cadre hierarchy without total absence of senior cadres.",
                    recommended_action="Flag cadre imbalance in Scrutiny Summary. 15-day compliance window for senior cadre recruitment.",
                    passed=False
                ))

        return findings

    @staticmethod
    def _check_fee_amount(
        extracted: ExtractedEntityData,
        expected_fee: float,
        document_filename: str
    ) -> VerificationFinding:
        observed_fee = extracted.fee_amounts.get("regulatory_fee", 0.0)
        page_num = extracted.source_page_references.get("regulatory_fee", 1)

        if observed_fee < expected_fee:
            shortfall = expected_fee - observed_fee
            return VerificationFinding(
                rule_id="RULE-FEE-007",
                rule_name="Statutory Regulatory Fee Discrepancy",
                clause="APH Ch.1 Clause 6.3 - Prescribed Regulatory Processing Fees",
                category="Financial Soundness",
                severity="Major",
                observed_value=f"Fee paid: ₹{observed_fee:,.2f} (Shortfall: ₹{shortfall:,.2f})",
                expected_value=f"Mandatory processing fee: ₹{expected_fee:,.2f}",
                source_document=document_filename,
                page_number=page_num,
                applicable_rule="AICTE APH Rule 6.3: Regulatory processing fees must be paid in full prior to dossier progression.",
                recommended_action="Withhold issuance of Scrutiny Clearance until supplementary payment receipt for shortfall amount is uploaded.",
                passed=False
            )
        return VerificationFinding(
            rule_id="RULE-FEE-007",
            rule_name="Statutory Regulatory Fee Discrepancy",
            clause="APH Ch.1 Clause 6.3",
            category="Financial Soundness",
            severity="Info",
            observed_value=f"Fee paid: ₹{observed_fee:,.2f} (Full payment confirmed)",
            expected_value=f"Mandatory fee: ₹{expected_fee:,.2f}",
            source_document=document_filename,
            page_number=page_num,
            applicable_rule="AICTE APH Rule 6.3: Fee verification.",
            recommended_action="No action required.",
            passed=True
        )

    @staticmethod
    def _check_eoa_variance(
        extracted: ExtractedEntityData,
        previous_approved_intake: int,
        application_type: str,
        document_filename: str
    ) -> VerificationFinding:
        current_intake = extracted.approved_intake_total or 0
        page_num = 1

        # If it's a simple Extension of Approval (EoA) without approved Increase in Intake
        if application_type == "Extension of Approval (EoA)" and current_intake > previous_approved_intake:
            excess = current_intake - previous_approved_intake
            return VerificationFinding(
                rule_id="RULE-EOA-008",
                rule_name="Variance from Previous Approval Record (EoA)",
                clause="APH Ch.2 Clause 4.1 - Consistency with Past Sanctioned Intake",
                category="Intake & Program Compliance",
                severity="Critical",
                observed_value=f"Dossier intake: {current_intake} seats (+{excess} seats over previous year)",
                expected_value=f"Previous sanctioned intake: {previous_approved_intake} seats (or explicit 'Increase in Intake' application)",
                source_document=document_filename,
                page_number=page_num,
                applicable_rule="AICTE APH Rule 4.1: Routine Extension of Approval cannot unilaterally increment seat intake without formal expansion sanction.",
                recommended_action="Critical discrepancy: Revert intake to previous sanctioned baseline ({previous_approved_intake}) or reclassify dossier as 'Increase in Intake / New Course'.",
                passed=False
            )
        return VerificationFinding(
            rule_id="RULE-EOA-008",
            rule_name="Variance from Previous Approval Record (EoA)",
            clause="APH Ch.2 Clause 4.1",
            category="Intake & Program Compliance",
            severity="Info",
            observed_value=f"Intake {current_intake} seats aligns with previous approval ({previous_approved_intake} seats)",
            expected_value=f"Maximum {previous_approved_intake} seats",
            source_document=document_filename,
            page_number=page_num,
            applicable_rule="AICTE APH Rule 4.1: Sanctioned intake continuity.",
            recommended_action="No action required.",
            passed=True
        )

    @staticmethod
    def _parse_date_string(date_str: str) -> Optional[datetime]:
        """Parses various date formats commonly found in Indian regulatory certificates."""
        clean = re.sub(r'[^\w\s\-\/\.]', '', date_str.strip())
        formats = [
            "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
            "%d/%m/%y", "%d-%m-%y", "%d.%m.%y",
            "%Y-%m-%d", "%Y/%m/%d",
            "%d %b %Y", "%d %B %Y",
            "%d %b, %Y", "%d %B, %Y"
        ]
        for fmt in formats:
            try:
                return datetime.strptime(clean, fmt)
            except ValueError:
                continue
        return None
