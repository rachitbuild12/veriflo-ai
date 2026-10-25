import pytest
from backend.app.schemas import ExtractedEntityData, FacultyMember, CourseRecord
from backend.app.services.rules_engine import RulesEngine

def test_rule_dup_004_duplicate_sha256_detection():
    extracted = ExtractedEntityData()
    finding_dup = RulesEngine._check_duplicate_document(
        is_duplicate=True,
        duplicate_of="DOC-PREV1234",
        document_filename="test_noc.pdf",
        extracted=extracted
    )
    assert finding_dup.rule_id == "RULE-DUP-004"
    assert finding_dup.severity == "Critical"
    assert finding_dup.passed is False
    assert "DOC-PREV1234" in finding_dup.observed_value

    finding_unique = RulesEngine._check_duplicate_document(
        is_duplicate=False,
        duplicate_of=None,
        document_filename="test_noc.pdf",
        extracted=extracted
    )
    assert finding_unique.passed is True
    assert finding_unique.severity == "Info"

def test_rule_pid_005_mismatched_institution_id():
    extracted = ExtractedEntityData(institution_id="1-4359812451")
    finding_mismatch = RulesEngine._check_pid_match(
        extracted=extracted,
        expected_pid="1-9999999999",
        document_filename="title_deed.pdf"
    )
    assert finding_mismatch.rule_id == "RULE-PID-005"
    assert finding_mismatch.severity == "Critical"
    assert finding_mismatch.passed is False
    assert "1-4359812451" in finding_mismatch.observed_value
    assert "1-9999999999" in finding_mismatch.expected_value

    finding_match = RulesEngine._check_pid_match(
        extracted=extracted,
        expected_pid="1-4359812451",
        document_filename="title_deed.pdf"
    )
    assert finding_match.passed is True
    assert finding_match.severity == "Info"

def test_rule_exp_002_expired_certificate():
    # Expiry date before the reference academic scrutiny cycle (2025-04-01)
    extracted_expired = ExtractedEntityData(dates={"expiry_date": "15/01/2024"})
    finding_exp = RulesEngine._check_certificate_expiry(
        extracted=extracted_expired,
        document_filename="fire_noc.pdf",
        document_type="Fire & Life Safety NOC"
    )
    assert finding_exp.rule_id == "RULE-EXP-002"
    assert finding_exp.severity == "Critical"
    assert finding_exp.passed is False
    assert "Expired on" in finding_exp.observed_value

    # Valid future expiry date
    extracted_valid = ExtractedEntityData(dates={"expiry_date": "31/12/2026"})
    finding_valid = RulesEngine._check_certificate_expiry(
        extracted=extracted_valid,
        document_filename="fire_noc.pdf",
        document_type="Fire & Life Safety NOC"
    )
    assert finding_valid.passed is True
    assert finding_valid.severity == "Info"

def test_rule_fld_003_incomplete_fields():
    # Missing certificate number and dates
    extracted_incomplete = ExtractedEntityData(certificate_number=None, dates={})
    finding_inc = RulesEngine._check_incomplete_fields(
        extracted=extracted_incomplete,
        document_filename="spcb_noc.pdf",
        document_type="State Pollution Control Board NOC"
    )
    assert finding_inc.rule_id == "RULE-FLD-003"
    assert finding_inc.severity == "Major"
    assert finding_inc.passed is False

    # Complete certificate number
    extracted_complete = ExtractedEntityData(
        certificate_number="NOC/2024/MH/7891",
        dates={"issue_date": "10/06/2024"}
    )
    finding_comp = RulesEngine._check_incomplete_fields(
        extracted=extracted_complete,
        document_filename="spcb_noc.pdf",
        document_type="State Pollution Control Board NOC"
    )
    assert finding_comp.passed is True

def test_rule_cad_006_faculty_qualifications_and_cadre():
    # Professor without Ph.D.
    extracted_bad = ExtractedEntityData(
        faculty_members=[
            FacultyMember(name="John Doe", qualification="M.Tech", designation="Professor", cadre="Professor"),
            FacultyMember(name="Jane Smith", qualification="Ph.D.", designation="Associate Professor", cadre="Associate Professor"),
            FacultyMember(name="Alan Turing", qualification="M.Tech", designation="Assistant Professor", cadre="Assistant Professor")
        ]
    )
    findings = RulesEngine._check_faculty_cadre_and_qualifications(extracted_bad, "faculty_list.pdf")
    qual_finding = [f for f in findings if f.rule_id == "RULE-CAD-006"][0]
    assert qual_finding.passed is False
    assert qual_finding.severity == "Major"
    assert "John Doe" in qual_finding.observed_value

    # All seniors hold Ph.D.
    extracted_good = ExtractedEntityData(
        faculty_members=[
            FacultyMember(name="Dr. Sarah Connor", qualification="Ph.D. in Computer Science", designation="Professor", cadre="Professor"),
            FacultyMember(name="Dr. Grace Hopper", qualification="Ph.D. (Engineering)", designation="Associate Professor", cadre="Associate Professor"),
            FacultyMember(name="Alan Turing", qualification="M.Tech", designation="Assistant Professor", cadre="Assistant Professor")
        ]
    )
    findings_good = RulesEngine._check_faculty_cadre_and_qualifications(extracted_good, "faculty_list.pdf")
    qual_good = [f for f in findings_good if f.rule_id == "RULE-CAD-006"][0]
    assert qual_good.passed is True

def test_rule_fee_007_discrepancy():
    # Fee shortfall
    extracted_shortfall = ExtractedEntityData(fee_amounts={"regulatory_fee": 75000.0})
    finding_shortfall = RulesEngine._check_fee_amount(
        extracted=extracted_shortfall,
        expected_fee=100000.0,
        document_filename="fee_challan.pdf"
    )
    assert finding_shortfall.rule_id == "RULE-FEE-007"
    assert finding_shortfall.severity == "Major"
    assert finding_shortfall.passed is False
    assert "Shortfall: ₹25,000.00" in finding_shortfall.observed_value

    # Full fee paid
    extracted_full = ExtractedEntityData(fee_amounts={"regulatory_fee": 100000.0})
    finding_full = RulesEngine._check_fee_amount(
        extracted=extracted_full,
        expected_fee=100000.0,
        document_filename="fee_challan.pdf"
    )
    assert finding_full.passed is True

def test_rule_eoa_008_variance_intake():
    # Unilateral intake expansion on routine EoA
    extracted_spike = ExtractedEntityData(approved_intake_total=420)
    finding_spike = RulesEngine._check_eoa_variance(
        extracted=extracted_spike,
        previous_approved_intake=300,
        application_type="Extension of Approval (EoA)",
        document_filename="previous_eoa.pdf"
    )
    assert finding_spike.rule_id == "RULE-EOA-008"
    assert finding_spike.severity == "Critical"
    assert finding_spike.passed is False
    assert "+120 seats" in finding_spike.observed_value

    # Same intake on routine EoA
    extracted_aligned = ExtractedEntityData(approved_intake_total=300)
    finding_aligned = RulesEngine._check_eoa_variance(
        extracted=extracted_aligned,
        previous_approved_intake=300,
        application_type="Extension of Approval (EoA)",
        document_filename="previous_eoa.pdf"
    )
    assert finding_aligned.passed is True
