# Chaukas AI — Shikayat se Samaadhan tak

Photo + GPS + (Hindi/English) note → **Gemini Vision agent** → context-aware severity → right department + formal letter (EN/HI) → dashboard → after-photo se **AI resolution verification**.

```
ChaukasAI/
├─ frontend/      React + Vite + Tailwind (PWA, Hindi/English, Guided Tutor, Admin panel)
├─ backend/       FastAPI + MongoDB (ya local file DB) + Vision agent
├─ Vision-Agent/  Original standalone Vision agent (test ke liye, ab backend/app/vision.py me merge hai)
├─ CONTRACT.md    Frontend <-> Backend API
├─ start-windows.bat / start-mac-linux.sh   ek-click start
```

## 1) Pehli baar chalana (Windows)
1. Python 3.10+ (Add to PATH) aur Node.js LTS install ho.
2. `backend\.env.example` ko copy karke `backend\.env` banao (start script khud bana deta hai) aur `KODEKEY_API_KEY=` me apni key daalo.
3. **`start-windows.bat` pe double-click.** 3-5 minute baad browser khulega: http://localhost:5173

Manual tareeka:
```bash
cd backend
python -m venv venv && venv\Scripts\activate        # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
# naya terminal
cd frontend && npm install && npm run dev
```
Check: http://localhost:8000/api/health → `"ok": true`, `"ai": {"configured": true}`.

## 2) Database
* **MONGODB_URI khali** → `backend/data/db.json` (local file) — kuch install nahi karna, demo ke liye perfect.
* **MongoDB Atlas (free)**: atlas.mongodb.com → M0 free cluster → Database Access me user banao → Network Access me `0.0.0.0/0` allow karo → *Connect → Drivers* se URI copy karke `backend/.env` me `MONGODB_URI=mongodb+srv://USER:PASS@cluster.../` daalo. Password me special character ho (`@`, `#`...) to URL-encode karo. Restart ke baad `/api/health` me `"db": {"type": "mongodb"}` dikhna chahiye. Connect na hua to app crash nahi hota, local file DB par chalta rehta hai (health me `db_note` me wajah).
* Photos bhi usi DB me store hoti hain (Mongo me `images` collection) — alag Cloudinary ki zaroorat nahi.
* Pehli baar khali DB me 40 demo complaints seed hoti hain (`SEED_DEMO=false` se band).

## 3) Admin panel
`http://localhost:5173/admin` — default `admin` / `Chaukas@2026`.
**Launch/demo se pehle `backend/.env` me `ADMIN_USER`, `ADMIN_PASS` aur `JWT_SECRET` badlo.** Login server par verify hota hai (JWT, 8 ghante, 5 galat try ke baad 1 minute lock).

## 4) Demo flow (judges ke liye)
1. `/report` → `backend/tests/samples/road_before.jpg` upload → location → "school ke paas bada gadda" → Submit. ~10-15 sec me AI result + Hindi/English letter.
2. `/dashboard` → naya pin/severity. `/track/CS-xxxx` → timeline.
3. `/department` → PWD → "Start work" → **`road_after.jpg`** upload → AI verify → *resolved* + before/after slider.
4. Galat photo (jaise `garbage-overflow.jpg`) upload karke dikhao ki AI **fake fix reject** karta hai.
5. `/admin` → sab kuch control + audit log.

## 5) Testing
```bash
cd backend
python tests/e2e.py                 # server chalu rakhke: poora API flow (real AI calls)
python tests/test_mongo_store.py    # MongoDB logic (mongomock; pip install mongomock)
```

## 6) Deploy (ek hi service)
Render / Railway / koi bhi VPS:
```
Build : cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
Start : cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
Env   : KODEKEY_API_KEY, MONGODB_URI (zaroori - free hosting ki disk permanent nahi hoti), ADMIN_USER, ADMIN_PASS, JWT_SECRET
```
Backend `frontend/dist` khud serve karta hai. Frontend alag host (Vercel) par ho to frontend env me `VITE_API_BASE=https://your-api...` aur backend me `CORS_ORIGINS=https://your-frontend...`.

## 7) Optional: n8n / Zapier dispatch
`N8N_WEBHOOK_URL` set karo → har nayi complaint ka JSON (complaint + department + image URL) us webhook par POST hota hai; status complaint ke `dispatch` me dikhta hai. Na set ho to dispatch log hota hai (`dispatch.status = "logged"`).

## 8) Troubleshooting
| Dikkat | Fix |
|---|---|
| Red banner "Server is not reachable" | Backend chalu nahi — `backend` terminal check karo |
| `ai.configured: false` | `backend/.env` me `KODEKEY_API_KEY` daalo, backend restart |
| Complaint ban gayi par `analysis.source = "fallback"` | AI call fail hui (key/internet/quota). Complaint safe hai; `backend` log me wajah |
| Severity me school/main-road nahi aa raha | OpenStreetMap (Overpass) ka internet chahiye; na ho to citizen note ke words (school, hospital, main road) se hint leta hai |
| Purana demo data dikh raha | Browser me `Ctrl+Shift+R`; frontend `.env` me `VITE_USE_MOCK=false` hona chahiye |
| Pure frontend demo (backend ke bina) | `frontend/.env` me `VITE_USE_MOCK=true` |
