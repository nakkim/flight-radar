import { useRef, useState, useEffect } from "react";
import type { Flight, FlightRoute } from "../App";

const useFlightRoute = (
  hovered: Flight | null,
  selected: Flight | null
): FlightRoute | null => {
  const routeCacheRef = useRef<Map<string, FlightRoute>>(new Map());
  const [route, setRoute] = useState<FlightRoute | null>(null);

  useEffect(() => {
    const activeR = hovered?.r ?? selected?.r;

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

    fetch(`http://localhost:3000/flight-info/${ident}`)
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
  }, [hovered?.r, selected?.r]);

  return route;
};

export default useFlightRoute;
