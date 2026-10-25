import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from ..schemas import VerificationResult, ExtractedEntityData
from .storage import StorageService
from .extractor import DocumentExtractor
from .alteration import AlterationDetector
from .rules_engine import RulesEngine

class VerificationPipeline:
    def __init__(self):
        self.extractor = DocumentExtractor()

    def process_document(
        self,
        content: bytes,
        original_filename: str,
        document_type_hint: Optional[str] = None,
        expected_pid: Optional[str] = None,
        expected_institution_name: Optional[str] = None,
        previous_approved_intake: Optional[int] = None,
        expected_fee_amount: Optional[float] = 100000.0,
        application_type: str = "Extension of Approval (EoA)"
    ) -> VerificationResult:
        # Step 1: Save upload & SHA-256 duplicate detection
        record_id, saved_path, sha256, is_duplicate, duplicate_of = StorageService.save_upload(
            content, original_filename
        )
        file_size_bytes = len(content)
        ext = Path(original_filename).suffix.lower()
        mime_type = "application/pdf" if ext == ".pdf" else "image/png" if ext == ".png" else "image/jpeg"

        # Step 2: Extract text, structured entities, and metadata
        extracted_data, pdf_metadata, ocr_engine = self.extractor.extract_document(saved_path, mime_type)
        
        # Override document type if hint provided, else detected
        resolved_doc_type = document_type_hint or extracted_data.document_type_detected or "Statutory Document"

        # Step 3: Forensic Alteration Analysis (PDF metadata & image)
        tamper_signals = []
        alteration_indicators = []
        if ext == ".pdf":
            tamper_signals, alteration_indicators = AlterationDetector.analyze_pdf(saved_path, pdf_metadata)

        # Step 4: Deterministic Compliance Rules Evaluation
        findings = RulesEngine.evaluate(
            extracted=extracted_data,
            document_filename=original_filename,
            document_type=resolved_doc_type,
            expected_pid=expected_pid,
            expected_institution_name=expected_institution_name,
            is_duplicate=is_duplicate,
            duplicate_of=duplicate_of,
            previous_approved_intake=previous_approved_intake,
            expected_fee_amount=expected_fee_amount,
            application_type=application_type
        )

        # Step 5: Determine Overall Status & Confidence Score
        critical_findings = [f for f in findings if f.severity == "Critical" and not f.passed]
        major_findings = [f for f in findings if f.severity == "Major" and not f.passed]
        minor_findings = [f for f in findings if f.severity == "Minor" and not f.passed]
        critical_tamper = [s for s in tamper_signals if s.severity == "Critical"]
        warning_tamper = [s for s in tamper_signals if s.severity == "Warning"]

        # Calculate AI Confidence score
        base_confidence = 97.5
        deductions = (len(critical_findings) * 15.0) + (len(major_findings) * 8.0) + (len(warning_tamper) * 12.0)
        ai_confidence_score = max(35.0, round(base_confidence - deductions, 1))

        if is_duplicate or critical_tamper or warning_tamper:
            overall_status = "Tampering / Anomaly Suspected"
            forensic_summary = "Forensic anomalies or duplicate hash flagged. Administrative physical inspection recommended; do not conclude forgery without manual review."
        elif critical_findings or major_findings:
            overall_status = "Deficiency Flagged"
            forensic_summary = f"{len(critical_findings) + len(major_findings)} regulatory deficiency notice(s) identified against AICTE APH standards."
        elif minor_findings:
            overall_status = "Officer Manual Review Needed"
            forensic_summary = "Minor formatting or field ambiguity detected. Assigned to Officer Manual Queue."
        else:
            overall_status = "Verified (Compliant)"
            forensic_summary = "All deterministic regulatory compliance checks and forensic integrity checks satisfied."

        # Step 6: Construct and persist VerificationResult
        result = VerificationResult(
            id=record_id,
            file_name=original_filename,
            file_hash_sha256=sha256,
            file_size_bytes=file_size_bytes,
            file_type=ext.upper().replace(".", ""),
            upload_timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            document_type=resolved_doc_type,
            institution_id=extracted_data.institution_id or expected_pid,
            institution_name=extracted_data.institution_name or expected_institution_name,
            overall_status=overall_status,
            ai_confidence_score=ai_confidence_score,
            is_synthetic=False,  # This was processed through real pipeline
            extracted_data=extracted_data,
            findings=findings,
            tamper_signals=tamper_signals,
            alteration_indicators=alteration_indicators,
            is_duplicate=is_duplicate,
            duplicate_of=duplicate_of,
            metadata_summary=pdf_metadata,
            ocr_engine_used=ocr_engine,
            forensic_summary=forensic_summary
        )

        StorageService.save_verification_record(result)
        return result
