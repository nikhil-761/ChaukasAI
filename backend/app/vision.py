"""AI agents (KodeKey -> Gemini 3.5 Flash, OpenAI-compatible API).

1. analyze_issue()     - photo dekhkar problem, category, damage score, evidence
2. finalize_letter()   - English + Hindi formal complaint letter (analysis call se aata hai)
3. verify_resolution() - before/after photo compare

Har function ke paas fallback hai: AI down/slow ho to bhi complaint save hoti hai (analysis.source = 'fallback').
"""
import base64
import io
import json
import logging
import re

from PIL import Image, ImageOps

from . import config

log = logging.getLogger("chaukas.ai")

try:  # iPhone HEIC support (optional)
    import pillow_heif  # type: ignore
    pillow_heif.register_heif_opener()
except Exception:  # noqa: BLE001
    pass

CATEGORIES = ["road_damage", "garbage", "streetlight", "water_leakage", "drainage", "other"]
_client = None


def client():
    global _client
    if _client is None and config.KODEKEY_API_KEY:
        from openai import OpenAI
        _client = OpenAI(api_key=config.KODEKEY_API_KEY, base_url=config.KODEKEY_BASE_URL, timeout=50, max_retries=1)
    return _client


def ai_ready():
    return bool(config.KODEKEY_API_KEY)


# ---------------------------------------------------------------- images
def prepare_image(raw: bytes, max_side=1600):
    """Upload ko validate + orient + compress karo. Return (jpeg_bytes, (w,h), exif_gps or None)."""
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception as e:  # noqa: BLE001
        raise ValueError("Ye image file nahi padh paye. JPG ya PNG photo upload karo.") from e
    gps = exif_gps(img)
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB",):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
            bg.paste(img, mask=img.split()[-1])
            img = bg
        else:
            img = img.convert("RGB")
    img.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85, optimize=True)
    return buf.getvalue(), img.size, gps


def exif_gps(img):
    try:
        ifd = img.getexif().get_ifd(0x8825)
        if not ifd or 2 not in ifd or 4 not in ifd:
            return None

        def conv(v, ref):
            d, m, s = (float(x) for x in v)
            r = d + m / 60 + s / 3600
            return -r if ref in ("S", "W") else r

        return conv(ifd[2], ifd.get(1, "N")), conv(ifd[4], ifd.get(3, "E"))
    except Exception:  # noqa: BLE001
        return None


def _data_url(jpeg: bytes):
    return "data:image/jpeg;base64," + base64.b64encode(jpeg).decode()


def _parse_json(text):
    if not text:
        raise ValueError("empty AI reply")
    t = text.strip()
    t = re.sub(r"^```(?:json)?|```$", "", t, flags=re.M).strip()
    try:
        return json.loads(t)
    except Exception:  # noqa: BLE001
        m = re.search(r"\{.*\}", t, re.S)
        if not m:
            raise
        return json.loads(m.group(0))


def _chat(messages, max_tokens=4000, want_json=True):
    """Gemini 3.5 'thinking' tokens bhi max_tokens se count hote hain - isliye budget bada (4000) rakha hai,
    warna JSON beech me kat jata hai."""
    c = client()
    if c is None:
        raise RuntimeError("KODEKEY_API_KEY not set")
    kw = dict(model=config.VISION_MODEL, messages=messages, temperature=0, max_tokens=max_tokens)
    if want_json:
        try:
            r = c.chat.completions.create(response_format={"type": "json_object"}, **kw)
            return r.choices[0].message.content
        except Exception as e:  # noqa: BLE001  (kuch gateways json mode support nahi karte)
            log.info("json mode failed (%s) - plain mode retry", type(e).__name__)
    r = c.chat.completions.create(**kw)
    return r.choices[0].message.content


def _json_call(messages, max_tokens=4000, tries=2):
    """AI ko bulao aur JSON parse karo; adhura/ganda JSON aaye to ek baar phir try."""
    last = None
    for i in range(tries):
        try:
            return _parse_json(_chat(messages, max_tokens=max_tokens, want_json=(i == 0)))
        except Exception as e:  # noqa: BLE001
            last = e
            log.info("AI json attempt %d failed: %s", i + 1, type(e).__name__)
    raise last


