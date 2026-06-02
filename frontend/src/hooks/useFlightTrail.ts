import { useEffect, useRef } from "react";
import type { Flight } from "../App";

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

  return flightTrailRef;
};

export default useFlightTrail;
