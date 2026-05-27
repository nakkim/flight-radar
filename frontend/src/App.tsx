import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Flight {
  lat: number
  lon: number
  r: string
  desc: string
  flight: string | null
  distance: number
  heading: number
  alt_baro?: number | string
}

const CENTER_LAT = 60.1699
const CENTER_LON = 24.9384
const RADIUS = 250
const API_URL = `http://localhost:3000/search?lat=${CENTER_LAT}&lon=${CENTER_LON}&radius=${RADIUS}`

const CANVAS_SIZE = 600
const RADAR_RADIUS = CANVAS_SIZE / 2 - 20
const RINGS = 4

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [hovered, setHovered] = useState<Flight | null>(null)
  const flightsRef = useRef<Flight[]>([])

  useEffect(() => {
    flightsRef.current = flights
  }, [flights])

  const fetchFlights = async () => {
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Flight[] = await res.json()
      setFlights(data)
      setLastUpdate(new Date().toLocaleTimeString())
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fetch failed')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFlights()
    const interval = setInterval(fetchFlights, 5000)
    return () => clearInterval(interval)
  }, [])

  // Draw radar
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = CANVAS_SIZE / 2
    const cy = CANVAS_SIZE / 2

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Background
    ctx.fillStyle = '#020f02'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Rings
    for (let i = 1; i <= RINGS; i++) {
      const r = (RADAR_RADIUS / RINGS) * i
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0, 180, 0, 0.3)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Ring label (distance)
      const ringKm = Math.round((RADIUS / RINGS) * i)
      ctx.fillStyle = 'rgba(0, 180, 0, 0.5)'
      ctx.font = '11px monospace'
      ctx.fillText(`${ringKm}km`, cx + 4, cy - r + 14)
    }

    // Cross-hairs
    ctx.strokeStyle = 'rgba(0, 180, 0, 0.25)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(cx, cy - RADAR_RADIUS); ctx.lineTo(cx, cy + RADAR_RADIUS); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx - RADAR_RADIUS, cy); ctx.lineTo(cx + RADAR_RADIUS, cy); ctx.stroke()

    // Cardinal labels
    ctx.fillStyle = 'rgba(0, 220, 0, 0.7)'
    ctx.font = '13px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('N', cx, cy - RADAR_RADIUS - 6)
    ctx.fillText('S', cx, cy + RADAR_RADIUS + 16)
    ctx.textAlign = 'left'
    ctx.fillText('E', cx + RADAR_RADIUS + 6, cy + 4)
    ctx.textAlign = 'right'
    ctx.fillText('W', cx - RADAR_RADIUS - 6, cy + 4)
    ctx.textAlign = 'left'

    // Center dot
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#00ff00'
    ctx.fill()

    // Plot flights
    flights.forEach((f) => {
      const hRad = (f.heading * Math.PI) / 180
      const distFraction = Math.min(f.distance / RADIUS, 1)
      const fx = cx + Math.sin(hRad) * distFraction * RADAR_RADIUS
      const fy = cy - Math.cos(hRad) * distFraction * RADAR_RADIUS

      const isHovered = hovered?.r === f.r
      const isAirborne = typeof f.alt_baro === 'number'

      // Blip
      ctx.beginPath()
      ctx.arc(fx, fy, isHovered ? 7 : 5, 0, Math.PI * 2)
      ctx.fillStyle = isHovered ? '#ffffff' : isAirborne ? '#00ff44' : '#ff4444'
      ctx.fill()

      // Label
      ctx.fillStyle = isHovered ? '#ffffff' : '#00dd33'
      ctx.font = isHovered ? 'bold 12px monospace' : '11px monospace'
      ctx.fillText(f.flight || f.r || '?', fx + 8, fy - 4)
    })
  }, [flights, hovered])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const cx = CANVAS_SIZE / 2
    const cy = CANVAS_SIZE / 2

    const found = flightsRef.current.find((f) => {
      const hRad = (f.heading * Math.PI) / 180
      const distFraction = Math.min(f.distance / RADIUS, 1)
      const fx = cx + Math.sin(hRad) * distFraction * RADAR_RADIUS
      const fy = cy - Math.cos(hRad) * distFraction * RADAR_RADIUS
      return Math.hypot(mx - fx, my - fy) < 10
    })
    setHovered(found ?? null)
  }

  return (
    <div className="app">
      <h1>✈ Planes Radar</h1>
      <p className="subtitle">
        Centre: {CENTER_LAT}°N {CENTER_LON}°E · Radius: {RADIUS} km
        {lastUpdate && <> · Updated: {lastUpdate}</>}
        {error && <span className="error"> · Error: {error}</span>}
      </p>
      <div className="radar-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
        />
        {hovered && (
          <div className="tooltip">
            <strong>{hovered.flight || '—'}</strong><br />
            {hovered.desc || '—'}<br />
            Reg: {hovered.r || '—'}<br />
            {hovered.distance} km · {hovered.heading}°
          </div>
        )}
      </div>
      <table className="flight-table">
        <thead>
          <tr><th>Flight</th><th>Reg</th><th>Type</th><th>Distance</th><th>Heading</th></tr>
        </thead>
        <tbody>
          {flights.map((f) => (
            <tr
              key={f.r}
              className={hovered?.r === f.r ? 'active' : ''}
              onMouseEnter={() => setHovered(f)}
              onMouseLeave={() => setHovered(null)}
            >
              <td>{f.flight || '—'}</td>
              <td>{f.r || '—'}</td>
              <td>{f.desc || '—'}</td>
              <td>{f.distance} km</td>
              <td>{f.heading}°</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App