# ---------------------------------------------------------------- 1. analyze
ANALYZE_PROMPT = """You are Chaukas AI, a civic-problem detection agent for Indian towns (Roorkee, Muzaffarnagar).
Look at the photo and decide whether it shows a civic infrastructure problem.

Categories (choose exactly one):
- road_damage   : potholes, cracked/broken road, damaged footpath
- garbage       : overflowing bins, garbage dumps, littering
- streetlight   : broken / dark / hanging streetlight or pole
- water_leakage : burst or leaking water pipe, water gushing
- drainage      : blocked/overflowing drain, sewage, waterlogging, open manhole
- other         : any other public problem (fallen tree, damaged public property, ...)

SCORING RUBRIC - be discriminating, use the FULL 1-10 range, do NOT default to the middle:
 extent      1-2 tiny/cosmetic | 3-4 small, one spot | 5-6 moderate, partly blocks the way | 7-8 large, blocks a lane / spreads widely | 9-10 massive, whole road/area affected
 safety_risk 1-2 harmless nuisance | 3-4 minor inconvenience | 5-6 could cause a fall or damage to a vehicle | 7-8 likely to injure people / cause accidents (deep pothole in a traffic lane, large flooding, dark road, large garbage heap with health risk) | 9-10 life-threatening (open manhole, live/exposed wire, collapsing structure, deep water-filled crater)
Judge only what is visible in the photo. A tiny crack or a few pieces of litter must score low (1-3); a deep sinkhole or a live wire must score high (8-10).

Location of the report: {area}.
{note}
Return ONLY a JSON object, no markdown, with exactly these keys:
{{
 "is_valid": true/false,            // false only if the photo clearly shows NO civic problem (selfie, indoor, blank, screenshot, etc.)
 "category": "<one of the categories>",
 "problem": "<one short sentence, max 14 words, e.g. Large pothole covering half of the lane>",
 "confidence": <0.0-1.0>,
 "evidence": ["<3 short visual observations, max 10 words each>"],
 "extent": <integer 1-10, how large / widespread the problem is in the photo>,
 "safety_risk": <integer 1-10, danger to people or vehicles if left unrepaired>,
 "hazard": "none" | "open_manhole" | "live_wire",
 "subject": "<formal English subject line for the complaint letter, max 12 words>",
 "letter_en": "<formal complaint letter in English, 3-4 sentences, starts with 'Respected Sir/Madam,', mentions the exact location and the problem, requests inspection and repair, says photo and GPS are attached. No placeholders>",
 "letter_hi": "<the same letter in formal Hindi (Devanagari), starts with 'माननीय महोदय,'>"
}}"""


def analyze_issue(jpeg: bytes, citizen_text: str = "", area: str = ""):
    note = f'Citizen note (may be in Hindi or English): "{citizen_text[:300]}"\n' if citizen_text else ""
    try:
        d = _json_call([{"role": "user", "content": [
            {"type": "text", "text": ANALYZE_PROMPT.format(note=note, area=area or "unknown")},
            {"type": "image_url", "image_url": {"url": _data_url(jpeg)}},
        ]}])
        return _clean_analysis(d), "gemini"
    except Exception as e:  # noqa: BLE001
        log.warning("analyze_issue fallback: %s: %s", type(e).__name__, str(e)[:200])
        return _fallback_analysis(citizen_text), "fallback"


def _clean_analysis(d):
    cat = str(d.get("category", "other")).strip().lower().replace(" ", "_")
    if cat not in CATEGORIES:
        cat = "other"
    try:
        conf = max(0.0, min(1.0, float(d.get("confidence", 0.8))))
    except (TypeError, ValueError):
        conf = 0.8
    def _n(key):
        try:
            return max(1, min(10, int(round(float(d.get(key))))))
        except (TypeError, ValueError):
            return None
    ext, risk = _n("extent"), _n("safety_risk")
    if ext is not None and risk is not None:
        dmg = int(round((ext + 2 * risk) / 3))  # safety risk ko zyada weight
    else:
        dmg = _n("damage_score") or 5
    ev = d.get("evidence") or []
    if isinstance(ev, str):
        ev = [ev]
    ev = [str(x)[:90] for x in ev if str(x).strip()][:3] or ["Visible issue in the photo"]
    hz = str(d.get("hazard", "none")).lower()
    return {
        "is_valid": bool(d.get("is_valid", True)),
        "category": cat,
        "problem": str(d.get("problem") or "Civic issue reported by citizen")[:140],
        "confidence": round(conf, 2),
        "evidence": ev,
        "damage_score": max(1, min(10, dmg)),
        "extent": ext, "safety_risk": risk,
        "hazard": hz if hz in ("open_manhole", "live_wire") else "none",
        "letter": _clean_letter(d),
    }


def _clean_letter(d):
    out = {"subject": str(d.get("subject", "")).strip()[:160], "en": str(d.get("letter_en", "")).strip(), "hi": str(d.get("letter_hi", "")).strip()}
    return out if all(len(v) > 20 for v in out.values()) else None


