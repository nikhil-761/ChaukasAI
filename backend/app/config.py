"""Saari settings .env se. Koi bhi value missing ho to app crash nahi hota - graceful fallback."""
import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "env.ready")  # .env na ho to ye file (key ke saath) use hoti hai
# Purane Vision-Agent/.env se bhi key utha lo (agar backend/.env me nahi hai)
if not os.getenv("KODEKEY_API_KEY"):
    load_dotenv(ROOT_DIR / "Vision-Agent" / ".env")

DATA_DIR = Path(os.getenv("DATA_DIR") or (BASE_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _get(name, default=""):
    v = os.getenv(name)
    return v.strip() if v and v.strip() else default


KODEKEY_API_KEY = _get("KODEKEY_API_KEY")
KODEKEY_BASE_URL = _get("KODEKEY_BASE_URL", "https://api.ai.kodekloud.com/v1")
VISION_MODEL = _get("VISION_MODEL", "google/gemini-3.5-flash")

MONGODB_URI = _get("MONGODB_URI")
MONGODB_DB = _get("MONGODB_DB", "chaukas")

ADMIN_USER = _get("ADMIN_USER", "admin")
ADMIN_PASS = _get("ADMIN_PASS", "Chaukas@2026")
ADMIN_TTL_HOURS = 8


def _jwt_secret():
    s = _get("JWT_SECRET")
    if s:
        return s
    f = DATA_DIR / ".jwt_secret"  # restart ke baad bhi login valid rahe
    try:
        if f.exists():
            return f.read_text().strip()
        s = secrets.token_hex(32)
        f.write_text(s)
        return s
    except OSError:
        return secrets.token_hex(32)


JWT_SECRET = _jwt_secret()

N8N_WEBHOOK_URL = _get("N8N_WEBHOOK_URL")
DEPT_EMAIL = _get("DEPT_EMAIL", "demo@chaukas.test")
CORS_ORIGINS = [o.strip() for o in _get("CORS_ORIGINS", "*").split(",") if o.strip()]
SEED_DEMO = _get("SEED_DEMO", "true").lower() != "false"
MAX_UPLOAD_MB = 12
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST") or (ROOT_DIR / "frontend" / "dist"))
