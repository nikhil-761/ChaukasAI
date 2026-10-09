# Chaukas AI - Frontend

React + Vite + Tailwind, mobile-first (phone par app jaisa, laptop par full website). PWA manifest included.

## Run
```
cd frontend
npm install
npm run dev
```
Open the URL shown (also reachable from phone on same Wi-Fi via the Network URL).

## Mock vs real backend
Default `VITE_USE_MOCK=true` - sab kuch browser mein simulate hota hai (complaints localStorage mein save).
Backend ready hone par `.env` mein `VITE_USE_MOCK=false` karo; `/api/*` calls Vite proxy se `http://localhost:8000` (FastAPI) par jayengi.
All API calls ek hi file mein: `src/lib/api.js` (CONTRACT.md ke hisaab se).

## Structure
- `src/pages`: Landing, Report, Track, Dashboard, Department
- `src/components`: Navbar, MapView (Avni ka module), ExplainCard, BeforeAfter, Timeline, Badges, StatCard
- `src/lib`: api.js, constants.js, mockData.js

## Routes
`/` landing · `/report` · `/track/:id` · `/dashboard` · `/department`
