import { useState, useEffect, useRef, type CSSProperties } from "react";
import SettingsDialog from "./components/SettingsDialog";
import FlightsTable from "./components/FlightsTable";
import RadarScreen from "./components/RadarScreen";
import useFlightTrail from "./hooks/useFlightTrail";
import useFlightRoute from "./hooks/useFlightRoute";
import useCoastlineSegments from "./hooks/useCoastLineSegments";
import useFlights from "./hooks/useFlights";
import useWindowWidth from "./hooks/useWindowWidth";
import useDrawRadar from "./hooks/useDrawRadar";
import { SettingsIcon } from "./assets/icons";
import InfoDialog from "./components/InfoDialog";

console.log(`App version: ${APP_VERSION}`);

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

export const POLL_INTERVAL_MS = 10000;

const SHOW_TABLE =
  localStorage.getItem("SHOW_TABLE") === "false" ? false : true;

const styles: Record<string, CSSProperties> = {
  app: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px",
    gap: "16px",
  },
  settingsButton: {
    position: "fixed",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    color: "#00ff66",
    width: "42px",
    height: "42px",
    cursor: "pointer",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s ease",
  },
  settingsButtonHover: {
    color: "#ffffff",
  },
  title: {
    fontSize: "1.6rem",
    color: "#00ff66",
    letterSpacing: "2px",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.8rem",
    color: "rgba(0, 200, 60, 0.7)",
    marginTop: "2px",
  },
  error: {
    color: "#ff4444",
  },
  expandButton: {
    fontFamily: "monospace",
    background: "none",
    border: "none",
    color: "rgba(0, 200, 60, 0.7)",
    height: "42px",
    cursor: "pointer",
    justifyContent: "center",
    padding: "0 12px",
    transition: "color 0.15s ease",
  },
  buttonHover: {
    color: "#ffffff",
  },
  version: {
    textAlign: "center",
    fontSize: "0.6rem",
    margin: "4px 0",
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};

const App = () => {
  const hoveredRef = useRef<Flight | null>(null);
  const selectedRef = useRef<Flight | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [isSettingsButtonHovered, setIsSettingsButtonHovered] = useState(false);
  const [isbuttonHovered, setIsbuttonHovered] = useState(false);
  const [isInfoButtonHovered, setIsInfoButtonHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const hoveredRoute = useFlightRoute(hovered, selected);
  const coastlineSegments = useCoastlineSegments();
  const flightTrailRef = useFlightTrail(selected);

  const { flights, flightsRef, error, lastUpdate, refetch } = useFlights(
    centerLat,
    centerLon,
    radius
  );

  const windowWidth = useWindowWidth();
  const CANVAS_SIZE = Math.min(600, windowWidth - 40);
  const RADAR_RADIUS = CANVAS_SIZE / 2 - 20;
  const RINGS = 4;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHovered((currentHovered) => {
      if (!currentHovered) return null;

      const updated = flights.find((f) => f.r === currentHovered.r);

      return updated ?? null;
    });
  }, [flights]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected((currentSelected) => {
      if (!currentSelected) return null;

      const updated = flights.find((f) => f.r === currentSelected.r);

      return updated ?? null;
    });
  }, [flights]);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) await refetch();
    })();
    const interval = setInterval(() => {
      if (mounted) refetch();
    }, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useDrawRadar({
    canvasRef,
    flights,
    hovered,
    selected,
    radius,
    CANVAS_SIZE,
    RADAR_RADIUS,
    RINGS,
    flightTrailRef,
    coastlineSegments,
    centerLat,
    centerLon,
  });

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
    <div style={styles.app}>
      <button
        style={{
          ...styles.settingsButton,
          ...(isSettingsButtonHovered ? styles.settingsButtonHover : {}),
        }}
        onClick={openSettings}
        onMouseEnter={() => setIsSettingsButtonHovered(true)}
        onMouseLeave={() => setIsSettingsButtonHovered(false)}
        title="Settings"
      >
        <SettingsIcon style={{ width: "1.6rem", height: "1.6rem" }} />
      </button>
      <h1 style={styles.title}>✈ Flight Radar</h1>
      <p style={styles.subtitle}>
        Centre: {centerLat}°N {centerLon}°E · Radius: {radius} km
        {lastUpdate && <> · Updated: {lastUpdate}</>}
        {error && <span style={styles.error}> · Error: {error}</span>}
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
        style={{
          ...styles.expandButton,
          ...(isbuttonHovered ? styles.buttonHover : {}),
        }}
        title="Expand flights table"
        onMouseEnter={() => setIsbuttonHovered(true)}
        onMouseLeave={() => setIsbuttonHovered(false)}
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
          maxWidth={windowWidth > 700 ? "700px" : "100%"}
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
            lat: centerLat,
            lon: centerLon,
            radius: radius,
          }}
        />
      )}
      <footer style={styles.footer}>
        <p style={styles.version}>Version: v{APP_VERSION}</p>
        <button
          style={{
            ...styles.expandButton,
            ...(isInfoButtonHovered ? styles.buttonHover : {}),
            height: "18px",
          }}
          title="About this app"
          onMouseEnter={() => setIsInfoButtonHovered(true)}
          onMouseLeave={() => setIsInfoButtonHovered(false)}
          onClick={() => setShowInfo(true)}
        >
          About
        </button>
      </footer>
      {showInfo && <InfoDialog setShowInfo={setShowInfo} />}
    </div>
  );
};

export default App;
