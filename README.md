# Veriflo AI — AI-Powered Application Validation, Document Authentication & Regulatory Compliance Verification

> **Smart India Hackathon (SIH) Prototype**  
> *AICTE Regulatory Compliance & Digital Scrutiny Platform (APH 2025–26)*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

---

## 🏛️ Executive Overview

**Veriflo AI** is a government-grade digital scrutiny and regulatory compliance platform engineered for technical education approval bodies such as AICTE. It automates multi-tier document authentication, forensic tamper detection, cadastral and municipal certificate reconciliation, temporal regulatory drift simulation, and physical infrastructure auditing.

The system enforces the **Approval Process Handbook (APH 2025–26)** norms and provides an auditable, transparent verification pipeline that replaces slow, error-prone manual scrutiny with deterministic checks and visual AI forensics.

---

## 🚀 Key Modules & Capabilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                              VERIFLO AI                                │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│    01. PREDICT  │    02. TRACE     │ 03. EXPOSE GAPS │  04. INSPECT    │
│   Compliance    │Evidence Depend.  │  Blind-Spot     │ Infrastructure  │
│  Time Machine   │     Graph        │   Detector      │ Evidence Review │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

### 1. Document Ingestion & Forensic OCR
* **Multi-Modal Processing:** Ingests native vector PDFs, high-resolution scans, blueprints, CAD plans, and photos.
* **Deterministic Optical Extraction:** Powered by **PyMuPDF (`fitz`)** for clean PDF text and layout extraction with OCR fallback.
* **Forensic Screening:**
  * **SHA-256 Collision Detection:** Flags duplicate image filings across institutions (e.g. cross-campus stock laboratory photo reuse).
  * **Metadata Anomaly Analysis:** Detects software alteration signatures (e.g. `Adobe Photoshop` traces in EXIF headers), missing mandatory GPS geotags, and future timestamps.

### 2. Evidence Dependency Graph
* **Directed Lineage:** Built with **React Flow (`@xyflow/react`)**, rendering semantic relationships: `supports`, `extracted_from`, `compared_with`, `governed_by`, and `conflicts_with`.
* **Conflict Highlighting:** Graphically isolates conflicting claims with red animated dashed edges (e.g., resident professor Form-16 claims vs. EPFO active deduction registries in another city).
* **Accessible Alternative:** Includes a full WCAG-compliant tabular lineage view.

### 3. Compliance Time Machine (Horizon Simulation)
* **Scenario Simulator:** Models prospective institutional changes (e.g., expanding sanctioned intake from 240 to 360, introducing new courses, or altering faculty rosters).
* **Dynamic Rule Auditing:** Runs versioned APH regulatory checks against baseline and proposed states to identify pass/fail transitions, unfulfilled faculty cadre quotas, and classroom area deficits before official filing.

### 4. Verification Blind-Spot Detector & Source Barrier
* **8 Granular Verification Statuses:** Tracks claims across `Not checked`, `Processing failed`, `Extracted locally`, `Matched against supplied records`, `Verified through authorized source`, `Source unavailable`, `Manual verification required`, and `Inconclusive`.
* **Strict Source Barrier Guardrail:** Local OCR matches, AI model outputs, or internal applicant database entries **never** count as independent issuer verification without authenticated API handshakes.
* **Manual Officer Scrutiny Workflow:** Mandatory reviewer credentials, role designation, audit notes (min. 8 characters), and dispatch citations.

### 5. Infrastructure Evidence Review (Visual AI & CAD)
* **Categorized Auditing:** Reviews Instructional Areas, Workshops, Computer Centers, Fire Suppression Systems, and Divyangjan Barrier-Free Ramps.
* **Interactive Scrutiny Pin Dropper:** Dropping pins with normalized percentage coordinates `(x, y)`, severity levels, and category classifications.
* **AI vs. Reviewer Boundary:** AI suggestions are marked non-authoritative until explicitly confirmed by an officer.
* **Side-by-Side Dual Dossier Viewer:** Split-screen comparison with a mandatory GovTech legal caution banner (visual variations do not independently establish fraud without EVC physical verification).

### 6. Official Multi-Page PDF Scrutiny Order Generator
* Native client-side vector PDF generation using **`jspdf`**.
* Embeds Ministry of Education & AICTE mastheads, application metadata, document inventory tables, extracted fields, rule violations, blind spots, infrastructure findings, and digital signing certificates with DSC Class 3 tokens.