def _fallback_analysis(text):
    t = (text or "").lower()
    cat = ("streetlight" if re.search(r"light|bijli|batti|लाइट|बत्ती", t) else
           "garbage" if re.search(r"kachra|garbage|waste|kooda|कचरा|कूड़ा", t) else
           "water_leakage" if re.search(r"pani|water|leak|pipe|पानी|पाइप", t) else
           "drainage" if re.search(r"nali|drain|sewer|नाली|सीवर", t) else
           "road_damage" if re.search(r"road|sadak|pothole|gadda|सड़क|गड्ढा|गढ्ढा", t) else "road_damage")
    label = {"road_damage": "Road damage", "garbage": "Garbage", "streetlight": "Streetlight fault", "water_leakage": "Water leakage", "drainage": "Drainage problem"}[cat]
    return {
        "is_valid": True, "category": cat, "problem": f"{label} reported by citizen", "confidence": 0.5,
        "evidence": ["Citizen-reported issue (AI photo check unavailable)"], "damage_score": 5, "hazard": "none", "letter": None,
    }


# ---------------------------------------------------------------- 2. letter
HI_LEVEL = {"LOW": "कम", "MEDIUM": "मध्यम", "HIGH": "गंभीर", "CRITICAL": "अति गंभीर"}


def finalize_letter(letter, facts: dict):
    """AI ka letter (analysis call se) + severity ke hisaab se urgency line. AI letter na ho to template."""
    if not letter:
        return template_letter(facts)
    out = dict(letter)
    lvl = facts.get("severity_level")
    if lvl in ("HIGH", "CRITICAL"):
        out["en"] += f" As per the Chaukas AI assessment this issue is of {lvl} priority ({facts.get('severity_score')}/10) and needs urgent attention."
        out["hi"] += f" चौकस AI के आकलन के अनुसार यह समस्या {HI_LEVEL[lvl]} प्राथमिकता ({facts.get('severity_score')}/10) की है और तुरंत ध्यान देने योग्य है।"
    return out


def template_letter(f):
    area = f.get("area") or "the marked location"
    label = (f.get("category_label") or "civic issue").lower()
    urgent = ""
    if f.get("severity_level") in ("HIGH", "CRITICAL"):
        urgent = f" The issue is rated {f['severity_level']} priority ({f.get('severity_score')}/10) by our AI system and needs urgent attention."
    urgent_hi = ""
    if f.get("severity_level") in ("HIGH", "CRITICAL"):
        urgent_hi = f" हमारे AI सिस्टम ने इसे {f['severity_level']} प्राथमिकता ({f.get('severity_score')}/10) दी है, अतः तुरंत ध्यान देने की आवश्यकता है।"
    return {
        "subject": f"Request for urgent inspection - {area}",
        "en": f"Respected Sir/Madam, I would like to report a civic issue ({label}: {f.get('problem', '')}) at {area}.{urgent} Kindly arrange inspection and repair at the earliest. Photo and GPS location are attached.",
        "hi": f"माननीय महोदय, मैं {area} पर एक नागरिक समस्या ({f.get('problem', '')}) की सूचना देना चाहता हूँ।{urgent_hi} कृपया शीघ्र निरीक्षण एवं मरम्मत करवाएँ। फोटो और जीपीएस लोकेशन संलग्न है।",
    }


# ---------------------------------------------------------------- 3. verify
VERIFY_PROMPT = """You are Chaukas AI verifying whether a reported civic problem has really been fixed.
Problem originally reported: "{problem}" (category: {category}).
{images}
Decide if the AFTER photo shows the same kind of location with the problem properly fixed (repaired road, cleared garbage, working light, no more leak/overflow).
Be strict: a different place, a staged/unrelated photo, a screenshot, or a problem still visible = not_resolved.
Return ONLY JSON: {{"verdict": "resolved" | "not_resolved" | "unclear", "confidence": <0.0-1.0>, "reason": "<one short sentence, max 14 words>"}}"""


def verify_resolution(problem, category, after_jpeg, before_jpeg=None):
    content = []
    if before_jpeg:
        desc = "Image 1 is the BEFORE photo, image 2 is the AFTER photo."
        content_imgs = [before_jpeg, after_jpeg]
    else:
        desc = "Only the AFTER photo is available (no original photo)."
        content_imgs = [after_jpeg]
    content.append({"type": "text", "text": VERIFY_PROMPT.format(problem=problem, category=category, images=desc)})
    for j in content_imgs:
        content.append({"type": "image_url", "image_url": {"url": _data_url(j)}})
    try:
        d = _json_call([{"role": "user", "content": content}])
        verdict = str(d.get("verdict", "unclear")).strip().lower().replace(" ", "_")
        if verdict not in ("resolved", "not_resolved", "unclear"):
            verdict = "unclear"
        conf = max(0.0, min(1.0, float(d.get("confidence", 0.5))))
        return {"verdict": verdict, "confidence": round(conf, 2), "reason": str(d.get("reason", ""))[:160] or "AI comparison complete", "source": "gemini"}
    except Exception as e:  # noqa: BLE001
        log.warning("verify_resolution failed: %s: %s", type(e).__name__, str(e)[:200])
        return {"verdict": "unclear", "confidence": 0.0, "reason": "AI verification unavailable right now - please retry", "source": "error"}
