from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from ..schemas import UploadResponse
from ..services.pipeline import VerificationPipeline

router = APIRouter(prefix="/documents", tags=["Document Upload & Verification"])
pipeline = VerificationPipeline()

@router.post("/upload", response_model=UploadResponse)
async def upload_and_verify_document(
    file: UploadFile = File(..., description="Document file to upload (PDF, PNG, or JPEG)"),
    document_type: Optional[str] = Form(None, description="Document category/type hint"),
    expected_pid: Optional[str] = Form(None, description="Expected Permanent Institute ID (PID)"),
    institution_name: Optional[str] = Form(None, description="Expected Institution Name"),
    previous_approved_intake: Optional[int] = Form(None, description="Past sanctioned intake for variance check"),
    expected_fee_amount: Optional[float] = Form(100000.0, description="Expected statutory fee amount in INR"),
    application_type: Optional[str] = Form("Extension of Approval (EoA)", description="Application category")
):
    """
    Upload an official regulatory document (PDF, PNG, JPEG), validate magic bytes,
    perform neural optical character recognition and metadata extraction,
    run deterministic AICTE APH compliance checks, and return structured findings.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload payload."
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file stream: {str(e)}"
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes). Please upload a valid document."
        )

    try:
        result = pipeline.process_document(
            content=content,
            original_filename=file.filename,
            document_type_hint=document_type,
            expected_pid=expected_pid,
            expected_institution_name=institution_name,
            previous_approved_intake=previous_approved_intake,
            expected_fee_amount=expected_fee_amount,
            application_type=application_type or "Extension of Approval (EoA)"
        )
        return UploadResponse(
            status="success",
            message=f"Document '{file.filename}' processed and verified successfully.",
            data=result
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification pipeline failed: {str(e)}"
        )
