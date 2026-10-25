import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env file from backend root or parent if present
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings(BaseModel):
    PROJECT_NAME: str = "Veriflo AI - Regulatory Verification Engine"
    API_V1_STR: str = "/api"
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    RECORDS_DIR: Path = BASE_DIR / "storage" / "records"
    MAX_FILE_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: set = {".pdf", ".png", ".jpg", ".jpeg"}
    ALLOWED_MIME_TYPES: set = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/pjpeg"
    }
    # NVIDIA NIM (Inference Microservice) Configuration
    NVIDIA_NIM_API_KEY: str = os.getenv("NVIDIA_NIM_API_KEY", "")
    NVIDIA_NIM_BASE_URL: str = os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NVIDIA_NIM_MODEL: str = os.getenv("NVIDIA_NIM_MODEL", "meta/llama-3.3-70b-instruct")

    # Gemini API key stored exclusively in environment variables (Fallback)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.RECORDS_DIR.mkdir(parents=True, exist_ok=True)
