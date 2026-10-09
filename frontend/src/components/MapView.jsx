// MapView - Avni ka module. Props stable rakhna: { complaints, center, zoom, onSelect, selectedId, height }
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SEVERITY, CATEGORIES } from '../lib/constants'

const pin = (level, selected) => {
  const color = SEVERITY[level]?.color || '#64748b'
  const size = selected ? 28 : level === 'CRITICAL' ? 22 : 17
  return L.divIcon({
    className: 'cz-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `${level === 'CRITICAL' || selected ? `<span class="ring" style="background:${color}66"></span>` : ''}<span class="dot" style="background:${color};box-shadow:0 0 ${selected ? 22 : 14}px ${color}"></span>`,
  })
}

function FlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.9 }) }, [center?.[0], center?.[1]]) // eslint-disable-line
  return null
}

function ClickPicker({ onPick }) {
  useMapEvents({ click: (e) => onPick?.([e.latlng.lat, e.latlng.lng]) })
  return null
}

export default function MapView({ complaints = [], center = [29.8543, 77.888], zoom = 13, onSelect, selectedId, height = 420, pickable, picked, onPick, flyTo, rounded = 'rounded-2xl' }) {
  return (
    <div className={`overflow-hidden ${rounded}`} style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={!pickable} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FlyTo center={flyTo} zoom={15} />
        {pickable && <ClickPicker onPick={onPick} />}
        {pickable && picked && <Marker position={picked} icon={pin('CRITICAL', true)} />}
        {complaints.map((c) => (
          <Marker key={c.complaint_id} position={[c.location.lat, c.location.lng]}
            icon={pin(c.severity.level, selectedId === c.complaint_id)}
            eventHandlers={{ click: () => onSelect?.(c.complaint_id) }}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{CATEGORIES[c.analysis.category]?.label} · <span style={{ color: SEVERITY[c.severity.level].color }}>{c.severity.level}</span></div>
                <div className="mt-0.5 text-[#A3AECB]">{c.analysis.problem}</div>
                <div className="mt-1 text-xs text-[#6B7692]">{c.location.area} · {c.complaint_id}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
