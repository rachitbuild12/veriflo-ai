import hashlib
import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
from fastapi import HTTPException, UploadFile, status
from ..config import settings
from ..schemas import VerificationResult

HASH_INDEX_PATH = settings.RECORDS_DIR / "hash_index.json"

def _load_hash_index() -> Dict[str, str]:
    if HASH_INDEX_PATH.exists():
        try:
            with open(HASH_INDEX_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def _save_hash_index(index: Dict[str, str]) -> None:
    try:
        with open(HASH_INDEX_PATH, "w", encoding="utf-8") as f:
            json.dump(index, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save hash index: {e}")

class StorageService:
    @staticmethod
    def compute_sha256(content: bytes) -> str:
        """Calculate SHA-256 checksum for byte content."""
        hasher = hashlib.sha256()
        hasher.update(content)
        return hasher.hexdigest()

    @staticmethod
    def validate_file_bytes(content: bytes, filename: str) -> str:
        """
        Validate file size and magic bytes against supported document types (PDF, PNG, JPEG).
        Returns the confirmed MIME type.
        """
        size_mb = len(content) / (1024 * 1024)
        if size_mb > settings.MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
            )
        
        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Only PDF, PNG, and JPEG documents are permitted."
            )

        # Magic bytes verification
        if ext == ".pdf":
            if not content.startswith(b"%PDF-"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid PDF header signature. The file appears to be corrupted or disguised."
                )
            return "application/pdf"
        elif ext == ".png":
            if not content.startswith(b"\x89PNG\r\n\x1a\n"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid PNG header signature. File is corrupted or not a valid PNG image."
                )
            return "image/png"
        elif ext in [".jpg", ".jpeg"]:
            if not content.startswith(b"\xff\xd8\xff"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid JPEG header signature. File is corrupted or not a valid JPEG image."
                )
            return "image/jpeg"
        
        return "application/octet-stream"

    @staticmethod
    def check_duplicate_hash(sha256: str) -> Optional[str]:
        """Check if identical file hash has already been verified in the repository."""
        index = _load_hash_index()
        return index.get(sha256)

    @classmethod
    def save_upload(cls, content: bytes, original_filename: str) -> Tuple[str, Path, str, bool, Optional[str]]:
        """
        Saves file to secure private storage.
        Returns (record_id, saved_path, sha256, is_duplicate, duplicate_of_id).
        """
        mime_type = cls.validate_file_bytes(content, original_filename)
        sha256 = cls.compute_sha256(content)
        
        # Check duplicate
        duplicate_of = cls.check_duplicate_hash(sha256)
        is_duplicate = duplicate_of is not None
        
        record_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        ext = Path(original_filename).suffix.lower()
        saved_filename = f"{record_id}{ext}"
        saved_path = settings.UPLOAD_DIR / saved_filename
        
        with open(saved_path, "wb") as f:
            f.write(content)
            
        # Register in hash index
        index = _load_hash_index()
        if not is_duplicate:
            index[sha256] = record_id
            _save_hash_index(index)
            
        return record_id, saved_path, sha256, is_duplicate, duplicate_of

    @staticmethod
    def save_verification_record(result: VerificationResult) -> None:
        """Persist verification result in JSON format."""
        file_path = settings.RECORDS_DIR / f"{result.id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(result.model_dump_json(indent=2))

    @staticmethod
    def get_verification_record(record_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve stored verification result by ID."""
        file_path = settings.RECORDS_DIR / f"{record_id}.json"
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    @staticmethod
    def list_all_records() -> list:
        """List all persisted verification records, newest first."""
        records = []
        for file in settings.RECORDS_DIR.glob("DOC-*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    records.append(json.load(f))
            except Exception:
                continue
        # Sort by upload_timestamp descending
        records.sort(key=lambda r: r.get("upload_timestamp", ""), reverse=True)
        return records
