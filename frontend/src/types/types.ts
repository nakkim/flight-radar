export type Airport = {
  id: number;
  icao_code: string;
  name: string;
  city: string;
  country_code: string;
  country_name: string;
  continent: string;
  iata_code: string;
  latitude: number;
  longitude: number;
};

export interface Flight {
  lat: number;
  lon: number;
  r: string;
  desc: string;
  flight: string | null;
  distance: number;
  heading: number;
  mag_heading: number;
  true_heading: number;
  track: number;
  alt_baro: number | "ground";
  baro_rate: number;
  ias: number;
  tas: number;
}

export interface FlightRoute {
  origin: string | null;
  destination: string | null;
  routeText: string | null;
}
