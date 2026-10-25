import os
from pathlib import Path
from fastapi import APIRouter
from ..config import settings
from ..services.extractor import PYMUPDF_AVAILABLE, PADDLE_AVAILABLE

router = APIRouter(prefix="", tags=["System Health & Engine Capabilities"])

@router.get("/health")
def health_check():
    """Health endpoint returning system status and loaded engine capabilities."""
    stored_count = len(list(settings.RECORDS_DIR.glob("DOC-*.json")))
    return {
        "status": "healthy",
        "engine": "Veriflo AI Regulatory Verification Engine",
        "version": "4.2.0",
        "capabilities": {
            "pymupdf_digital_extractor": PYMUPDF_AVAILABLE,
            "paddleocr_scanned_ocr": PADDLE_AVAILABLE,
            "gemini_api_configured": bool(settings.GEMINI_API_KEY),
            "sha256_duplicate_detection": True,
            "metadata_alteration_analyzer": True,
            "deterministic_rules_count": 8
        },
        "statistics": {
            "stored_verification_records": stored_count,
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
            "allowed_formats": list(settings.ALLOWED_EXTENSIONS)
        }
    }