### 7. Role-Based Access Control (RBAC)
* **Clearance Hierarchy:**
  * **Level 4 — Senior Director (Approval Bureau):** Full national authority; grants final Extension of Approval (EoA).
  * **Level 3 — Standing Appellate Committee Member:** Adjudicates contested deficiency notices and institutional appeals.
  * **Level 2 — Regional Scrutiny Officer (WRO):** Executes primary document verification, issues 15-day deficiency notices, and conducts manual checks.
  * **Level 1 — System Auditor / Vigilance Officer:** Monitors forensic tamper signals, cross-campus collisions, and audit log SHA-256 integrity.

---

## 🛠️ Tech Stack & Architecture

### Frontend
* **Framework:** React 19 + TypeScript + Vite
* **Styling:** Tailwind CSS + Radix UI / Lucide Icons
* **Graph Visualization:** `@xyflow/react` (React Flow)
* **Charts & Analytics:** Recharts
* **PDF Engine:** jsPDF

### Backend
* **API Framework:** Python FastAPI (ASGI) + Uvicorn
* **PDF Extraction:** PyMuPDF (`fitz`)
* **Storage:** Local encrypted private storage filesystem (`backend/storage`)
* **Testing:** PyTest + PyTest-Asyncio

---

## ⚙️ Getting Started

### Prerequisites
* **Node.js:** v20.18+ or v22+
* **Python:** 3.11+
* **Git**

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/rachitbuild12/veriflo-ai.git
   cd veriflo-ai
   ```

2. **Frontend Setup:**
   ```bash
   # Install npm dependencies
   npm install
   ```

3. **Backend Setup:**
   ```bash
   # Create and activate Python virtual environment
   cd backend
   python -m venv .venv
   
   # Windows PowerShell:
   .venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate

   # Install Python requirements
   pip install -r requirements.txt
   cd ..
   ```

---

## 🏃 Running the Application

### 1. Launch FastAPI Backend
```powershell
# Windows PowerShell
& "backend\.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend Health: `http://127.0.0.1:8000/api/health`
* Swagger API Docs: `http://127.0.0.1:8000/docs`

### 2. Launch Vite Frontend
```powershell
# In a separate terminal
npm run dev -- --host 127.0.0.1 --port 5173
```
* Web App URL: `http://127.0.0.1:5173`

---

## 🧪 Automated Testing & QA

Veriflo AI includes 5 automated test suites covering backend API contracts, graph lineage, blind-spot integrity, and the full end-to-end SIH scrutiny journey:

```powershell
# Run full SIH integration and QA test suite (9/9 passed)
npm run test:integration

# Run infrastructure review test suite (5/5 passed)
npm run test:infra

# Run verification blind-spot test suite (5/5 passed)
npm run test:blindspot

# Run evidence dependency graph test suite (5/5 passed)
npm run test:graph

# Run backend PyTest suite (21/21 passed)
& "backend\.venv\Scripts\python.exe" -m pytest backend/tests/ -q

# Run production build validation
npm run build
```

---

## 🧭 SIH 7-Step Interactive Walkthrough

The platform features an evaluator tour accessible from the top bar via **"Launch SIH Guided Tour"**:

1. **Submit / Register Application Dossier:** Focuses on Apex Horizon (`APP-2025-03`).
2. **Identify Expired Certificate:** Flags expired Fire Safety NOC (`30-Nov-2024`).
3. **Detect Faculty Mismatch:** Exposes dual concurrent employment in Lucknow (480 km away).
4. **Trace in Dependency Graph:** Visualizes conflict edges linking Form-16 to EPFO records.
5. **Simulate Intake Increase (+50%):** Models 240 &rarr; 360 seat expansion (+6 faculty required).
6. **Reveal Unavailable Issuer Blind Spot:** Shows State Fire Gateway 503 and uncertified lab photo.
7. **Complete Reviewer Action & Export PDF Order:** Issues 15-day statutory notice and downloads sealed multi-page PDF order.

---

## ⚖️ Regulatory Notice & Disclaimers

> [!NOTE]
> **Academic & Hackathon Prototype Disclaimer:**  
> Veriflo AI is a demonstration prototype created for the **Smart India Hackathon (SIH)**. All institutional records (VJTI, COEP, Apex Horizon, etc.) and simulated issuer API handshakes (e-Mahabhumi, State Fire Service, EPFO) are synthetic benchmarks. This platform does not claim official endorsement or live integration with AICTE production infrastructure.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
