import { timeAgo } from '../../lib/useComplaints'
export { timeAgo }

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-')
export const ageDays = (iso) => (Date.now() - new Date(iso)) / 86400000
export const OVERDUE_DAYS = 7
export const isOpen = (c) => c.status !== 'resolved' && c.status !== 'rejected'
export const isOverdue = (c) => isOpen(c) && ageDays(c.created_at) > OVERDUE_DAYS
export const needsReview = (c) => c.analysis?.confidence < 0.85 || c.flagged
export const closureHours = (c) => (c.resolution?.resolved_at ? (new Date(c.resolution.resolved_at) - new Date(c.created_at)) / 3600000 : null)

export function download(name, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function toCSV(list) {
  const cols = ['complaint_id', 'status', 'created_at', 'city', 'area', 'lat', 'lng', 'category', 'problem', 'ai_confidence', 'severity_score', 'severity_level', 'severity_reasons', 'department', 'resolved_at', 'ai_verdict', 'ai_verdict_confidence', 'gps_distance_m', 'admin_notes']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = list.map((c) => [c.complaint_id, c.status, c.created_at, c.city, c.location.area, c.location.lat, c.location.lng, c.analysis.category, c.analysis.problem, c.analysis.confidence, c.severity.score, c.severity.level, (c.severity.reasons || []).join(' | '), c.department.name, c.resolution?.resolved_at, c.resolution?.verdict, c.resolution?.confidence, c.resolution?.gps_distance_m, (c.admin_notes || []).map((n) => n.text).join(' | ')])
  return '﻿' + [cols.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}

export function deptStats(list) {
  const m = {}
  list.forEach((c) => {
    const d = (m[c.department.name] ||= { name: c.department.name, total: 0, open: 0, resolved: 0, critical: 0, overdue: 0, hours: [] })
    d.total++
    if (c.status === 'resolved') { d.resolved++; const h = closureHours(c); if (h != null) d.hours.push(h) } else if (isOpen(c)) { d.open++; if (c.severity.level === 'CRITICAL') d.critical++; if (isOverdue(c)) d.overdue++ }
  })
  return Object.values(m).map((d) => ({ ...d, rate: d.total ? Math.round((d.resolved / d.total) * 100) : 0, avg: d.hours.length ? Math.round(d.hours.reduce((a, b) => a + b, 0) / d.hours.length) : null })).sort((a, b) => b.total - a.total)
}

export const ALL_DEPTS = [
  'Public Works Department (PWD)', 'Municipal Corporation - Sanitation', 'Municipal Corporation / UPCL', 'Uttarakhand Jal Sansthan', 'Municipal Corporation - Drainage',
  'Nagar Palika - Sanitation', 'Nagar Palika / Electricity Distribution', 'Jal Sansthan / Jal Nigam', 'Nagar Palika - Drainage',
]
