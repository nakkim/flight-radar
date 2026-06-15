import { useEffect, type RefObject } from "react";
import { geoToCanvas } from "../utils/utils";
import type { Airport, Flight } from "../types/types";

interface UseDrawRadarParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  flights: Flight[];
  hovered: Flight | null;
  selected: Flight | null;
  radius: number;
  coastlineSegments: [number, number][][];
  airports: Airport[];
  centerLat: number;
  centerLon: number;
  CANVAS_SIZE: number;
  RADAR_RADIUS: number;
  RINGS: number;
  flightTrailRef: RefObject<Map<string, [number, number][]>>;
  darkMode: boolean;
}

const useDrawRadar = ({
  canvasRef,
  flights,
  hovered,
  selected,
  radius,
  coastlineSegments,
  airports,
  centerLat,
  centerLon,
  CANVAS_SIZE,
  RADAR_RADIUS,
  RINGS,
  flightTrailRef,
  darkMode,
}: UseDrawRadarParams) => {
  // Draw radar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    const c = darkMode
      ? {
          bg: "#020f02",
          ring: "rgba(0, 180, 0, 0.3)",
          ringLabel: "rgba(0, 180, 0, 0.5)",
          crosshair: "rgba(0, 180, 0, 0.25)",
          coast: "rgba(0, 200, 80, 0.55)",
          cardinal: "rgba(0, 220, 0, 0.7)",
          centerDot: "#cce64e",
          airport: "rgba(255, 255, 255, 0.8)",
          airportLabel: "rgba(255, 255, 255, 0.9)",
          trail: "rgba(255, 255, 255, 0.75)",
          flightAirborne: "#00ff44",
          flightGround: "#ff4444",
          flightHovered: "#ffffff",
          label: "#00dd33",
          labelHovered: "#ffffff",
        }
      : {
          bg: "#eaf5ea",
          ring: "rgba(0, 110, 40, 0.25)",
          ringLabel: "rgba(0, 100, 30, 0.55)",
          crosshair: "rgba(0, 100, 30, 0.2)",
          coast: "rgba(0, 110, 40, 0.6)",
          cardinal: "rgba(0, 110, 40, 0.75)",
          centerDot: "#2d7a1a",
          airport: "rgba(40, 40, 40, 0.8)",
          airportLabel: "rgba(30, 30, 30, 0.9)",
          trail: "rgba(20, 20, 20, 0.6)",
          flightAirborne: "#006622",
          flightGround: "#cc2200",
          flightHovered: "#111111",
          label: "#005522",
          labelHovered: "#111111",
        };

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Rings
    for (let i = 1; i <= RINGS; i++) {
      const r = (RADAR_RADIUS / RINGS) * i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = c.ring;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ring label (distance)
      const ringKm = Math.round((radius / RINGS) * i);
      ctx.fillStyle = c.ringLabel;
      ctx.font = "11px monospace";
      ctx.fillText(`${ringKm}km`, cx + 4, cy - r + 14);
    }

    // Cross-hairs
    ctx.strokeStyle = c.crosshair;
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
    ctx.strokeStyle = c.coast;
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
    ctx.fillStyle = c.cardinal;
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
    ctx.fillStyle = c.centerDot;
    ctx.fill();

    // Airport markers
    airports.forEach((a) => {
      const { x, y } = geoToCanvas(
        a.latitude,
        a.longitude,
        centerLat,
        centerLon,
        radius,
        cx,
        cy,
        RADAR_RADIUS
      );
      ctx.beginPath();
      ctx.rect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = c.airport;
      ctx.fill();

      // Add icao code label if there's room
      if (Math.hypot(x - cx, y - cy) < RADAR_RADIUS - 20) {
        ctx.fillStyle = c.airportLabel;
        ctx.font = "10px monospace";
        ctx.fillText(a.icao_code, x + 12, y + 4);
      }
    });

    // Draw selected flight trail
    if (selected) {
      const trail = flightTrailRef.current.get(selected.r);
      if (trail && trail.length >= 2) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, RADAR_RADIUS, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = c.trail;
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
      const color = isHovered
        ? c.flightHovered
        : isAirborne
          ? c.flightAirborne
          : c.flightGround;
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
      ctx.fillStyle = isHovered ? c.labelHovered : c.label;
      ctx.font = isHovered ? "bold 12px monospace" : "11px monospace";
      ctx.fillText(f.flight || f.r || "?", fx + 8, fy - 4);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canvasRef,
    flights,
    hovered,
    selected,
    radius,
    flightTrailRef,
    coastlineSegments,
    centerLat,
    centerLon,
    CANVAS_SIZE,
    RADAR_RADIUS,
    RINGS,
    darkMode,
  ]);
};

export default useDrawRadar;
