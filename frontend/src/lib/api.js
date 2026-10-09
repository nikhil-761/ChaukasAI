// API layer. USE_MOCK=true -> sab kuch browser mein simulate hota hai (backend ke bina demo chalega).
// Backend ready hone par .env mein VITE_USE_MOCK=false karo - bas itna.
import { SEED_COMPLAINTS } from './mockData'
import { levelFromScore, CATEGORIES } from './constants'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' // default: real backend. Sirf VITE_USE_MOCK=true par browser-demo mode
// Backend alag host par ho (Vercel + Render) to VITE_API_BASE=https://your-api.onrender.com set karo. Same host/proxy par khali rakho.
export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const KEY = 'chaukas.complaints.v1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ---------- real backend helpers ---------- */
export class ApiError extends Error {
  constructor(message, status, detail) { super(message); this.status = status; this.detail = detail }
}
const absUrl = (u) => (u && u.startsWith('/') ? API_BASE + u : u)
const fixUrls = (c) => {
  if (!c || typeof c !== 'object') return c
  const out = { ...c, image_url: absUrl(c.image_url) }
  if (c.resolution) out.resolution = { ...c.resolution, after_image_url: absUrl(c.resolution.after_image_url) }
  return out
}
const adminToken = () => { try { return JSON.parse(sessionStorage.getItem('chaukas-admin') || '{}').token || '' } catch { return '' } }

// fetch + JSON + error handling. 404 -> ApiError(status 404). Network fail -> ApiError(status 0)
async function http(path, opts = {}) {
  let r
  try { r = await fetch(API_BASE + path, opts) } catch { throw new ApiError('Server se connect nahi ho paya', 0) }
  let body = null
  try { body = await r.json() } catch {}
  if (!r.ok) {
    const d = body?.detail
    const msg = typeof d === 'string' ? d : d?.en || d?.message || `Request failed (${r.status})`
    throw new ApiError(msg, r.status, d)
  }
  return body
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return SEED_COMPLAINTS
}
function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}

export async function listComplaints() {
  if (!USE_MOCK) {
    const t = adminToken() // admin ko private fields (notes/flags) bhi chahiye
    const list = t ? await http('/api/admin/complaints', { headers: { Authorization: `Bearer ${t}` } }).catch((e) => (e.status === 401 ? http('/api/complaints') : Promise.reject(e))) : await http('/api/complaints')
    return list.map(fixUrls)
  }
  await sleep(250)
  return load()
}

export async function getComplaint(id) {
  if (!USE_MOCK) {
    try { return fixUrls(await http(`/api/complaints/${encodeURIComponent(id.trim())}`)) } catch (e) { if (e.status === 404) return null; throw e }
  }
  await sleep(200)
  return load().find((c) => c.complaint_id.toLowerCase() === id.trim().toLowerCase()) || null
}

