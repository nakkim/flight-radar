import { useState, useEffect } from "react";

const useCoastlineSegments = () => {
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

  return coastlineSegments;
};

export default useCoastlineSegments;
