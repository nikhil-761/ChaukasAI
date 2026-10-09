// Seed complaints (demo data). Real backend aane par ye file hata sakte hain.
// NOTE: dashboard history sirf sample data hai - judges ko honestly batana.
import { levelFromScore } from './constants'

const AREAS = [
  // Roorkee
  ['Civil Lines, Roorkee', 29.8543, 77.888, 'roorkee'],
  ['IIT Roorkee Gate', 29.8649, 77.8966, 'roorkee'],
  ['Solani Park, Roorkee', 29.8712, 77.8801, 'roorkee'],
  ['Railway Road, Roorkee', 29.8601, 77.8895, 'roorkee'],
  ['Ramnagar, Roorkee', 29.8478, 77.8932, 'roorkee'],
  ['Medical Chowk, Roorkee', 29.8566, 77.9004, 'roorkee'],
  ['Bhagwanpur Road, Roorkee', 29.8794, 77.8741, 'roorkee'],
  ['Landhaura Chowk, Roorkee', 29.8399, 77.8814, 'roorkee'],
  ['Katarpur, Roorkee', 29.8305, 77.8952, 'roorkee'],
  ['Gurukul Narsan Road', 29.8892, 77.9058, 'roorkee'],
  // Muzaffarnagar
  ['Delhi Road, Muzaffarnagar', 29.4727, 77.7085, 'muzaffarnagar'],
  ['Kachehri Road', 29.4691, 77.7032, 'muzaffarnagar'],
  ['New Mandi, Muzaffarnagar', 29.4812, 77.7152, 'muzaffarnagar'],
  ['Shamli Road', 29.4885, 77.6991, 'muzaffarnagar'],
  ['Civil Lines, Muzaffarnagar', 29.4659, 77.7104, 'muzaffarnagar'],
  ['Bhopa Road', 29.4574, 77.7249, 'muzaffarnagar'],
  ['Khatauli Road', 29.4401, 77.7011, 'muzaffarnagar'],
  ['Gandhi Colony', 29.4768, 77.6924, 'muzaffarnagar'],
  ['Ramlila Ground Road', 29.4639, 77.7176, 'muzaffarnagar'],
  ['Sujru Road', 29.4503, 77.7133, 'muzaffarnagar'],
]

const PROBLEMS = {
  road_damage:   ['Large pothole covering part of the lane', 'Broken road edge with exposed gravel', 'Deep crater after waterlogging'],
  garbage:       ['Overflowing garbage dump on roadside', 'Uncollected waste blocking footpath'],
  streetlight:   ['Streetlight not working on main stretch', 'Pole light flickering and dark patch'],
  water_leakage: ['Main pipeline leaking onto the road', 'Continuous water leakage near junction'],
  drainage:      ['Open drain overflowing on the road', 'Blocked drain causing waterlogging'],
}
const DEPT = {
  roorkee: {
    road_damage: 'Public Works Department (PWD)', garbage: 'Municipal Corporation - Sanitation', streetlight: 'Municipal Corporation / UPCL',
    water_leakage: 'Uttarakhand Jal Sansthan', drainage: 'Municipal Corporation - Drainage',
  },
  muzaffarnagar: {
    road_damage: 'Public Works Department (PWD)', garbage: 'Nagar Palika - Sanitation', streetlight: 'Nagar Palika / Electricity Distribution',
    water_leakage: 'Jal Sansthan / Jal Nigam', drainage: 'Nagar Palika - Drainage',
  },
}
const CATS = Object.keys(PROBLEMS)

// small deterministic RNG so every reload looks the same
let seed = 7
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
const pick = (a) => a[Math.floor(rnd() * a.length)]

const SCORE_PLAN = [9,10,7,5,3,8,6,2,9,4,7,5,6,3,8,10,4,7,5,2,6,8,3,9,5,7,4,6,2,8,5,9,3,6,7,4,8,5,2,7]
const DAY = 86400000

export const SEED_COMPLAINTS = SCORE_PLAN.map((score, i) => {
  const [area, lat, lng, city] = AREAS[i % AREAS.length]
  const cat = CATS[Math.floor(rnd() * CATS.length)]
  const jitter = () => (rnd() - 0.5) * 0.004
  const created = Date.now() - Math.floor(rnd() * 14 * DAY) - 3600000
  const resolved = rnd() < 0.4
  const inProg = !resolved && rnd() < 0.45
  const level = levelFromScore(score)
  const schoolNear = score >= 8 && rnd() < 0.7 ? 60 + Math.floor(rnd() * 140) : null
  const dups = score >= 7 ? 1 + Math.floor(rnd() * 3) : 0
  const reasons = [`AI damage score ${Math.min(score, 6)}`]
  if (schoolNear) reasons.push('School within 200 m (+2)')
  if (dups) reasons.push(`Reported by ${dups + 1} citizens (+${dups >= 3 ? 2 : 1})`)
  if (score >= 7) reasons.push('Main road (+1)')
  const dept = DEPT[city][cat]
  return {
    complaint_id: `CS-${1001 + i}`,
    status: resolved ? 'resolved' : inProg ? 'in_progress' : 'submitted',
    created_at: new Date(created).toISOString(),
    city,
    location: { lat: lat + jitter(), lng: lng + jitter(), area },
    image_url: null,
    analysis: {
      is_valid: true, category: cat, problem: pick(PROBLEMS[cat]),
      confidence: +(0.82 + rnd() * 0.16).toFixed(2),
      evidence: ['Visible damage across the lane', 'Surrounding surface affected', 'Hazard to pedestrians and two-wheelers'],
      damage_score: Math.min(score, 6) + (score > 6 ? 0 : 0),
    },
    context: { school_within_m: schoolNear, hospital_within_m: null, duplicate_count: dups, road_type: score >= 7 ? 'main' : 'local' },
    severity: { score, level, reasons },
    department: { name: dept, contact: 'demo@chaukas.test' },
    complaint_text: {
      subject: `Request for urgent inspection - ${area}`,
      en: `Respected Sir/Madam, I would like to bring to your attention a civic issue at ${area}. Please arrange an inspection and repair at the earliest. Photo and GPS location are attached.`,
      hi: `माननीय महोदय, ${area} पर एक नागरिक समस्या की ओर आपका ध्यान दिलाना चाहता हूँ। कृपया शीघ्र निरीक्षण एवं मरम्मत करवाएँ। फोटो और जीपीएस लोकेशन संलग्न है।`,
    },
    resolution: resolved
      ? { verdict: 'resolved', confidence: +(0.86 + rnd() * 0.12).toFixed(2), reason: 'Surface repaired, no visible damage', gps_distance_m: 10 + Math.floor(rnd() * 40), resolved_at: new Date(created + DAY * (1 + rnd() * 3)).toISOString() }
      : null,
  }
})
