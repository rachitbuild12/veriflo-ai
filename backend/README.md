# Veriflo AI — Document Verification & Compliance Engine

A high-performance GovTech regulatory verification backend built with **Python FastAPI**, **PyMuPDF**, and deterministic compliance rule engines modeled on the **AICTE Approval Process Handbook (APH)**.

---

## Capabilities & Architecture

1. **Multi-Format Ingestion**: Supports `.pdf`, `.png`, and `.jpeg` document uploads up to 25 MB with magic-byte validation and secure isolated storage.
2. **Cryptographic Integrity & SHA-256 Deduplication**: Calculates binary SHA-256 checksums to immediately flag duplicate document submissions across regulatory dossiers.
3. **Forensic Metadata & Alteration Analysis**: Inspects PDF stream xrefs, CreationDate vs ModDate discrepancies, consumer desktop editor signatures (Photoshop, Canva, etc.), and font inconsistencies.
   > **Integrity Principle**: In compliance with GovTech standards, documents are never declared forged solely based on an anomaly; instead, clear indicators and recommended physical inspections are generated.
4. **Deterministic Compliance Rules Engine**:
   - `RULE-DUP-004`: Exact Duplicate Document Check (SHA-256)
   - `RULE-PID-005`: Mismatched Institution Identifier (PID)
   - `RULE-EXP-002`: Expired Certificate Verification
   - `RULE-FLD-003`: Mandatory Field Completeness Check
   - `RULE-CAD-006`: Faculty Senior Cadre Ph.D. Qualification Norm
   - `RULE-CAD-006B`: Faculty Cadre Ratio Proportion Check (1:2:6)
   - `RULE-FEE-007`: Statutory Regulatory Processing Fee Discrepancy
   - `RULE-EOA-008`: Variance from Previous Sanctioned Approval Record (EoA)
5. **Structured Outputs**: Every finding includes severity (`Critical`, `Major`, `Minor`, `Info`), observed value, expected value, applicable rule clause, source document reference, page number, and recommended next action.
6. **Optional Gemini API Extension**: Optional multimodal LLM classification and structured table extraction configured strictly via `GEMINI_API_KEY` environment variable.

---

## Setup Instructions

### Prerequisites
- Python 3.10, 3.11, or 3.12 (Recommended: 3.11)
- `uv` or standard `pip`

### 1. Virtual Environment Setup
```powershell
# Using uv (fastest)
uv venv backend/.venv --python 3.11
backend\.venv\Scripts\activate

# Or using standard python
python -m venv backend/.venv
backend\.venv\Scripts\activate
```

### 2. Install Dependencies
```powershell
uv pip install -r backend/requirements.txt
# Or: pip install -r backend/requirements.txt
```

### 3. Environment Variables (Optional)
Copy `.env.example` to `.env`:
```powershell
copy backend\.env.example backend\.env
```
Add your optional `GEMINI_API_KEY` if you want AI-assisted table classification. Local PyMuPDF extraction and rule verification work 100% offline without any API keys.

### 4. Running the Backend Server
```powershell
# From the project root:
backend\.venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive OpenAPI documentation will be available at:
`http://127.0.0.1:8000/docs`

---

## Running Automated Tests

```powershell
backend\.venv\Scripts\pytest backend/tests -v
```
