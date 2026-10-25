import re
import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from ..schemas import ExtractedEntityData, FacultyMember, CourseRecord
from ..config import settings

# Attempt import of fitz (PyMuPDF)
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

# Attempt import of PaddleOCR
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except Exception:
    PADDLE_AVAILABLE = False

class DocumentExtractor:
    def __init__(self):
        self.paddle_ocr = None
        if PADDLE_AVAILABLE:
            try:
                # Initialize PaddleOCR lazily or when requested
                self.paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            except Exception as e:
                print(f"Notice: PaddleOCR initialisation deferred or unavailable: {e}")

    def extract_document(self, file_path: Path, mime_type: str) -> Tuple[ExtractedEntityData, Dict[str, Any], str]:
        """
        Main extraction entrypoint. Extracts text, runs OCR if scanned,
        extracts regulatory entities, and collects structural PDF metadata.
        Returns: (ExtractedEntityData, metadata_dict, ocr_engine_used)
        """
        raw_text_by_page: Dict[int, str] = {}
        metadata: Dict[str, Any] = {}
        ocr_engine_used = "PyMuPDF Native Text Parser"

        if mime_type == "application/pdf":
            raw_text_by_page, metadata, ocr_engine_used = self._extract_pdf(file_path)
        else:
            raw_text_by_page, ocr_engine_used = self._extract_image(file_path)

        # Parse entities from extracted text
        extracted_data = self._parse_entities(raw_text_by_page)
        
        # Check if Gemini API is available and can enrich/validate
        if settings.GEMINI_API_KEY:
            extracted_data = self._enrich_with_gemini(raw_text_by_page, extracted_data)

        return extracted_data, metadata, ocr_engine_used

    def _extract_pdf(self, file_path: Path) -> Tuple[Dict[int, str], Dict[str, Any], str]:
        text_by_page: Dict[int, str] = {}
        metadata: Dict[str, Any] = {}
        engine_used = "PyMuPDF Native Parser"

        if not PYMUPDF_AVAILABLE:
            return {1: "Notice: PyMuPDF not available in current environment."}, {}, "Fallback Scanner"

        doc = fitz.open(file_path)
        metadata = doc.metadata or {}
        metadata["page_count"] = len(doc)
        metadata["is_encrypted"] = doc.is_encrypted
        metadata["format"] = doc.metadata.get("format", "PDF")
        
        needs_ocr = False
        for page_idx in range(len(doc)):
            page_num = page_idx + 1
            page = doc[page_idx]
            page_text = page.get_text("text").strip()
            
            # If page text is very short (< 30 chars), page might be a scanned document
            if len(page_text) < 30:
                scanned_text = self._ocr_page(page, file_path, page_idx)
                if scanned_text:
                    page_text = scanned_text
                    needs_ocr = True
            
            text_by_page[page_num] = page_text

        doc.close()
        if needs_ocr:
            engine_used = "PaddleOCR / PyMuPDF Hybrid OCR"
            
        return text_by_page, metadata, engine_used

    def _ocr_page(self, fitz_page, file_path: Path, page_idx: int) -> str:
        """Runs OCR on a PDF page using PaddleOCR or PyMuPDF OCR."""
        try:
            # First try PyMuPDF built-in OCR if available
            try:
                tp = fitz_page.get_textpage_ocr(language='eng', dpi=150)
                ocr_text = fitz_page.get_text(textpage=tp)
                if len(ocr_text.strip()) > 20:
                    return ocr_text
            except Exception:
                pass

            # Try PaddleOCR if initialized
            if self.paddle_ocr:
                pix = fitz_page.get_pixmap(dpi=150)
                temp_img_path = file_path.parent / f"_temp_page_{page_idx}.png"
                pix.save(str(temp_img_path))
                ocr_result = self.paddle_ocr.ocr(str(temp_img_path), cls=True)
                if temp_img_path.exists():
                    temp_img_path.unlink()
                if ocr_result and ocr_result[0]:
                    lines = [line[1][0] for line in ocr_result[0] if line and line[1]]
                    return "\n".join(lines)
        except Exception as e:
            print(f"OCR page warning: {e}")
        return ""

    def _extract_image(self, file_path: Path) -> Tuple[Dict[int, str], str]:
        engine_used = "PaddleOCR Image Scanner"
        text = ""
        try:
            if self.paddle_ocr:
                ocr_result = self.paddle_ocr.ocr(str(file_path), cls=True)
                if ocr_result and ocr_result[0]:
                    lines = [line[1][0] for line in ocr_result[0] if line and line[1]]
                    text = "\n".join(lines)
            else:
                engine_used = "PIL Geometric Image Analyzer"
                # Extract image metadata
                from PIL import Image
                with Image.open(file_path) as img:
                    text = f"Image format: {img.format}, Dimensions: {img.size}, Mode: {img.mode}"
        except Exception as e:
            text = f"Image processing exception: {str(e)}"
            
        return {1: text}, engine_used

    def _parse_entities(self, text_by_page: Dict[int, str]) -> ExtractedEntityData:
        data = ExtractedEntityData()
        data.page_count = len(text_by_page)
        
        full_text = "\n--- PAGE BREAK ---\n".join([f"[Page {p}]\n{txt}" for p, txt in text_by_page.items()])
        data.raw_text_summary = full_text[:1200]
        
        # 1. Permanent Institute ID (PID)
        # Matches patterns like 1-4359812451, PID: 1-109723441, Permanent Institute Id: 1-3329182311
        pid_regex = re.compile(r'(?:PID|Permanent Institute Id|AICTE ID|Institute ID|PID\s*[:\-])\s*[:\-]?\s*([1-9]-[0-9]{8,11}|[1-9][0-9]{8,10})', re.IGNORECASE)
        for page_num, text in text_by_page.items():
            match = pid_regex.search(text)
            if match and not data.institution_id:
                data.institution_id = match.group(1).strip()
                data.source_page_references["institution_id"] = page_num
                break

        # Fallback PID check: any 1-XXXXXXXXXX pattern
        if not data.institution_id:
            raw_pid_match = re.search(r'\b(1-[0-9]{9,10})\b', full_text)
            if raw_pid_match:
                data.institution_id = raw_pid_match.group(1)
                data.source_page_references["institution_id"] = 1

        # 2. Institution Name
        inst_regex = re.compile(
            r'(?:Name of the (?:Institution|College|Institute)|Institution Name)\s*[:\-]\s*([^\n\r,]+(?:Institute|College|University|Academy|Polytechnic)[^\n\r,]*)',
            re.IGNORECASE
        )
        for page_num, text in text_by_page.items():
            match = inst_regex.search(text)
            if match and not data.institution_name:
                data.institution_name = match.group(1).strip()
                data.source_page_references["institution_name"] = page_num
                break

        # 3. Certificate Number / Letter Number
        cert_regex = re.compile(
            r'(?:Certificate (?:No|Number)|NOC (?:No|Number)|Order (?:No|Number)|F\.?\s*No\.?|Ref\.?\s*(?:No|Number)|Letter (?:No|Number))\s*[:\-]?\s*([A-Za-z0-9\/\.\-_]+)',
            re.IGNORECASE
        )
        for page_num, text in text_by_page.items():
            match = cert_regex.search(text)
            if match and not data.certificate_number:
                val = match.group(1).strip()
                if len(val) >= 4 and not val.lower().startswith('dated'):
                    data.certificate_number = val
                    data.source_page_references["certificate_number"] = page_num
                    break

        # 4. Dates: Issue Date, Expiry Date, Academic Year
        date_pattern = r'(\b\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}\b|\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4}\b)'
        
        # Expiry date
        exp_regex = re.compile(r'(?:Valid\s*(?:upto|until|till)|Expiry Date|Date of Expiry|Expires on)\s*[:\-]?\s*' + date_pattern, re.IGNORECASE)
        for page_num, text in text_by_page.items():
            match = exp_regex.search(text)
            if match and "expiry_date" not in data.dates:
                data.dates["expiry_date"] = match.group(1).strip()
                data.source_page_references["expiry_date"] = page_num
                break

        # Issue date
        issue_regex = re.compile(r'(?:Date of Issue|Issued on|Date|Dated)\s*[:\-]?\s*' + date_pattern, re.IGNORECASE)
        for page_num, text in text_by_page.items():
            match = issue_regex.search(text)
            if match and "issue_date" not in data.dates:
                data.dates["issue_date"] = match.group(1).strip()
                data.source_page_references["issue_date"] = page_num
                break

        # Academic Year (e.g., 2024-2025, 2025-26)
        ay_match = re.search(r'\b(202[0-9]\s*[-–/]\s*(?:202[0-9]|[0-9]{2}))\b', full_text)
        if ay_match:
            data.dates["academic_year"] = ay_match.group(1).strip()

        # 5. Fee Amounts & Receipts
        fee_regex = re.compile(r'(?:Regulatory Fee|Processing Fee|Total Fee|Application Fee|Amount Paid|DD Amount)\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.\d{2})?)', re.IGNORECASE)
        for page_num, text in text_by_page.items():
            matches = fee_regex.finditer(text)
            for m in matches:
                try:
                    num_str = m.group(1).replace(",", "")
                    amt = float(num_str)
                    if amt > 100:
                        data.fee_amounts["regulatory_fee"] = amt
                        data.source_page_references["regulatory_fee"] = page_num
                        break
                except ValueError:
                    pass

        receipt_match = re.search(r'(?:Receipt (?:No|Number)|Transaction (?:Id|Ref)|UTR (?:No|Number))\s*[:\-]?\s*([A-Za-z0-9\-_]+)', full_text, re.IGNORECASE)
        if receipt_match:
            data.fee_receipt_numbers.append(receipt_match.group(1).strip())

        # 6. Faculty Members & Cadres
        # Matches lines with Dr./Prof./Mr./Ms. followed by qualifications and cadre
        faculty_pattern = re.compile(
            r'(?:Dr\.|Prof\.|Shri|Smt\.|Mr\.|Ms\.)\s+([A-Z][a-zA-Z\s\.]+?)\s*[,|\-]\s*([A-Za-z\s\.\(\)\/]+?(?:Ph\.?D|M\.?Tech|M\.?E|B\.?Tech|MBA|MCA)[A-Za-z\s\.\(\)\/]*?)\s*[,|\-]\s*(Professor|Associate Professor|Assistant Professor|Lecturer|Principal|Director)',
            re.IGNORECASE
        )
        for page_num, text in text_by_page.items():
            for m in faculty_pattern.finditer(text):
                f_name = m.group(1).strip()
                f_qual = m.group(2).strip()
                f_cadre = m.group(3).strip().title()
                data.faculty_members.append(FacultyMember(
                    name=f_name,
                    qualification=f_qual,
                    designation=f_cadre,
                    cadre=f_cadre,
                    page_ref=page_num
                ))

        # 7. Courses and Approved Intake
        # Matches course lines like "Computer Science & Engineering: 120" or "B.Tech Mechanical Engineering ... 60"
        course_pattern = re.compile(
            r'([A-Za-z\s&]{4,40}(?:Engineering|Technology|Computer|Management|Pharmacy|MCA|Architecture))\s*(?:-\s*(?:UG|PG))?\s*[:|\t,]\s*(\d{2,3})\b',
            re.IGNORECASE
        )
        total_intake = 0
        for page_num, text in text_by_page.items():
            for m in course_pattern.finditer(text):
                c_name = m.group(1).strip()
                try:
                    c_intake = int(m.group(2))
                    if 15 <= c_intake <= 360:
                        data.courses.append(CourseRecord(
                            name=c_name,
                            level="UG" if "B." in c_name or "Bachelor" in c_name else "PG" if "M." in c_name else "UG",
                            approved_intake=c_intake,
                            page_ref=page_num
                        ))
                        total_intake += c_intake
                except ValueError:
                    pass

        if total_intake > 0:
            data.approved_intake_total = total_intake

        # 8. Document Classification Detection
        data.document_type_detected = self._detect_document_type(full_text)

        return data

    def _detect_document_type(self, text: str) -> str:
        text_lower = text.lower()
        if "fire" in text_lower and ("safety" in text_lower or "noc" in text_lower or "cfo" in text_lower):
            return "Fire & Life Safety NOC (Form B)"
        elif "pollution" in text_lower or "spcb" in text_lower or "consent to operate" in text_lower:
            return "State Pollution Control Board NOC"
        elif "faculty" in text_lower and ("cadre" in text_lower or "form-16" in text_lower or "salary" in text_lower):
            return "Faculty Cadre & Form-16 List"
        elif "architect" in text_lower or "built-up" in text_lower or "carpet area" in text_lower or "fsi" in text_lower:
            return "Architect Built-up Area Certificate"
        elif "mutation" in text_lower or "title deed" in text_lower or "khasra" in text_lower or "land conversion" in text_lower:
            return "Land Title Deed & Mutation Certificate"
        elif "affiliation" in text_lower and ("university" in text_lower or "affiliating" in text_lower):
            return "University Affiliation Letter"
        elif "divyangjan" in text_lower or "barrier-free" in text_lower or "ramp" in text_lower:
            return "Barrier-free Divyangjan Ramp Certificate"
        elif "extension of approval" in text_lower or "eoa" in text_lower:
            return "Previous Approval Order (EoA)"
        elif "balance sheet" in text_lower or "fixed deposit" in text_lower or "corpus" in text_lower or "chartered accountant" in text_lower:
            return "Audited Balance Sheet & Corpus FD"
        return "Regulatory Document"

    def _enrich_with_gemini(self, text_by_page: Dict[int, str], current_data: ExtractedEntityData) -> ExtractedEntityData:
        """
        Optional enrichment using Google Gemini API when credentials are provided in env.
        Preserves local extraction if API call fails.
        """
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            sample_text = "\n".join([f"Page {p}: {t[:1000]}" for p, t in list(text_by_page.items())[:3]])
            prompt = f"""
            Extract regulatory AICTE verification fields from the following document text:
            {sample_text}
            
            Return JSON with:
            - institution_id (string, e.g. 1-10923412)
            - institution_name (string)
            - certificate_number (string)
            - document_type (string)
            - issue_date (string)
            - expiry_date (string)
            - approved_intake_total (number)
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            if response and response.text:
                # Parse JSON block
                clean_json = response.text.replace("```json", "").replace("```", "").strip()
                data_dict = json.loads(clean_json)
                if not current_data.institution_id and data_dict.get("institution_id"):
                    current_data.institution_id = data_dict["institution_id"]
                if not current_data.certificate_number and data_dict.get("certificate_number"):
                    current_data.certificate_number = data_dict["certificate_number"]
                if not current_data.institution_name and data_dict.get("institution_name"):
                    current_data.institution_name = data_dict["institution_name"]
                if "expiry_date" not in current_data.dates and data_dict.get("expiry_date"):
                    current_data.dates["expiry_date"] = data_dict["expiry_date"]
        except Exception as e:
            print(f"Gemini enrichment skipped/failed: {e}")
            
        return current_data
