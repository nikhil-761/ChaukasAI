# Chaukas AI - Presenter Guide (Team Shivay, 6 members)

Pitch ka naya angle: **hum department ko customer maante hain, sidhe government ko nahi.** Har slide pe yahi bolna hai: "department ka inbox saaf, aur department ka kaam provable."

## 1. Kaun kya present karega

| Slide | Topic | Presenter | Time |
|---|---|---|---|
| 1 | Title | Nikhil | 20 s |
| 2 | Problem (department ki nazar se) | Nikhil | 40 s |
| 3 | Hum kiske liye bana rahe hain (PWD, Jal Sansthan, Nagar Nigam, Bijli) | Nikhil | 40 s |
| 4 | 5-step solution | Nikhil | 45 s |
| 5 | Citizen app (3 steps) + demo video start | Madhav | 45 s |
| 6 | AI result (asli Gemini run) | Madhav | 50 s |
| 7 | Severity engine | Abhishek | 50 s |
| 8 | Department panel | Madhav | 40 s |
| 9 | Fake fix reject + verified closure | Abhishek | 50 s |
| 10 | Dashboard + admin | Avni | 40 s |
| 11 | Asli AI results table | Abhishek | 40 s |
| 12 | Architecture + database | Smriti | 40 s |
| 13 | Pilot plan / business | Nikhil | 50 s |
| 14 | Limits + next 90 days | 6th member | 30 s |
| 15 | Team intro (sab khade hon) | Nikhil | 20 s |
| 16 | Closing + ask | Nikhil | 20 s |

Total lagbhag 10 minute. Agar time kam mile (5-7 min), slides 10, 11, 14 skip karo.

## 2. Har member ki asli ZIMMEDARI

- **Nikhil (leader)**: story, problem, business, closing. Q&A me business/backend sawal.
- **Madhav**: demo chalata hai (video ya live), Q&A ka **lead** - judge ka sawal pehle Madhav sunega aur sahi banda ko pass karega.
- **Abhishek**: AI sawal - model kaun sa, score kaise banta hai, fake photo kaise pakda jata hai.
- **Smriti**: database / architecture sawal (MongoDB, fallback, security).
- **Avni**: dashboard, map, OpenStreetMap sawal.
- **6th member**: laptop + demo video ready rakhe, timer dekhe (slide 14 bole). Naam aur role slide 15 me bharna na bhulna (placeholder `[Member 6 name]` hai).

Rule: jo slide present kar raha hai wahi us slide ke sawal ka pehla jawab dega; baaki sirf tab bolein jab Madhav pass kare.

## 3. Gemini laptop pe nahi chalega - to kya karein

Gemini hosted model hai (API se chalta hai), laptop pe sirf web app + halka Python server chalta hai. Fir bhi live demo risky ho to:

1. **Default: `chaukas_demo.mp4` (45 sec) chalao** - ye asli AI run ki recording hai.
2. Judge bole "live karke dikhao": sirf slide 8 wala **Department panel** live dikhao (AI ke bina bhi chalta hai), ya `/dashboard`.
3. Live complaint tabhi karo jab internet + backend pehle se test kiya ho. ~12 second lagte hain; tab tak Abhishek slide 7 ki baat kare.
4. Backend band ho to frontend `.env` me `VITE_USE_MOCK=true` karke sirf UI dikha sakte ho - par bolo ki ye sample mode hai.

## 4. Judges ke sambhavit sawal aur jawab

- **"Ye government ke liye hai ya citizen ke liye?"** (Madhav) - Citizen sensor hai, department customer hai. Department ko saaf queue + proof milta hai.
- **"Koi department ne sign kiya hai?"** (Nikhil) - Nahi. Hum 90 din ka free pilot propose kar rahe hain; slide 13.
- **"AI score hard-coded to nahi?"** (Abhishek) - Nahi; slide 11 me 4 alag photos ke 4 alag score. Photo se base score, upar se rules (school, repeat, main road).
- **"Galat after-photo laga di to?"** (Abhishek) - AI + GPS dono check karte hain; slide 9 me wrong photo reject hui. Limit: koi dusri jagah ki sahi photo laga de to risk hai, isliye roadmap me citizen confirmation.
- **"Accuracy kitni hai?"** (Abhishek) - Hum percentage claim nahi karte; sirf 4 sample photos. Pilot me officers ke faisle se compare karenge.
- **"Data/privacy?"** (Smriti) - Photos + complaints MongoDB me; admin JWT login; password env variable. Pilot se pehle DB access rules aur retention policy banayenge.
- **"Internet na ho to?"** (Avni) - Abhi AI ke liye internet chahiye; OSM fail ho to citizen note ke words se fallback.
- **"Scale / cost?"** (Nikhil) - Backend stateless hai; kharcha hosting + per-complaint AI call.
- **"Dashboard ka purana data asli hai?"** (Avni) - Seeded sample data hai, footer me likha hai; naye complaints live hain.

## 5. Pitch se pehle checklist (30 min pehle)

1. Backend chalu: `http://localhost:8000/api/health` me `"ok": true` aur `ai.configured: true`.
2. Browser me `http://localhost:8000` (ya 5173) khula, **Light** mode, English; Guided Tutor band.
3. `chaukas_demo.mp4` laptop pe local khula hua (internet pe depend mat karo).
4. `ChaukasAI_Pitch.pptx` PowerPoint me, Presenter View (notes dikhte hain - har slide ke notes me bolne ki line hai).
5. Admin password badal do (default `Chaukas@2026` mat chhodo).
6. Backup: PPT ka PDF + video pen drive me.

## 6. Bolne ke 3 niyam

1. "Government" ki jagah **"department"** bolo (PWD, Jal Sansthan, Nagar Nigam).
2. Jo cheez adhoori hai (pilot sign nahi, accuracy study nahi) wo khud bolo - judge ko bharosa badhta hai.
3. Slide padhna nahi; ek line bolo, phir screenshot/demo dikhao.
