"""Chaukas AI - FastAPI backend.

Run:  uvicorn app.main:app --port 8000          (backend folder se)
Docs: http://localhost:8000/docs
"""
import hmac
import json
import logging
import time
import uuid
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import httpx
import jwt
from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel

from . import config, db as dbmod, engine, vision
from .db import now_iso

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("chaukas")

STATUSES = ("submitted", "in_progress", "resolved", "rejected")
PRIVATE_FIELDS = ("admin_notes", "flagged", "citizen_note", "last_verification")
pool = ThreadPoolExecutor(max_workers=4)


class State:
    store = None
    db_note = ""
    started = time.time()


S = State()


@asynccontextmanager
async def lifespan(app):
    S.store, S.db_note = dbmod.connect()
    seed_if_empty()
    log.info("DB: %s | AI: %s", S.store.describe(), "ready" if vision.ai_ready() else "NO API KEY (fallback mode)")
    yield


app = FastAPI(title="Chaukas AI API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"],
                   allow_credentials=False)


# ---------------------------------------------------------------- helpers
def seed_if_empty():
    """Khali DB mein demo complaints (dates ko aaj ke hisaab se shift karke)."""
    if not config.SEED_DEMO or S.store.count() > 0:
        return
    f = config.BASE_DIR / "seed.json"
    if not f.exists():
        return
    try:
        raw = json.loads(f.read_text(encoding="utf-8"))
        gen = datetime.fromisoformat(raw["generated_at"].replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - gen

        def shift(iso):
            return (datetime.fromisoformat(iso.replace("Z", "+00:00")) + delta).isoformat().replace("+00:00", "Z")

        docs = raw["complaints"]
        for d in docs:
            d["created_at"] = shift(d["created_at"])
            if d.get("resolution") and d["resolution"].get("resolved_at"):
                d["resolution"]["resolved_at"] = shift(d["resolution"]["resolved_at"])
            if d.get("dispatch"):
                d["dispatch"]["at"] = d["created_at"]
        S.store.insert_many(docs)
        log.info("Seeded %d demo complaints", len(docs))
    except Exception as e:  # noqa: BLE001
        log.warning("seed failed: %s", e)


def public(c, admin=False):
    c = dict(c)
    if not admin:
        for k in PRIVATE_FIELDS:
            c.pop(k, None)
    return c


def get_or_404(cid):
    c = S.store.get(cid)
    if not c:
        raise HTTPException(404, "Complaint not found")
    return c


_hits = defaultdict(deque)


def rate_limit(request: Request, key: str, limit: int, per: int = 60):
    ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "?")).split(",")[0].strip()
    q = _hits[(key, ip)]
    now = time.time()
    while q and now - q[0] > per:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(429, "Too many requests. Thodi der baad try karo.")
    q.append(now)


async def read_upload(f: UploadFile):
    data = await f.read()
    if not data:
        raise HTTPException(400, "Photo khali hai.")
    if len(data) > config.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"Photo {config.MAX_UPLOAD_MB} MB se chhoti honi chahiye.")
    try:
        return vision.prepare_image(data)
    except ValueError as e:
        raise HTTPException(415, str(e)) from e


# ---------------------------------------------------------------- health
@app.get("/api/health")
def health():
    ok_db = S.store.ping()
    return {
        "ok": ok_db, "service": "chaukas-ai", "version": app.version,
        "db": S.store.describe(), "db_note": S.db_note,
        "ai": {"configured": vision.ai_ready(), "model": config.VISION_MODEL},
        "complaints": S.store.count() if ok_db else None,
        "webhook": bool(config.N8N_WEBHOOK_URL),
        "uptime_s": int(time.time() - S.started),
    }


# ---------------------------------------------------------------- public: read
@app.get("/api/complaints")
def list_complaints():
    return [public(c) for c in S.store.list()]


@app.get("/api/complaints/{cid}")
def get_complaint(cid: str):
    return public(get_or_404(cid))


@app.get("/api/stats")
def stats():
    items = S.store.list()
    total = len(items)
    resolved = sum(1 for c in items if c["status"] == "resolved")
    return {
        "total": total, "resolved": resolved, "open": total - resolved,
        "critical": sum(1 for c in items if c["severity"]["level"] == "CRITICAL" and c["status"] != "resolved"),
        "rate": round(resolved / total * 100) if total else 0,
    }


