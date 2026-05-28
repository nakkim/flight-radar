import { useState, useEffect, useRef } from "react";
import "./App.css";
import { geoToCanvas } from "./utils/utils";

interface Flight {
  lat: number;
  lon: number;
  r: string;
  desc: string;
  flight: string | null;
  distance: number;
  heading: number;
  alt_baro?: number | string;
}

const DEFAULT_LAT = 60.1699;
const DEFAULT_LON = 24.9384;
const DEFAULT_RADIUS = 250;

const CANVAS_SIZE = 600;
const RADAR_RADIUS = CANVAS_SIZE / 2 - 20;
const RINGS = 4;

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [hovered, setHovered] = useState<Flight | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const flightsRef = useRef<Flight[]>([]);

  const [centerLat, setCenterLat] = useState(DEFAULT_LAT);
  const [centerLon, setCenterLon] = useState(DEFAULT_LON);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);

  const [coastlineSegments, setCoastlineSegments] = useState<
    [number, number][][]
  >([]);

  useEffect(() => {
    fetch("/ne_10m_coastline.geojson")
      .then((r) => r.json())
      .then((geojson) => {
        const segments: [number, number][][] = [];
        for (const feature of geojson.features) {
          const { type, coordinates } = feature.geometry;
          if (type === "LineString") {
            segments.push(coordinates as [number, number][]);
          } else if (type === "MultiLineString") {
            for (const line of coordinates as [number, number][][]) {
              segments.push(line);
            }
          } else if (type === "Polygon") {
            for (const ring of coordinates as [number, number][][]) {
              segments.push(ring);
            }
          }
        }
        setCoastlineSegments(segments);
      });
  }, []);

  const [showSettings, setShowSettings] = useState(false);
  const [draftLat, setDraftLat] = useState(String(DEFAULT_LAT));
  const [draftLon, setDraftLon] = useState(String(DEFAULT_LON));
  const [draftRadius, setDraftRadius] = useState(DEFAULT_RADIUS);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    flightsRef.current = flights;
  }, [flights]);

  const fetchFlights = async (lat: number, lon: number, rad: number) => {
    try {
      const res = await fetch(
        `http://localhost:3000/search?lat=${lat}&lon=${lon}&radius=${rad}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Flight[] = await res.json();
      setFlights(data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) await fetchFlights(centerLat, centerLon, radius);
    })();
    const interval = setInterval(
      () => fetchFlights(centerLat, centerLon, radius),
      5000
    );
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [centerLat, centerLon, radius]);

  const openSettings = () => {
    setDraftLat(String(centerLat));
    setDraftLon(String(centerLon));
    setDraftRadius(radius);
    setGeoError(null);
    setShowSettings(true);
  };

  const applySettings = () => {
    const lat = parseFloat(draftLat);
    const lon = parseFloat(draftLon);
    if (isNaN(lat) || isNaN(lon)) {
      setGeoError("Invalid coordinates");
      return;
    }
    setCenterLat(lat);
    setCenterLon(lon);
    setRadius(draftRadius);
    setShowSettings(false);
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by this browser");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraftLat(pos.coords.latitude.toFixed(4));
        setDraftLon(pos.coords.longitude.toFixed(4));
        setLocating(false);
      },
      (err) => {
        setGeoError(err.message);
        setLocating(false);
      }
    );
  };

  // Draw radar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = "#020f02";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Rings
    for (let i = 1; i <= RINGS; i++) {
      const r = (RADAR_RADIUS / RINGS) * i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 180, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ring label (distance)
      const ringKm = Math.round((radius / RINGS) * i);
      ctx.fillStyle = "rgba(0, 180, 0, 0.5)";
      ctx.font = "11px monospace";
      ctx.fillText(`${ringKm}km`, cx + 4, cy - r + 14);
    }

    // Cross-hairs
    ctx.strokeStyle = "rgba(0, 180, 0, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - RADAR_RADIUS);
    ctx.lineTo(cx, cy + RADAR_RADIUS);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - RADAR_RADIUS, cy);
    ctx.lineTo(cx + RADAR_RADIUS, cy);
    ctx.stroke();

    // Shorelines
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, RADAR_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(0, 200, 80, 0.55)";
    ctx.lineWidth = 1;
    for (const segment of coastlineSegments) {
      if (segment.length < 2) continue;
      ctx.beginPath();
      let started = false;
      for (const [lon, lat] of segment) {
        const { x, y } = geoToCanvas(
          lat,
          lon,
          centerLat,
          centerLon,
          radius,
          cx,
          cy,
          RADAR_RADIUS
        );
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Cardinal labels
    ctx.fillStyle = "rgba(0, 220, 0, 0.7)";
    ctx.font = "13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("N", cx, cy - RADAR_RADIUS - 6);
    ctx.fillText("S", cx, cy + RADAR_RADIUS + 16);
    ctx.textAlign = "left";
    ctx.fillText("E", cx + RADAR_RADIUS + 6, cy + 4);
    ctx.textAlign = "right";
    ctx.fillText("W", cx - RADAR_RADIUS - 6, cy + 4);
    ctx.textAlign = "left";

    // Center dot
    ctx.beginPath();
    ctx.rect(cx - 5, cy - 5, 10, 10);
    ctx.fillStyle = "#cce64e";
    ctx.fill();

    // Plot flights
    flights.forEach((f) => {
      const hRad = (f.heading * Math.PI) / 180;
      const distFraction = Math.min(f.distance / radius, 1);
      const fx = cx + Math.sin(hRad) * distFraction * RADAR_RADIUS;
      const fy = cy - Math.cos(hRad) * distFraction * RADAR_RADIUS;

      const isHovered = hovered?.r === f.r;
      const isAirborne = typeof f.alt_baro === "number";

      // Blip
      ctx.beginPath();
      ctx.arc(fx, fy, isHovered ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isHovered
        ? "#ffffff"
        : isAirborne
        ? "#00ff44"
        : "#ff4444";
      ctx.fill();

      // Label
      ctx.fillStyle = isHovered ? "#ffffff" : "#00dd33";
      ctx.font = isHovered ? "bold 12px monospace" : "11px monospace";
      ctx.fillText(f.flight || f.r || "?", fx + 8, fy - 4);
    });
  }, [flights, hovered, radius, coastlineSegments, centerLat, centerLon]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    let foundFlight: Flight | null = null;
    let foundPos: { x: number; y: number } | null = null;

    for (const f of flightsRef.current) {
      const hRad = (f.heading * Math.PI) / 180;
      const distFraction = Math.min(f.distance / radius, 1);
      const fx = cx + Math.sin(hRad) * distFraction * RADAR_RADIUS;
      const fy = cy - Math.cos(hRad) * distFraction * RADAR_RADIUS;
      if (Math.hypot(mx - fx, my - fy) < 10) {
        foundFlight = f;
        foundPos = { x: fx, y: fy };
        break;
      }
    }

    setHovered(foundFlight);
    setHoveredPos(foundPos);
  };

  return (
    <div className="app">
      <button className="settings-btn" onClick={openSettings} title="Settings">
        ⚙
      </button>
      <h1>✈ Planes Radar</h1>
      <p className="subtitle">
        Centre: {centerLat}°N {centerLon}°E · Radius: {radius} km
        {lastUpdate && <> · Updated: {lastUpdate}</>}
        {error && <span className="error"> · Error: {error}</span>}
      </p>
      <div className="radar-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHovered(null);
            setHoveredPos(null);
          }}
        />
        {hovered &&
          hoveredPos &&
          (() => {
            const offset = 12;
            const onRight = hoveredPos.x <= CANVAS_SIZE / 2;
            return (
              <div
                className="tooltip"
                style={
                  onRight
                    ? {
                        left: hoveredPos.x + offset,
                        top: hoveredPos.y - offset,
                      }
                    : {
                        right: CANVAS_SIZE - hoveredPos.x + offset,
                        top: hoveredPos.y - offset,
                      }
                }
              >
                <strong>{hovered.flight || "—"}</strong>
                <br />
                {hovered.desc || "—"}
                <br />
                Reg: {hovered.r || "—"}
                <br />
                Distance: {hovered.distance} km <br />
                Heading: {hovered.heading}°
              </div>
            );
          })()}
      </div>
      {flights.length > 0 && (
        <table className="flight-table">
          <thead>
            <tr>
              <th>Flight</th>
              <th>Reg</th>
              <th>Type</th>
              <th>Distance</th>
              <th>Heading</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((f) => (
              <tr
                key={f.r}
                className={hovered?.r === f.r ? "active" : ""}
                onMouseEnter={() => setHovered(f)}
                onMouseLeave={() => setHovered(null)}
              >
                <td>{f.flight || "—"}</td>
                <td>{f.r || "—"}</td>
                <td>{f.desc || "—"}</td>
                <td>{f.distance} km</td>
                <td>{f.heading}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showSettings && (
        <div className="dialog-overlay" onClick={() => setShowSettings(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>⚙ Settings</h2>

            <div className="dialog-section">
              <button
                className="radar-btn locate-btn"
                onClick={locate}
                disabled={locating}
              >
                {locating ? "⟳ Locating…" : "◎ Use My Location"}
              </button>
            </div>

            <div className="dialog-section">
              <label>Latitude</label>
              <input
                className="radar-input"
                type="number"
                value={draftLat}
                onChange={(e) => setDraftLat(e.target.value)}
                step="0.0001"
              />
              <label>Longitude</label>
              <input
                className="radar-input"
                type="number"
                value={draftLon}
                onChange={(e) => setDraftLon(e.target.value)}
                step="0.0001"
              />
            </div>

            <div className="dialog-section">
              <label>
                Radius: <span className="radius-value">{draftRadius} km</span>
              </label>
              <input
                className="radar-slider"
                type="range"
                min={10}
                max={250}
                value={draftRadius}
                onChange={(e) => setDraftRadius(Number(e.target.value))}
              />
              <div className="slider-labels">
                <span>10 km</span>
                <span>250 km</span>
              </div>
            </div>

            {geoError && <p className="error dialog-error">{geoError}</p>}

            <div className="dialog-actions">
              <button
                className="radar-btn"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button
                className="radar-btn radar-btn-primary"
                onClick={applySettings}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
