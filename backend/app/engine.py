"""Context + severity engine, router (department), duplicate detection.

Severity rules (frontend ke Admin > System tab se match):
  AI damage score (1-10, photo se) | +2 school/hospital <=200 m | +1 for 2-3 reports, +2 for 4+ | +1 main road | +1 safety words
  open manhole / live wire -> hamesha CRITICAL (10).   Low 0-3, Medium 4-6, High 7-8, Critical 9-10
"""
import logging
import math
import re
import time

import httpx

from . import config

log = logging.getLogger("chaukas.engine")

CITIES = {
    "roorkee": (29.8543, 77.8880),
    "muzaffarnagar": (29.4727, 77.7085),
}

DEPT = {
    "roorkee": {
        "road_damage": "Public Works Department (PWD)", "garbage": "Municipal Corporation - Sanitation",
        "streetlight": "Municipal Corporation / UPCL", "water_leakage": "Uttarakhand Jal Sansthan",
        "drainage": "Municipal Corporation - Drainage", "other": "Municipal Corporation - General",
    },
    "muzaffarnagar": {
        "road_damage": "Public Works Department (PWD)", "garbage": "Nagar Palika - Sanitation",
        "streetlight": "Nagar Palika / Electricity Distribution", "water_leakage": "Jal Sansthan / Jal Nigam",
        "drainage": "Nagar Palika - Drainage", "other": "Nagar Palika - General",
    },
}

CATEGORY_LABEL = {
    "road_damage": "Road damage", "garbage": "Garbage", "streetlight": "Streetlight", "water_leakage": "Water leakage",
    "drainage": "Drainage", "other": "Other",
}

SAFETY_RE = re.compile(
    r"accident|injur|\bfell\b|\bfall(s|en|ing)?\b|child|\bkids?\b|danger|hazard|death|died|electrocut|shock|bleed|"
    r"gir |gira|gire|girna|bachh|bacch|chot|durghatna|khatra|jaan|"
    r"दुर्घटना|चोट|गिर|बच्च|खतरा|जान|करंट|हादसा", re.I)
HAZARD_TEXT_RE = re.compile(r"open\s*manhole|manhole\s*(open|cover\s*missing)|live\s*wire|naked\s*wire|current\s*wire|खुला\s*मैनहोल|नंगा\s*तार|करंट", re.I)


def haversine_m(lat1, lng1, lat2, lng2):
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def nearest_city(lat, lng):
    return min(CITIES, key=lambda k: haversine_m(lat, lng, *CITIES[k]))


def department_for(city, category):
    return DEPT[city].get(category) or DEPT[city]["other"]


# ---------------------------------------------------------------- OSM context (school / hospital / road)
_cache: dict = {}
_down_until = 0.0
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
MAIN_ROADS = {"motorway", "trunk", "primary", "secondary", "tertiary", "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"}


def osm_context(lat, lng, timeout=3.5):
    global _down_until
    """Return {school_within_m, hospital_within_m, road_type, source}. Network fail -> unknown (None/'local')."""
    key = (round(lat, 3), round(lng, 3))
    if time.time() < _down_until:  # Overpass abhi down tha -> turant skip (demo slow na ho)
        return {"school_within_m": None, "hospital_within_m": None, "road_type": "local", "source": "unavailable"}
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < 6 * 3600:
        return hit[1]
    q = (f'[out:json][timeout:8];('
         f'nwr(around:200,{lat},{lng})[amenity~"^(school|college|kindergarten|hospital|clinic)$"];'
         f'way(around:25,{lat},{lng})[highway];);out center tags;')
    result = {"school_within_m": None, "hospital_within_m": None, "road_type": "local", "source": "unavailable"}
    for url in OVERPASS:
        try:
            r = httpx.post(url, data={"data": q}, timeout=timeout, headers={"User-Agent": "ChaukasAI/1.0 (hackathon)"})
            if r.status_code != 200:
                continue
            school = hosp = None
            road = "local"
            for el in r.json().get("elements", []):
                tags = el.get("tags", {})
                if "highway" in tags:
                    if tags["highway"] in MAIN_ROADS:
                        road = "main"
                    continue
                c = el.get("center") or {"lat": el.get("lat"), "lon": el.get("lon")}
                if c.get("lat") is None:
                    continue
                d = int(haversine_m(lat, lng, c["lat"], c["lon"]))
                if tags.get("amenity") in ("hospital", "clinic"):
                    hosp = d if hosp is None else min(hosp, d)
                else:
                    school = d if school is None else min(school, d)
            result = {"school_within_m": school if school is None or school <= 200 else None,
                      "hospital_within_m": hosp if hosp is None or hosp <= 200 else None, "road_type": road, "source": "osm"}
            break
        except Exception as e:  # noqa: BLE001
            log.info("overpass %s failed: %s", url, type(e).__name__)
    if result["source"] == "osm":
        _cache[key] = (time.time(), result)
    else:
        _down_until = time.time() + 120
    return result


def text_context(text):
    """OSM na mile to citizen ke note se hint: 'school ke paas', 'hospital', 'main road'."""
    t = (text or "").lower()
    out = {}
    if re.search(r"school|vidyalaya|college|विद्यालय|स्कूल", t):
        out["school_within_m"] = 150
    if re.search(r"hospital|aspatal|clinic|अस्पताल", t):
        out["hospital_within_m"] = 150
    if re.search(r"main road|highway|chowk|chauraha|market|मुख्य|चौराहा|हाईवे|बाज़ार|बाजार", t):
        out["road_type"] = "main"
    return out


# ---------------------------------------------------------------- duplicates
def count_duplicates(existing, lat, lng, category, radius_m=50):
    """Same category, 50 m ke andar, abhi tak unresolved complaints."""
    ids = []
    for c in existing:
        if c.get("status") == "resolved" or c.get("analysis", {}).get("category") != category:
            continue
        loc = c.get("location") or {}
        if loc.get("lat") is None:
            continue
        if haversine_m(lat, lng, loc["lat"], loc["lng"]) <= radius_m:
            ids.append(c["complaint_id"])
    return ids


# ---------------------------------------------------------------- severity
def level_from_score(s):
    return "CRITICAL" if s >= 9 else "HIGH" if s >= 7 else "MEDIUM" if s >= 4 else "LOW"


def compute_severity(analysis, context, citizen_text):
    base = max(0, min(int(analysis.get("damage_score", 5)), 10))
    reasons = [f"AI damage score {base}"]
    score = base
    if context.get("school_within_m") is not None:
        score += 2
        reasons.append("School within 200 m (+2)")
    elif context.get("hospital_within_m") is not None:
        score += 2
        reasons.append("Hospital within 200 m (+2)")
    dups = int(context.get("duplicate_count", 0))
    if dups >= 3:
        score += 2
        reasons.append(f"Reported by {dups + 1} citizens (+2)")
    elif dups >= 1:
        score += 1
        reasons.append(f"Reported by {dups + 1} citizens (+1)")
    if context.get("road_type") == "main":
        score += 1
        reasons.append("Main road (+1)")
    if SAFETY_RE.search(citizen_text or ""):
        score += 1
        reasons.append("Safety words in citizen note (+1)")
    hazard = analysis.get("hazard", "none") != "none" or bool(HAZARD_TEXT_RE.search(citizen_text or ""))
    if hazard:
        score = 10
        reasons.append("Open manhole / live wire - always Critical")
    score = max(0, min(10, score))
    return {"score": score, "level": level_from_score(score), "reasons": reasons}
