import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "capabilities" in data
    assert data["capabilities"]["sha256_duplicate_detection"] is True

def test_get_rules_endpoint():
    response = client.get("/api/verification/rules")
    assert response.status_code == 200
    rules = response.json()
    assert isinstance(rules, list)
    rule_ids = [r["rule_id"] for r in rules]
    assert "RULE-DUP-004" in rule_ids
    assert "RULE-PID-005" in rule_ids
    assert "RULE-EXP-002" in rule_ids

def test_upload_invalid_magic_bytes():
    # A text file pretending to be a pdf
    fake_pdf = io.BytesIO(b"This is just plain text, not a real PDF.")
    response = client.post(
        "/api/documents/upload",
        files={"file": ("fake.pdf", fake_pdf, "application/pdf")},
        data={"document_type": "Fire NOC"}
    )
    assert response.status_code == 400
    assert "Invalid PDF header signature" in response.json()["detail"]

def test_upload_unsupported_extension():
    fake_exe = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
    response = client.post(
        "/api/documents/upload",
        files={"file": ("malware.exe", fake_exe, "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_upload_valid_minimal_pdf_and_duplicate_detection():
    import time
    # Construct a valid minimal PDF with a unique comment so it's fresh on each test run
    unique_tag = f"% Test run {time.time_ns()}\n".encode()
    minimal_pdf = (
        b"%PDF-1.4\n"
        + unique_tag +
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
        b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \n"
        b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF\n"
    )

    # 1. First upload
    response1 = client.post(
        "/api/documents/upload",
        files={"file": ("sample_cert.pdf", io.BytesIO(minimal_pdf), "application/pdf")},
        data={
            "document_type": "Fire & Life Safety NOC (Form B)",
            "expected_pid": "1-4359812451",
            "institution_name": "Maharashtra Institute of Technology"
        }
    )
    assert response1.status_code == 200
    res1_data = response1.json()["data"]
    assert res1_data["is_duplicate"] is False
    assert res1_data["is_synthetic"] is False
    doc_id = res1_data["id"]

    # 2. Retrieve by ID
    get_res = client.get(f"/api/verification/results/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id

    # 3. Second upload with identical bytes -> must detect duplicate SHA-256!
    response2 = client.post(
        "/api/documents/upload",
        files={"file": ("sample_cert_resubmission.pdf", io.BytesIO(minimal_pdf), "application/pdf")},
        data={"document_type": "Fire & Life Safety NOC (Form B)"}
    )
    assert response2.status_code == 200
    res2_data = response2.json()["data"]
    assert res2_data["is_duplicate"] is True
    assert res2_data["duplicate_of"] == doc_id
    # Rule DUP-004 should have failed with Critical severity
    dup_finding = [f for f in res2_data["findings"] if f["rule_id"] == "RULE-DUP-004"][0]
    assert dup_finding["passed"] is False
    assert dup_finding["severity"] == "Critical"
