const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const bearingRad = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  return Math.atan2(
    Math.sin(Δλ) * Math.cos(φ2),
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  );
};

const geoToCanvas = (
  lat: number,
  lon: number,
  cLat: number,
  cLon: number,
  radiusKm: number,
  cx: number,
  cy: number,
  RADAR_RADIUS: number
): { x: number; y: number } => {
  const dist = haversineKm(cLat, cLon, lat, lon);
  const bear = bearingRad(cLat, cLon, lat, lon);
  const f = dist / radiusKm;
  return {
    x: cx + Math.sin(bear) * f * RADAR_RADIUS,
    y: cy - Math.cos(bear) * f * RADAR_RADIUS,
  };
};

export { haversineKm, bearingRad, geoToCanvas };
