import { useEffect, type RefObject } from "react";
import type { Flight } from "../App";
import { geoToCanvas } from "../utils/utils";

interface UseDrawRadarParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  flights: Flight[];
  hovered: Flight | null;
  selected: Flight | null;
  radius: number;
  coastlineSegments: [number, number][][];
  centerLat: number;
  centerLon: number;
  CANVAS_SIZE: number;
  RADAR_RADIUS: number;
  RINGS: number;
  flightTrailRef: RefObject<Map<string, [number, number][]>>;
}

const useDrawRadar = ({
  canvasRef,
  flights,
  hovered,
  selected,
  radius,
  coastlineSegments,
  centerLat,
  centerLon,
  CANVAS_SIZE,
  RADAR_RADIUS,
  RINGS,
  flightTrailRef,
}: UseDrawRadarParams) => {
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
  ]);
};

export default useDrawRadar;
