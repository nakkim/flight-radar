import { useState, useEffect } from "react";
import { deserialize } from "flatgeobuf/lib/mjs/geojson.js";

const KM_PER_DEG_LAT = 111.32;

function bboxFromCircle(
  centerLat: number,
  centerLon: number,
  radiusKm: number
) {
  const deltaLat = radiusKm / KM_PER_DEG_LAT;
  const deltaLon =
    radiusKm / (KM_PER_DEG_LAT * Math.cos((centerLat * Math.PI) / 180));
  return {
    minX: Math.max(-180, centerLon - deltaLon),
    minY: Math.max(-90, centerLat - deltaLat),
    maxX: Math.min(180, centerLon + deltaLon),
    maxY: Math.min(90, centerLat + deltaLat),
  };
}

const useCoastlineSegments = (
  centerLat: number,
  centerLon: number,
  radiusKm: number
) => {
  const [coastlineSegments, setCoastlineSegments] = useState<
    [number, number][][]
  >([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const rect = bboxFromCircle(centerLat, centerLon, radiusKm);
      const segments: [number, number][][] = [];

      for await (const feature of deserialize("/ne_10m_coastline.fgb", rect)) {
        if (cancelled) return;
        const { type, coordinates } = feature.geometry as {
          type: string;
          coordinates: unknown;
        };

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

      if (!cancelled) setCoastlineSegments(segments);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [centerLat, centerLon, radiusKm]);

  return coastlineSegments;
};

export default useCoastlineSegments;
