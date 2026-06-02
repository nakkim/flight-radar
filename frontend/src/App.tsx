import { useState, useEffect, useRef } from "react";
import "./App.css";
import { geoToCanvas } from "./utils/utils";
import SettingsDialog from "./components/SettingsDialog";
import FlightsTable from "./components/FlightsTable";
import RadarScreen from "./components/RadarScreen";
import useFlightTrail from "./hooks/useFlightTrail";

export interface Flight {
  lat: number;
  lon: number;
  r: string;
  desc: string;
  flight: string | null;
  distance: number;
  heading: number;
  mag_heading: number;
  true_heading: number;
  track: number;
  alt_baro: number | "ground";
  baro_rate: number;
  ias: number;
  tas: number;
}

export interface FlightRoute {
  origin: string | null;
  destination: string | null;
  routeText: string | null;
}

const DEFAULT_LAT = localStorage.getItem("DEFAULT_LAT")
  ? parseFloat(localStorage.getItem("DEFAULT_LAT")!)
  : 60.1699;
const DEFAULT_LON = localStorage.getItem("DEFAULT_LON")
  ? parseFloat(localStorage.getItem("DEFAULT_LON")!)
  : 24.9384;
const DEFAULT_RADIUS = localStorage.getItem("DEFAULT_RADIUS")
  ? parseFloat(localStorage.getItem("DEFAULT_RADIUS")!)
  : 250;

const CANVAS_SIZE = 600;
const RADAR_RADIUS = CANVAS_SIZE / 2 - 20;
const RINGS = 4;

const SHOW_TABLE =
  localStorage.getItem("SHOW_TABLE") === "false" ? false : true;

