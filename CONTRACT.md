# Chaukas AI - API Contract (frontend <-> backend)

Base URL: same host (`/api/...`). Frontend dev server `/api` ko `localhost:8000` par proxy karta hai.
Interactive docs: `http://localhost:8000/docs`

## Complaint object
```json
{
  "complaint_id": "CS-1041",
  "status": "submitted | in_progress | resolved | rejected",
  "created_at": "2026-10-09T08:22:38Z",
  "city": "roorkee | muzaffarnagar",
  "location": { "lat": 29.86, "lng": 77.88, "area": "Railway Road, Roorkee" },
  "image_url": "/api/uploads/CS-1041-ab12cd.jpg",
  "analysis": { "is_valid": true, "category": "road_damage|garbage|streetlight|water_leakage|drainage|other",
                "problem": "...", "confidence": 0.98, "evidence": ["..", "..", ".."], "damage_score": 6,
                "source": "gemini | fallback", "model": "google/gemini-3.5-flash" },
  "context": { "school_within_m": 150, "hospital_within_m": null, "road_type": "main|local",
               "duplicate_count": 0, "duplicate_of": [], "context_source": "osm | unavailable" },
  "severity": { "score": 9, "level": "LOW|MEDIUM|HIGH|CRITICAL", "reasons": ["AI damage score 6", "School within 200 m (+2)"] },
  "department": { "name": "Public Works Department (PWD)", "contact": "demo@chaukas.test" },
  "complaint_text": { "subject": "...", "en": "...", "hi": "..." },
  "resolution": null,
  "dispatch": { "status": "queued|logged|sent|failed", "channel": "log|webhook", "to": "...", "at": "..." }
}
```
`resolution` (resolve hone par): `{ verdict:"resolved", confidence, reason, gps_distance_m|null, after_image_url, resolved_at }`

## Public endpoints
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/health` | - | DB type, AI configured, complaint count |
| GET | `/api/complaints` | - | list (admin-only fields hidden) |
| GET | `/api/complaints/{id}` | - | case-insensitive ID, 404 if missing |
| POST | `/api/complaints` | multipart: `image`, `lat`, `lng`, `text`, `language`, `area` | AI pipeline, ~10-15 s. 422 `{detail:{code:"not_civic",en,hi}}` agar photo me civic problem nahi |
| PATCH | `/api/complaints/{id}/status` | `{status:"in_progress"}` | department "Start work" |
| POST | `/api/complaints/{id}/resolve` | multipart: `image` (+ optional `lat`,`lng`) | AI before/after verify. Fix sahi na lage to status resolved NAHI hota |
| GET | `/api/stats` | - | totals |
| GET | `/api/uploads/{name}` | - | stored photos |

## Admin endpoints (`Authorization: Bearer <token>`)
| Method | Path | Body |
|---|---|---|
| POST | `/api/admin/login` | `{username, password}` -> `{token}` (8 ghante) |
| GET | `/api/admin/complaints` | full list incl. `admin_notes`, `flagged` |
| PATCH | `/api/admin/complaints/{id}` | any of `status`, `severity:{score}`, `department:{name}`, `admin_notes:[{at,by,text}]`, `flagged`, `keepResolution`, `_label` |
| DELETE | `/api/admin/complaints/{id}` | - |
| GET | `/api/admin/audit` | audit log |

## Severity rules
AI damage score (1-10, photo ki gambhirta ke hisaab se) `+2` school/hospital <=200 m, `+1` (2-3 reports) / `+2` (4+ reports) within 50 m same category,
`+1` main road, `+1` safety words in citizen note. Open manhole / live wire = always 10 (Critical).
Low 0-3 · Medium 4-6 · High 7-8 · Critical 9-10.

## Errors
`{ "detail": "message" }` (string) ya, not_civic ke liye object `{code, en, hi}`. 429 = rate limit, 413 = photo > 12 MB, 415 = image nahi padh paya.
