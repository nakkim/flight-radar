import { useState, useEffect } from "react";
import type { Airport } from "../types/types";

const useAirports = () => {
  const [airports, setAirports] = useState<Airport[]>([]);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch("/airports.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Airport[] = await response.json();
        setAirports(data);
      } catch (error) {
        console.error("Failed to fetch airports:", error);
      }
    };

    fetchAirports();
  }, []);

  return airports;
};

export default useAirports;
