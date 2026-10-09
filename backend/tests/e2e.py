"""End-to-end test (server chal raha ho: uvicorn app.main:app --port 8000).  python tests/e2e.py [base_url] [images_dir]"""
import json, sys, time
from pathlib import Path
import httpx

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
IMG = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent / "samples"
c = httpx.Client(base_url=BASE, timeout=120)
fails = []
def check(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name, extra)
    if not cond: fails.append(name)

h = c.get("/api/health").json(); check("health", h["ok"], f"db={h['db']['type']} ai={h['ai']['configured']}")
n0 = len(c.get("/api/complaints").json())
LAT, LNG = 29.8601, 77.8895

t = time.time()
r = c.post("/api/complaints", files={"image": ("p.jpg", (IMG/"road_before.jpg").read_bytes(), "image/jpeg")},
           data={"lat": LAT, "lng": LNG, "text": "Bahut bada gadda hai school ke paas, kal ek bachha gir gaya", "language": "hi", "area": "Railway Road, Roorkee"})
check("create 200", r.status_code == 200, f"{time.time()-t:.1f}s")
d = r.json(); print(json.dumps({k: d[k] for k in ("complaint_id","analysis","context","severity","department","dispatch")}, ensure_ascii=False, indent=1))
check("category road_damage", d["analysis"]["category"] == "road_damage")
check("AI source gemini", d["analysis"]["source"] == "gemini")
check("severity has reasons", len(d["severity"]["reasons"]) >= 2)
check("letter en+hi", d["complaint_text"]["en"] and d["complaint_text"]["hi"])
check("image served", c.get(d["image_url"]).status_code == 200)
check("private fields hidden", "citizen_note" not in d)
cid = d["complaint_id"]

r2 = c.post("/api/complaints", files={"image": ("p.jpg", (IMG/"road_before.jpg").read_bytes(), "image/jpeg")}, data={"lat": LAT+0.0001, "lng": LNG, "text": "pothole", "area": "Railway Road"})
d2 = r2.json(); check("duplicate detected", d2["context"]["duplicate_count"] >= 1, str(d2["context"]["duplicate_count"]))
check("n+2 complaints", len(c.get("/api/complaints").json()) == n0 + 2)
check("track by lowercase id", c.get(f"/api/complaints/{cid.lower()}").status_code == 200)
check("404 unknown", c.get("/api/complaints/CS-99999").status_code == 404)

r = c.post("/api/complaints", files={"image": ("x.txt", b"not an image", "text/plain")}, data={"lat": 1, "lng": 1}); check("bad file 415", r.status_code == 415, r.text[:80])
r = c.post("/api/complaints", files={"image": ("x.jpg", b"", "image/jpeg")}, data={"lat": LAT, "lng": LNG}); check("empty file 400", r.status_code == 400)

check("set in_progress", c.patch(f"/api/complaints/{cid}/status", json={"status": "in_progress"}).json()["status"] == "in_progress")
check("public cannot resolve via status", c.patch(f"/api/complaints/{cid}/status", json={"status": "resolved"}).status_code == 400)

# wrong after-photo -> must NOT resolve
t = time.time()
r = c.post(f"/api/complaints/{cid}/resolve", files={"image": ("a.jpg", (IMG/"garbage-overflow.jpg").read_bytes(), "image/jpeg")})
dd = r.json(); print("wrong-photo:", dd["status"], dd.get("resolution"), f"{time.time()-t:.1f}s")
check("unrelated after-photo rejected", dd["status"] != "resolved")
# correct
r = c.post(f"/api/complaints/{cid}/resolve", files={"image": ("a.jpg", (IMG/"road_after.jpg").read_bytes(), "image/jpeg")})
dd = r.json(); print("right-photo:", dd["status"], dd.get("resolution"))
check("real after-photo resolves", dd["status"] == "resolved" and dd["resolution"]["verdict"] == "resolved")
check("persisted", c.get(f"/api/complaints/{cid}").json()["status"] == "resolved")
check("resolve again 409", c.post(f"/api/complaints/{cid}/resolve", files={"image": ("a.jpg", (IMG/"road_after.jpg").read_bytes(), "image/jpeg")}).status_code == 409)

# admin
check("admin list needs auth", c.get("/api/admin/complaints").status_code == 401)
check("wrong password", c.post("/api/admin/login", json={"username": "admin", "password": "nope"}).status_code == 401)
tok = c.post("/api/admin/login", json={"username": "admin", "password": "Chaukas@2026"}).json().get("token")
check("login token", bool(tok)); H = {"Authorization": f"Bearer {tok}"}
check("admin list", len(c.get("/api/admin/complaints", headers=H).json()) == n0 + 2)
p = c.patch(f"/api/admin/complaints/{d2['complaint_id']}", headers=H, json={"severity": {"score": 3}, "admin_notes": [{"at": "2026-10-09T00:00:00Z", "by": "admin", "text": "test note"}], "flagged": True, "status": "rejected"}).json()
check("admin patch", p["severity"]["level"] == "LOW" and p["admin_notes"][0]["text"] == "test note" and p["status"] == "rejected")
check("notes hidden from public", "admin_notes" not in c.get(f"/api/complaints/{d2['complaint_id']}").json())
check("audit", len(c.get("/api/admin/audit", headers=H).json()) >= 2)
check("admin delete", c.delete(f"/api/admin/complaints/{d2['complaint_id']}", headers=H).status_code == 200)
check("deleted gone", c.get(f"/api/complaints/{d2['complaint_id']}").status_code == 404)
check("bad token", c.get("/api/admin/audit", headers={"Authorization": "Bearer abc"}).status_code == 401)
print("\nFAILED:" if fails else "\nALL PASSED", fails)
sys.exit(1 if fails else 0)