const App = () => {
  const flightsRef = useRef<Flight[]>([]);
  const hoveredRef = useRef<Flight | null>(null);
  const selectedRef = useRef<Flight | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [hovered, setHovered] = useState<Flight | null>(null);
  const [selected, setSelected] = useState<Flight | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [centerLat, setCenterLat] = useState(DEFAULT_LAT);
  const [centerLon, setCenterLon] = useState(DEFAULT_LON);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [showSettings, setShowSettings] = useState(false);
  const [draftLat, setDraftLat] = useState(String(DEFAULT_LAT));
  const [draftLon, setDraftLon] = useState(String(DEFAULT_LON));
  const [draftRadius, setDraftRadius] = useState(DEFAULT_RADIUS);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(SHOW_TABLE);
  const routeCacheRef = useRef<Map<string, FlightRoute>>(new Map());
  const [hoveredRoute, setHoveredRoute] = useState<FlightRoute | null>(null);

  const [coastlineSegments, setCoastlineSegments] = useState<
    [number, number][][]
  >([]);

  const flightTrailRef = useFlightTrail(selected);

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

  useEffect(() => {
    flightsRef.current = flights;
  }, [flights]);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (!hovered?.r && !selected?.r) {
      // TODO Fix this
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHoveredRoute(null);
      return;
    }
    const activeR = hovered?.r ?? selected?.r;
    const ident = activeR!.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const cached = routeCacheRef.current.get(ident);
    if (cached) {
      setHoveredRoute(cached);
      return;
    }
    setHoveredRoute(null);
    fetch(`http://localhost:3000/flight-info/${ident}`)
      .then((r) => r.json())
      .then((data: FlightRoute) => {
        routeCacheRef.current.set(ident, data);
        if (
          hoveredRef.current?.r === activeR ||
          selectedRef.current?.r === activeR
        ) {
          setHoveredRoute(data);
        }
      })
      .catch(() => {
        /* silently ignore */
      });
  }, [hovered?.r, selected?.r]);

  const fetchFlights = async (lat: number, lon: number, rad: number) => {
    try {
      const res = await fetch(
        `http://localhost:3000/search?lat=${lat}&lon=${lon}&radius=${rad}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Flight[] = await res.json();
      setFlights(data);
      if (hoveredRef.current) {
        const updated = data.find((f) => f.r === hoveredRef.current!.r);
        setHovered(updated ?? null);
      }
      if (selectedRef.current) {
        const updated = data.find((f) => f.r === selectedRef.current!.r);
        if (updated) {
          const trail = flightTrailRef.current.get(updated.r) ?? [];
          const last = trail[trail.length - 1];
          if (!last || last[0] !== updated.lat || last[1] !== updated.lon) {
            flightTrailRef.current.set(updated.r, [
              ...trail,
              [updated.lat, updated.lon],
            ]);
          }
        }
        setSelected(updated ?? null);
      }
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
    localStorage.setItem("DEFAULT_LAT", String(lat));
    localStorage.setItem("DEFAULT_LON", String(lon));
    localStorage.setItem("DEFAULT_RADIUS", String(draftRadius));
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

    // Draw selected flight trail
    if (selected) {
      const trail = flightTrailRef.current.get(selected.r);
      if (trail && trail.length >= 2) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, RADAR_RADIUS, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let trailStarted = false;
        for (const [lat, lon] of trail) {
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
          if (!trailStarted) {
            ctx.moveTo(x, y);
            trailStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // Plot flights
    flights.forEach((f) => {
      const hRad = (f.heading * Math.PI) / 180;
      const distFraction = Math.min(f.distance / radius, 1);
      const fx = cx + Math.sin(hRad) * distFraction * RADAR_RADIUS;
      const fy = cy - Math.cos(hRad) * distFraction * RADAR_RADIUS;

      const isHovered = hovered?.r === f.r || selected?.r === f.r;
      const isAirborne = typeof f.alt_baro === "number";
      const color = isHovered ? "#ffffff" : isAirborne ? "#00ff44" : "#ff4444";
      const scale = isHovered ? 1.4 : 1;

      // Aircraft symbol rotated to true heading
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(((f.true_heading ?? f.track) * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Fuselage (nose up = negative y)
      ctx.moveTo(0, -8);
      ctx.lineTo(1.5, -2);
      // Right wing
      ctx.lineTo(8, 2);
      ctx.lineTo(7, 4);
      ctx.lineTo(1.5, 2);
      // Right tail fin
      ctx.lineTo(2.5, 8);
      ctx.lineTo(0, 7);
      // Left tail fin
      ctx.lineTo(-2.5, 8);
      ctx.lineTo(-1.5, 2);
      // Left wing
      ctx.lineTo(-7, 4);
      ctx.lineTo(-8, 2);
      ctx.lineTo(-1.5, -2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Label
      ctx.fillStyle = isHovered ? "#ffffff" : "#00dd33";
      ctx.font = isHovered ? "bold 12px monospace" : "11px monospace";
      ctx.fillText(f.flight || f.r || "?", fx + 8, fy - 4);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    flights,
    hovered,
    selected,
    radius,
    coastlineSegments,
    centerLat,
    centerLon,
  ]);

  const findFlightAtCursor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    for (const f of flightsRef.current) {
      const hRad = (f.heading * Math.PI) / 180;
      const distFraction = Math.min(f.distance / radius, 1);
      const fx = cx + Math.sin(hRad) * distFraction * RADAR_RADIUS;
      const fy = cy - Math.cos(hRad) * distFraction * RADAR_RADIUS;
      if (Math.hypot(mx - fx, my - fy) < 10) return f;
    }
    return null;
  };

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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const flight = findFlightAtCursor(e);
    setSelected((prev) => (prev?.r === flight?.r ? null : flight));
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
      <RadarScreen
        hovered={hovered}
        hoveredPos={hoveredPos}
        hoveredRoute={hoveredRoute}
        canvasRef={canvasRef}
        handleMouseMove={handleMouseMove}
        handleCanvasClick={handleCanvasClick}
        setHovered={setHovered}
        setHoveredPos={setHoveredPos}
        CANVAS_SIZE={CANVAS_SIZE}
      />
      <button
        className="expand-btn"
        title="Expand flights table"
        onClick={() => {
          localStorage.setItem("SHOW_TABLE", String(!showTable));
          setShowTable(!showTable);
        }}
      >
        {showTable ? "▲ Show all flights" : "▼ Show all flights"}
      </button>
      {showTable && flights.length > 0 && (
        <FlightsTable
          flights={flights}
          hovered={hovered}
          selected={selected}
          setHovered={setHovered}
          setSelected={setSelected}
        />
      )}
      {showSettings && (
        <SettingsDialog
          locate={locate}
          locating={locating}
          geoError={geoError}
          draftLat={draftLat}
          setDraftLat={setDraftLat}
          draftLon={draftLon}
          setDraftLon={setDraftLon}
          draftRadius={draftRadius}
          setDraftRadius={setDraftRadius}
          applySettings={applySettings}
          setShowSettings={setShowSettings}
          settings={{
            lat: 0,
            lon: 0,
            radius: 0,
          }}
        />
      )}
    </div>
  );
};

export default App;
