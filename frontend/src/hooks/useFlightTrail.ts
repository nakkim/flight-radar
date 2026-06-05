import { useEffect, useRef } from "react";
import type { Flight } from "../App";

const MAX_TRAIL_POINTS = 120;

const useFlightTrail = (selected: Flight | null) => {
  const flightTrailRef = useRef<Map<string, [number, number][]>>(new Map());

  // Manage flight trail: start fresh on new selection, clear on deselect
  useEffect(() => {
    flightTrailRef.current.clear();
    if (selected) {
      flightTrailRef.current.set(selected.r, [[selected.lat, selected.lon]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.r]);

  // Append live points for the selected flight to build a visible trail.
  useEffect(() => {
    if (!selected) return;

    const trail = flightTrailRef.current.get(selected.r) ?? [];
    const lastPoint = trail[trail.length - 1];
    const nextPoint: [number, number] = [selected.lat, selected.lon];

    const isSameAsLast =
      lastPoint &&
      lastPoint[0] === nextPoint[0] &&
      lastPoint[1] === nextPoint[1];

    if (isSameAsLast) return;

    const updatedTrail = [...trail, nextPoint].slice(-MAX_TRAIL_POINTS);
    flightTrailRef.current.set(selected.r, updatedTrail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.r, selected?.lat, selected?.lon]);

  return flightTrailRef;
};

export default useFlightTrail;
