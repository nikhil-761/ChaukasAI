// Shared constants - CONTRACT.md ke saath match rakho

export const SEVERITY = {
  LOW:      { label: 'Low',      color: '#10B981', bg: 'bg-emerald-500/10', text: 'text-emerald-300', ring: 'ring-emerald-400/30', range: '0-3', hi: 'कम' },
  MEDIUM:   { label: 'Medium',   color: '#F59E0B', bg: 'bg-amber-500/10',   text: 'text-amber-300',   ring: 'ring-amber-400/30',   range: '4-6', hi: 'मध्यम' },
  HIGH:     { label: 'High',     color: '#F97316', bg: 'bg-orange-500/10',  text: 'text-orange-300',  ring: 'ring-orange-400/30',  range: '7-8', hi: 'गंभीर' },
  CRITICAL: { label: 'Critical', color: '#EF4444', bg: 'bg-red-500/10',     text: 'text-red-300',     ring: 'ring-red-400/35',     range: '9-10', hi: 'अति गंभीर' },
}

export const STATUS = {
  submitted:   { label: 'Submitted', hi: 'दर्ज', cls: 'bg-ink/10 text-mute' },
  in_progress: { label: 'In progress', hi: 'काम जारी', cls: 'bg-sky-500/15 text-sky-300' },
  resolved:    { label: 'Resolved', hi: 'हल हुआ', cls: 'bg-emerald-500/15 text-emerald-300' },
  rejected:    { label: 'Rejected', hi: 'अस्वीकृत', cls: 'bg-rose-500/15 text-rose-300' },
}

export const CATEGORIES = {
  road_damage:   { label: 'Road damage', hi: 'सड़क खराब' },
  garbage:       { label: 'Garbage', hi: 'कचरा' },
  streetlight:   { label: 'Streetlight', hi: 'स्ट्रीट लाइट' },
  water_leakage: { label: 'Water leakage', hi: 'पानी का रिसाव' },
  drainage:      { label: 'Drainage', hi: 'नाली / ड्रेनेज' },
  other:         { label: 'Other', hi: 'अन्य' },
}

export const levelFromScore = (s) => (s >= 9 ? 'CRITICAL' : s >= 7 ? 'HIGH' : s >= 4 ? 'MEDIUM' : 'LOW')

export const CITIES = {
  roorkee:       { name: 'Roorkee',       center: [29.8543, 77.8880] },
  muzaffarnagar: { name: 'Muzaffarnagar', center: [29.4727, 77.7085] },
}
