import { useRef, useState, useEffect } from "react";
import type { Flight, FlightRoute } from "../types/types";

const useFlightRoute = (
  hovered: Flight | null,
  selected: Flight | null
): FlightRoute | null => {
  const routeCacheRef = useRef<Map<string, FlightRoute>>(new Map());
  const [route, setRoute] = useState<FlightRoute | null>(null);

  useEffect(() => {
    const activeR = hovered?.flight ?? selected?.flight;

    if (!activeR) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoute(null);
      return;
    }

    const ident = activeR.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const cached = routeCacheRef.current.get(ident);

    if (cached) {
      setRoute(cached);
      return;
    }

    setRoute(null);

    let cancelled = false;

    fetch(`/api/flight-info/${ident}`)
      .then((r) => r.json())
      .then((data: FlightRoute) => {
        routeCacheRef.current.set(ident, data);
        if (!cancelled) {
          setRoute(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoute(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hovered?.flight, selected?.flight]);

  return route;
};

export default useFlightRoute;
