from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class FacultyMember(BaseModel):
    name: str
    qualification: str
    designation: str
    cadre: str  # Professor, Associate Professor, Assistant Professor, Lecturer
    department: Optional[str] = "Engineering & Technology"
    page_ref: Optional[int] = 1

class CourseRecord(BaseModel):
    name: str
    level: str = "UG"  # UG, PG, Diploma
    approved_intake: int
    page_ref: Optional[int] = 1

class ExtractedEntityData(BaseModel):
    institution_id: Optional[str] = None  # PID
    institution_name: Optional[str] = None
    application_type: Optional[str] = None
    certificate_number: Optional[str] = None
    document_type_detected: Optional[str] = None
    faculty_members: List[FacultyMember] = []
    courses: List[CourseRecord] = []
    approved_intake_total: Optional[int] = None
    dates: Dict[str, str] = {}  # issue_date, expiry_date, academic_year, etc.
    fee_amounts: Dict[str, float] = {}  # regulatory_fee, processing_fee, total_paid
    fee_receipt_numbers: List[str] = []
    document_references: List[str] = []
    page_count: int = 1
    source_page_references: Dict[str, int] = {}
    raw_text_summary: Optional[str] = None

class TamperSignal(BaseModel):
    type: str  # 'Font Inconsistency' | 'Metadata Mismatch' | 'Stamp Anomaly' | 'Erasure / Overwrite' | 'Date Expiry Conflict' | 'Suspicious Alteration Indicator'
    area: str
    confidence: float
    detail: str
    severity: str = "Warning"  # Info, Warning, Critical
    bounding_box: Optional[Dict[str, float]] = None

class VerificationFinding(BaseModel):
    rule_id: str
    rule_name: str
    clause: str
    category: str
    severity: str  # 'Critical' | 'Major' | 'Minor' | 'Info'
    observed_value: str
    expected_value: str
    source_document: str
    page_number: Optional[int] = 1
    applicable_rule: str
    recommended_action: str
    passed: bool

class VerificationResult(BaseModel):
    id: str
    file_name: str
    file_hash_sha256: str
    file_size_bytes: int
    file_type: str
    upload_timestamp: str
    document_type: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    overall_status: str  # 'Verified (Compliant)' | 'Deficiency Flagged' | 'Tampering / Anomaly Suspected' | 'Officer Manual Review Needed'
    ai_confidence_score: float
    is_synthetic: bool = False  # Real uploads are NEVER synthetic
    extracted_data: ExtractedEntityData
    findings: List[VerificationFinding] = []
    tamper_signals: List[TamperSignal] = []
    alteration_indicators: List[Dict[str, Any]] = []
    is_duplicate: bool = False
    duplicate_of: Optional[str] = None
    metadata_summary: Dict[str, Any] = {}
    ocr_engine_used: str = "PyMuPDF Native & Geometry Engine"
    forensic_summary: str = ""

class UploadResponse(BaseModel):
    status: str
    message: str
    data: VerificationResult

class RuleDefinition(BaseModel):
    rule_id: str
    clause_code: str
    category: str
    title: str
    description: str
    severity: str
    is_active: bool = True