export async function updateStatus(id, status) {
  if (!USE_MOCK) return fixUrls(await http(`/api/complaints/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }))
  const list = load().map((c) => (c.complaint_id === id ? { ...c, status } : c))
  save(list)
  return list.find((c) => c.complaint_id === id)
}

function currentPosition() {
  return new Promise((res) => {
    if (!navigator.geolocation) return res(null)
    navigator.geolocation.getCurrentPosition((p) => res([p.coords.latitude, p.coords.longitude]), () => res(null), { timeout: 4000, maximumAge: 120000 })
  })
}

export async function resolveComplaint(id, afterFile) {
  if (!USE_MOCK) {
    const fd = new FormData(); fd.append('image', afterFile)
    const here = await currentPosition() // GPS match check ke liye (permission na mile to EXIF/skip)
    if (here) { fd.append('lat', here[0]); fd.append('lng', here[1]) }
    return fixUrls(await http(`/api/complaints/${id}/resolve`, { method: 'POST', body: fd }))
  }
  await sleep(1800)
  const list = load().map((c) =>
    c.complaint_id === id
      ? { ...c, status: 'resolved', resolution: { verdict: 'resolved', confidence: 0.92, reason: 'Surface repaired, no visible hole', gps_distance_m: 38, resolved_at: new Date().toISOString(), after_image_url: afterFile ? URL.createObjectURL(afterFile) : null } }
      : c
  )
  save(list)
  return list.find((c) => c.complaint_id === id)
}

export async function submitComplaint({ file, lat, lng, area, text, language }) {
  if (!USE_MOCK) {
    const fd = new FormData()
    fd.append('image', file); fd.append('lat', lat); fd.append('lng', lng); fd.append('text', text || ''); fd.append('language', language); fd.append('area', area || '')
    return fixUrls(await http('/api/complaints', { method: 'POST', body: fd }))
  }
  // Demo pipeline: text ke keywords se thoda realistic output
  await sleep(300)
  const t = (text || '').toLowerCase()
  const cat = /light|bijli|batti/.test(t) ? 'streetlight' : /kachra|garbage|waste|kooda/.test(t) ? 'garbage' : /pani|water|leak|pipe/.test(t) ? 'water_leakage' : /nali|drain|sewer/.test(t) ? 'drainage' : 'road_damage'
  const safety = /fell|accident|injur|child|bachh|gir/.test(t)
  const school = /school|vidyalaya/.test(t) ? 120 : null
  const base = 5
  let score = base + (school ? 2 : 0) + 1 + (safety ? 1 : 0)
  score = Math.min(score, 10)
  const reasons = [`AI damage score ${base}`]
  if (school) reasons.push('School within 200 m (+2)')
  reasons.push('Main road (+1)')
  if (safety) reasons.push('Safety words in citizen note (+1)')
  const id = `CS-${1001 + load().length}`
  const complaint = {
    complaint_id: id, status: 'submitted', created_at: new Date().toISOString(), city: 'roorkee',
    location: { lat, lng, area: area || 'Your location' },
    image_url: file ? URL.createObjectURL(file) : null,
    analysis: { is_valid: true, category: cat, problem: `${CATEGORIES[cat].label} reported by citizen`, confidence: 0.94, evidence: ['Visible damage in the photo', 'Public area affected', 'Hazard to pedestrians'], damage_score: base },
    context: { school_within_m: school, hospital_within_m: null, duplicate_count: 0, road_type: 'main' },
    severity: { score, level: levelFromScore(score), reasons },
    department: { name: 'Public Works Department (PWD)', contact: 'demo@chaukas.test' },
    complaint_text: {
      subject: `Request for urgent inspection - ${area || 'reported location'}`,
      en: `Respected Sir/Madam, I would like to report a civic issue (${CATEGORIES[cat].label.toLowerCase()}) at ${area || 'the marked location'}. Kindly arrange inspection and repair at the earliest. Photo and GPS are attached.`,
      hi: `माननीय महोदय, मैं ${area || 'चिन्हित स्थान'} पर एक नागरिक समस्या की सूचना देना चाहता हूँ। कृपया शीघ्र निरीक्षण एवं मरम्मत करवाएँ। फोटो और जीपीएस संलग्न है।`,
    },
    resolution: null,
  }
  save([complaint, ...load()])
  return complaint
}

export function computeStats(list) {
  const total = list.length
  const resolved = list.filter((c) => c.status === 'resolved').length
  const critical = list.filter((c) => c.severity.level === 'CRITICAL' && c.status !== 'resolved').length
  const avgHours = (() => {
    const done = list.filter((c) => c.resolution?.resolved_at)
    if (!done.length) return 0
    return Math.round(done.reduce((a, c) => a + (new Date(c.resolution.resolved_at) - new Date(c.created_at)) / 3600000, 0) / done.length)
  })()
  const byDept = {}
  list.forEach((c) => {
    const d = (byDept[c.department.name] ||= { name: c.department.name, total: 0, resolved: 0 })
    d.total++; if (c.status === 'resolved') d.resolved++
  })
  const scoreboard = Object.values(byDept).map((d) => ({ ...d, rate: Math.round((d.resolved / d.total) * 100) })).sort((a, b) => b.rate - a.rate)
  return { total, resolved, open: total - resolved, critical, rate: total ? Math.round((resolved / total) * 100) : 0, avgHours, scoreboard }
}

export function resetDemoData() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(AUDIT_KEY) } catch {}
}

/* ---------------- ADMIN ---------------- */
const AUDIT_KEY = 'chaukas.audit.v1'
export function getAudit() {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]') } catch { return [] }
}
export function logAudit(entry) {
  try { localStorage.setItem(AUDIT_KEY, JSON.stringify([{ at: new Date().toISOString(), ...entry }, ...getAudit()].slice(0, 300))) } catch {}
}
const adminHeaders = () => {
  const t = adminToken()
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }
}

// Real mode me audit log server se aata hai
export async function fetchAudit() {
  if (USE_MOCK) return getAudit()
  try { return await http('/api/admin/audit', { headers: adminHeaders() }) } catch { return [] }
}

// patch: { status?, severity?: {score}, department?: {name}, admin_notes?, flagged? }  label: audit text
export async function adminPatch(id, patch, { actor = 'admin', label = 'Updated' } = {}) {
  if (!USE_MOCK) {
    return fixUrls(await http(`/api/admin/complaints/${id}`, { method: 'PATCH', headers: adminHeaders(), body: JSON.stringify({ ...patch, _label: label }) }))
  }
  let out = null
  const list = load().map((c) => {
    if (c.complaint_id !== id) return c
    const next = { ...c, ...patch }
    if (patch.severity) next.severity = { ...c.severity, ...patch.severity, level: levelFromScore(patch.severity.score ?? c.severity.score) }
    if (patch.department) next.department = { ...c.department, ...patch.department }
    if (patch.status && patch.status !== 'resolved' && c.status === 'resolved' && !patch.keepResolution) next.resolution = null
    delete next.keepResolution
    out = next
    return next
  })
  save(list)
  logAudit({ actor, action: label, id })
  return out
}

export async function adminDelete(id, { actor = 'admin' } = {}) {
  if (!USE_MOCK) { await http(`/api/admin/complaints/${id}`, { method: 'DELETE', headers: adminHeaders() }); return true }
  save(load().filter((c) => c.complaint_id !== id))
  logAudit({ actor, action: 'Deleted complaint', id })
  return true
}

export async function adminHealth() {
  const t0 = performance.now()
  if (USE_MOCK) return { ok: true, mode: 'mock', ms: 0 }
  try {
    const d = await http('/api/health')
    return { ...d, ok: !!d.ok, mode: 'api', ms: Math.round(performance.now() - t0), status: 200 }
  } catch (e) { return { ok: false, mode: 'api', ms: Math.round(performance.now() - t0), status: e.status || 0 } }
}
