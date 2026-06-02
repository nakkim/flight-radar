import { useCallback, useEffect, useRef, useState } from "react";
import { POLL_INTERVAL_MS, type Flight } from "../App";

interface UseFlightsResult {
  flights: Flight[];
  flightsRef: React.MutableRefObject<Flight[]>;
  loading: boolean;
  error: string | null;
  lastUpdate: string;
  refetch: () => Promise<void>;
}

export default function useFlights(
  centerLat: number,
  centerLon: number,
  radius: number
): UseFlightsResult {
  const flightsRef = useRef<Flight[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    flightsRef.current = flights;
  }, [flights]);

  const fetchFlights = useCallback(async () => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        lat: String(centerLat),
        lon: String(centerLon),
        radius: String(radius),
      });

      const res = await fetch(`http://localhost:3000/search?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: Flight[] = await res.json();

      setFlights(data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }

      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [centerLat, centerLon, radius]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFlights();

    const interval = window.setInterval(() => {
      fetchFlights();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [fetchFlights]);

  return {
    flights,
    flightsRef,
    loading,
    error,
    lastUpdate,
    refetch: fetchFlights,
  };
}
