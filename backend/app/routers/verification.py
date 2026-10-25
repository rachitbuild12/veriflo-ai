from typing import List, Dict, Any, Optional
import time
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from ..config import settings
from ..schemas import RuleDefinition
from ..services.storage import StorageService

router = APIRouter(prefix="/verification", tags=["Verification Records & Compliance Rules"])

class NimTestRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None

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

@router.get("/nim/status")
def get_nvidia_nim_status() -> Dict[str, Any]:
    """Retrieve current NVIDIA NIM configuration and active model status."""
    has_key = bool(settings.NVIDIA_NIM_API_KEY)
    masked_key = ""
    if has_key:
        k = settings.NVIDIA_NIM_API_KEY
        masked_key = f"{k[:7]}...{k[-4:]}" if len(k) > 12 else "***configured***"
        
    return {
        "configured": has_key,
        "masked_key": masked_key,
        "base_url": settings.NVIDIA_NIM_BASE_URL,
        "active_model": settings.NVIDIA_NIM_MODEL,
        "recommended_models": [
            "nvidia/nemotron-3.5-bolt-e4b",
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
            "deepseek-ai/deepseek-v4.1-flash"
        ],
        "active_llm_provider": "nvidia_nim" if has_key else ("gemini" if settings.GEMINI_API_KEY else "offline_deterministic")
    }

@router.post("/nim/test")
def test_nvidia_nim_connection(req: Optional[NimTestRequest] = None) -> Dict[str, Any]:
    """Execute a live ping test against the NVIDIA NIM endpoint."""
    api_key = (req.api_key if req and req.api_key else None) or settings.NVIDIA_NIM_API_KEY
    if not api_key:
        return {
            "success": False,
            "status": "not_configured",
            "message": "NVIDIA_NIM_API_KEY is not configured in backend/.env or passed in request."
        }
        
    model = (req.model if req and req.model else None) or settings.NVIDIA_NIM_MODEL
    base_url = (req.base_url if req and req.base_url else None) or settings.NVIDIA_NIM_BASE_URL
    endpoint = f"{base_url.rstrip('/')}/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a regulatory verification engine health probe. Respond with a concise status."},
            {"role": "user", "content": "Respond with: VERIFLO_NIM_READY"}
        ],
        "max_tokens": 15,
        "temperature": 0.1
    }
    
    start_time = time.time()
    try:
        import httpx
        with httpx.Client(timeout=15.0) as client:
            res = client.post(endpoint, headers=headers, json=payload)
            elapsed_ms = round((time.time() - start_time) * 1000, 1)
            
            if res.status_code == 200:
                body = res.json()
                msg = body["choices"][0]["message"]["content"].strip()
                return {
                    "success": True,
                    "status": "connected",
                    "latency_ms": elapsed_ms,
                    "model": model,
                    "endpoint": base_url,
                    "reply": msg,
                    "message": f"Successfully connected to NVIDIA NIM ({model}) in {elapsed_ms}ms."
                }
            else:
                return {
                    "success": False,
                    "status": "error",
                    "status_code": res.status_code,
                    "latency_ms": elapsed_ms,
                    "message": f"NVIDIA NIM responded with error HTTP {res.status_code}: {res.text[:250]}"
                }
    except Exception as e:
        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        return {
            "success": False,
            "status": "exception",
            "latency_ms": elapsed_ms,
            "message": f"Connection to NVIDIA NIM microservice failed: {str(e)}"
        }