@app.get("/api/uploads/{name}")
def get_upload(name: str):
    data = S.store.get_image(name)
    if not data:
        raise HTTPException(404, "Image not found")
    return Response(content=data, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=31536000, immutable"})


# ---------------------------------------------------------------- public: create
@app.post("/api/complaints")
async def create_complaint(
    request: Request, background: BackgroundTasks,
    image: UploadFile = File(...), lat: float = Form(...), lng: float = Form(...),
    text: str = Form(""), language: str = Form("en"), area: str = Form(""),
):
    rate_limit(request, "create", 15)
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(422, "Invalid GPS location")
    jpeg, _size, _gps = await read_upload(image)
    text = (text or "").strip()[:600]
    area = (area or "").strip()[:160] or f"{lat:.4f}, {lng:.4f}"

    # AI vision + OSM context parallel (latency kam)
    f_ai = pool.submit(vision.analyze_issue, jpeg, text, area)
    f_ctx = pool.submit(engine.osm_context, lat, lng)
    analysis, source = f_ai.result()
    osm = f_ctx.result()

    if not analysis["is_valid"] and analysis["confidence"] >= 0.7 and source == "gemini":
        raise HTTPException(422, {
            "code": "not_civic",
            "en": "This photo does not seem to show a civic problem. Please take a clear photo of the issue (pothole, garbage, broken light, leakage...).",
            "hi": "इस फ़ोटो में कोई नागरिक समस्या नहीं दिख रही। कृपया समस्या (गड्ढा, कचरा, खराब लाइट, रिसाव...) की साफ़ फ़ोटो लें।",
            "problem": analysis["problem"]})
    if not analysis["is_valid"]:
        analysis["category"] = analysis["category"] if analysis["category"] != "other" else "other"

    hints = engine.text_context(text)
    context = {
        "school_within_m": osm["school_within_m"] if osm["school_within_m"] is not None else hints.get("school_within_m"),
        "hospital_within_m": osm["hospital_within_m"] if osm["hospital_within_m"] is not None else hints.get("hospital_within_m"),
        "road_type": "main" if "main" in (osm["road_type"], hints.get("road_type")) else "local",
        "context_source": osm["source"],
    }
    dup_ids = engine.count_duplicates(S.store.list(), lat, lng, analysis["category"])
    context["duplicate_count"] = len(dup_ids)
    context["duplicate_of"] = dup_ids[:10]

    sev = engine.compute_severity(analysis, context, text)
    city = engine.nearest_city(lat, lng)
    dept = engine.department_for(city, analysis["category"])

    letter = vision.finalize_letter(analysis.pop("letter", None), {
        "complaint_category": analysis["category"], "category_label": engine.CATEGORY_LABEL[analysis["category"]],
        "problem": analysis["problem"], "area": area, "city": city.title(), "department": dept,
        "severity_level": sev["level"], "severity_score": sev["score"], "severity_reasons": sev["reasons"],
        "citizen_note": text, "evidence": analysis["evidence"],
    })

    cid = S.store.next_id()
    img_name = f"{cid}-{uuid.uuid4().hex[:6]}.jpg"
    S.store.save_image(img_name, jpeg)
    doc = {
        "complaint_id": cid, "status": "submitted", "created_at": now_iso(), "city": city,
        "location": {"lat": lat, "lng": lng, "area": area},
        "image_url": f"/api/uploads/{img_name}",
        "analysis": {
            "is_valid": analysis["is_valid"], "category": analysis["category"], "problem": analysis["problem"],
            "confidence": analysis["confidence"], "evidence": analysis["evidence"],
            "damage_score": analysis["damage_score"], "extent": analysis.get("extent"), "safety_risk": analysis.get("safety_risk"), "source": source, "model": config.VISION_MODEL if source == "gemini" else None,
        },
        "context": context,
        "severity": sev,
        "department": {"name": dept, "contact": config.DEPT_EMAIL},
        "complaint_text": letter,
        "resolution": None,
        "dispatch": {"status": "queued", "channel": "webhook" if config.N8N_WEBHOOK_URL else "log", "to": config.DEPT_EMAIL, "at": now_iso()},
        "citizen_note": text, "language": language,
    }
    S.store.insert(doc)
    background.add_task(dispatch, cid, str(request.base_url).rstrip("/"))
    return public(doc)


def dispatch(cid, base_url):
    """Department ko complaint bhejo: webhook (n8n/Make/Zapier) agar set hai, warna sirf log. Fail hone par bhi complaint safe rehti hai."""
    c = S.store.get(cid)
    if not c:
        return
    d = c.get("dispatch", {})
    payload = {"event": "complaint.created", "complaint": public(c, admin=False), "image_absolute_url": base_url + c["image_url"],
               "to": c["department"]["contact"], "department": c["department"]["name"]}
    status, err = "logged", None
    if config.N8N_WEBHOOK_URL:
        try:
            r = httpx.post(config.N8N_WEBHOOK_URL, json=payload, timeout=10)
            status = "sent" if r.status_code < 300 else "failed"
            err = None if r.status_code < 300 else f"HTTP {r.status_code}"
        except Exception as e:  # noqa: BLE001
            status, err = "failed", type(e).__name__
    d.update({"status": status, "at": now_iso(), **({"error": err} if err else {})})
    c = S.store.get(cid) or c  # latest copy (concurrent edit se bachne ke liye)
    c["dispatch"] = d
    S.store.replace(c)
    S.store.add_dispatch({"complaint_id": cid, "status": status, "channel": d.get("channel"), "to": d.get("to"), "at": now_iso(), "error": err})
    log.info("dispatch %s -> %s (%s)", cid, c["department"]["name"], status)


# ---------------------------------------------------------------- department actions
class StatusBody(BaseModel):
    status: str


@app.patch("/api/complaints/{cid}/status")
def set_status(cid: str, body: StatusBody):
    """Department panel: sirf 'in_progress' (kaam shuru). Resolve sirf AI verification se hota hai."""
    c = get_or_404(cid)
    if body.status != "in_progress":
        raise HTTPException(400, "Sirf 'in_progress' set ho sakta hai. Resolve ke liye after-photo upload karo.")
    if c["status"] == "submitted":
        c["status"] = "in_progress"
        c["started_at"] = now_iso()
        S.store.replace(c)
    return public(c)


@app.post("/api/complaints/{cid}/resolve")
async def resolve(cid: str, request: Request, image: UploadFile = File(...), lat: Optional[float] = Form(None), lng: Optional[float] = Form(None)):
    rate_limit(request, "resolve", 15)
    c = get_or_404(cid)
    if c["status"] == "resolved":
        raise HTTPException(409, "Ye complaint pehle se resolved hai.")
    jpeg, _size, exif = await read_upload(image)
    before = None
    if c.get("image_url"):
        before = S.store.get_image(c["image_url"].rsplit("/", 1)[-1])

    pt = (lat, lng) if lat is not None and lng is not None else exif
    dist = None
    if pt:
        dist = int(engine.haversine_m(pt[0], pt[1], c["location"]["lat"], c["location"]["lng"]))

    v = vision.verify_resolution(c["analysis"]["problem"], c["analysis"]["category"], jpeg, before)
    ok = v["verdict"] == "resolved" and v["confidence"] >= 0.6
    reason = v["reason"]
    if ok and dist is not None and dist > 300:
        ok, v["verdict"] = False, "not_resolved"
        reason = f"After-photo taken {dist} m away from the reported spot"

    name = f"{c['complaint_id']}-after-{uuid.uuid4().hex[:6]}.jpg"
    S.store.save_image(name, jpeg)
    after_url = f"/api/uploads/{name}"
    res = {"verdict": "resolved" if ok else ("not_resolved" if v["verdict"] != "resolved" else "not_resolved"),
           "confidence": v["confidence"], "reason": reason, "gps_distance_m": dist, "after_image_url": after_url,
           "resolved_at": now_iso()}
    if ok:
        c["status"] = "resolved"
        c["resolution"] = res
        c.pop("last_verification", None)
    else:
        if c["status"] == "submitted":
            c["status"] = "in_progress"
        c["last_verification"] = {**res, "attempted_at": res.pop("resolved_at")}
    S.store.replace(c)
    out = public(c)
    if not ok:
        out["resolution"] = res  # response-only (DB me resolution tabhi jaata hai jab sach me resolve ho)
    return out


# ---------------------------------------------------------------- admin
def make_token(user):
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": user, "role": "admin", "iat": now, "exp": now + timedelta(hours=config.ADMIN_TTL_HOURS)}, config.JWT_SECRET, algorithm="HS256")


def require_admin(authorization: str = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Admin login required")
    try:
        data = jwt.decode(authorization[7:], config.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as e:
        raise HTTPException(401, "Session expired - please sign in again") from e
    if data.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    return data["sub"]


_fails = defaultdict(list)


class LoginBody(BaseModel):
    username: str
    password: str


@app.post("/api/admin/login")
def admin_login(body: LoginBody, request: Request):
    ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "?")).split(",")[0].strip()
    now = time.time()
    _fails[ip] = [t for t in _fails[ip] if now - t < 60]
    if len(_fails[ip]) >= 5:
        raise HTTPException(429, "Too many attempts. Wait a minute.")
    ok_u = hmac.compare_digest(body.username.strip().encode(), config.ADMIN_USER.encode())
    ok_p = hmac.compare_digest(body.password.encode(), config.ADMIN_PASS.encode())
    if not (ok_u and ok_p):
        _fails[ip].append(now)
        raise HTTPException(401, "Wrong username or password")
    _fails.pop(ip, None)
    S.store.add_audit({"at": now_iso(), "actor": body.username.strip(), "action": "Admin login", "id": None})
    return {"token": make_token(body.username.strip()), "user": body.username.strip(), "expires_in_h": config.ADMIN_TTL_HOURS}


@app.get("/api/admin/complaints")
def admin_list(_: str = Depends(require_admin)):
    return [public(c, admin=True) for c in S.store.list()]


@app.get("/api/admin/audit")
def admin_audit(_: str = Depends(require_admin)):
    return S.store.list_audit()


@app.patch("/api/admin/complaints/{cid}")
def admin_patch(cid: str, patch: dict, admin: str = Depends(require_admin)):
    c = get_or_404(cid)
    label = []
    custom = str(patch.pop("_label", "") or "")[:120]  # frontend ka readable audit text
    if "status" in patch:
        st = patch["status"]
        if st not in STATUSES:
            raise HTTPException(400, "Invalid status")
        if st != "resolved" and c["status"] == "resolved" and not patch.get("keepResolution"):
            c["resolution"] = None
        if st == "resolved" and not c.get("resolution"):
            c["resolution"] = {"verdict": "resolved", "confidence": 1.0, "reason": f"Marked resolved manually by {admin}", "gps_distance_m": None,
                               "after_image_url": None, "resolved_at": now_iso(), "manual": True}
        c["status"] = st
        label.append(f"status -> {st}")
    if "severity" in patch and isinstance(patch["severity"], dict):
        sv = dict(c["severity"])
        if "score" in patch["severity"]:
            try:
                sv["score"] = max(0, min(10, int(patch["severity"]["score"])))
            except (TypeError, ValueError) as e:
                raise HTTPException(400, "Invalid score") from e
            sv["level"] = engine.level_from_score(sv["score"])
        if isinstance(patch["severity"].get("reasons"), list):
            sv["reasons"] = [str(x)[:160] for x in patch["severity"]["reasons"]][:12]
        c["severity"] = sv
        label.append(f"severity -> {sv['score']}")
    if "department" in patch and isinstance(patch["department"], dict):
        d = dict(c["department"])
        for k in ("name", "contact"):
            if k in patch["department"]:
                d[k] = str(patch["department"][k])[:120]
        c["department"] = d
        label.append(f"department -> {d['name']}")
    if "admin_notes" in patch:
        raw = patch["admin_notes"]
        if isinstance(raw, str):  # purane/simple clients
            raw = [{"at": now_iso(), "by": admin, "text": raw}]
        if not isinstance(raw, list):
            raise HTTPException(400, "admin_notes must be a list")
        c["admin_notes"] = [{"at": str(n.get("at") or now_iso())[:40], "by": str(n.get("by") or admin)[:60], "text": str(n.get("text", ""))[:1000]}
                            for n in raw if isinstance(n, dict) and str(n.get("text", "")).strip()][-100:]
        label.append("note added")
    if "flagged" in patch:
        c["flagged"] = bool(patch["flagged"])
        label.append("flagged" if c["flagged"] else "unflagged")
    S.store.replace(c)
    S.store.add_audit({"at": now_iso(), "actor": admin, "action": custom or ("Updated: " + (", ".join(label) or "no change")), "id": c["complaint_id"]})
    return public(c, admin=True)


@app.delete("/api/admin/complaints/{cid}")
def admin_delete(cid: str, admin: str = Depends(require_admin)):
    if not S.store.delete(cid):
        raise HTTPException(404, "Complaint not found")
    S.store.add_audit({"at": now_iso(), "actor": admin, "action": "Deleted complaint", "id": cid})
    return {"ok": True}


# ---------------------------------------------------------------- frontend (production build ek hi server se)
@app.exception_handler(HTTPException)
async def http_exc(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=getattr(exc, "headers", None))


DIST = config.FRONTEND_DIST


@app.get("/{path:path}", include_in_schema=False)
def spa(path: str):
    if path.startswith("api/"):
        raise HTTPException(404, "Not found")
    if not DIST.exists():
        return JSONResponse({"service": "Chaukas AI API", "docs": "/docs", "health": "/api/health",
                             "note": "Frontend build nahi mila. `npm run build` chalao ya `npm run dev` use karo."})
    f = (DIST / path).resolve()
    if path and DIST.resolve() in f.parents and f.is_file():
        return FileResponse(f)
    return FileResponse(DIST / "index.html")
