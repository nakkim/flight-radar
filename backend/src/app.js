const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { haversineDistance, bearing } = require('./utils/utils');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  // list available endpoints
  res.json({
    message: 'Flight Radar API',
    endpoints: {
      search: '/search?lat={lat}&lon={lon}&radius={radius}',
      flightInfo: '/flight-info/{callsign}',
    },
  });
});

// GET /search?lat=60.1699&lon=24.9384&radius=50
app.get('/search', async (req, res) => {
  const { lat, lon, radius } = req.query;

  if (lat === undefined || lon === undefined || radius === undefined) {
    return res.status(400).json({ error: 'lat, lon and radius are required query parameters' });
  }

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  const parsedRadius = parseFloat(radius);

  if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
    return res.status(400).json({ error: 'lat must be a number between -90 and 90' });
  }
  if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
    return res.status(400).json({ error: 'lon must be a number between -180 and 180' });
  }
  if (isNaN(parsedRadius) || parsedRadius <= 0) {
    return res.status(400).json({ error: 'radius must be a positive number' });
  }

  try {
    const upstreamUrl = `https://api.airplanes.live/v2/point/${parsedLat}/${parsedLon}/${parsedRadius}`;
    const response = await fetch(upstreamUrl);

    if (!response.ok) {
      return res.status(502).json({ error: `Upstream API error: ${response.status} ${response.statusText}` });
    }

    const data = await response.json();
    const flights = (data.ac || [])
      .filter(({ lat, lon, ias, tas }) => lat != null && lon != null)
      .map(({ lat, lon, r, desc, flight, true_heading, ias, track, tas, alt_baro, alt_geo, mag_heading, baro_rate, geom_rate }) => ({
        lat,
        lon,
        r,
        desc,
        true_heading,
        track,
        ias,
        tas,
        alt_baro,
        alt_geo,
        flight: flight ? flight.trim() : flight,
        distance: Math.round(haversineDistance(parsedLat, parsedLon, lat, lon) * 10) / 10,
        heading: Math.round(bearing(parsedLat, parsedLon, lat, lon)),
        mag_heading,
        baro_rate,
        geom_rate
      }))
      .filter(f => f.distance <= parsedRadius)
      .filter(f => f.r !== 'TWR')
      .filter(f => f.r)
      .sort((a, b) => a.distance - b.distance);
    res.json(flights);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach upstream API', details: err.message });
  }
});

// Simple in-memory cache: callsign -> { origin, destination, routeText, cachedAt }
const flightInfoCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

app.get('/flight-info/:callsign', async (req, res) => {
  const callsign = req.params.callsign.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  const cached = flightInfoCache.get(callsign);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  const data = await fetch(`https://api.adsbdb.com/v0/callsign/${callsign}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`ADS-B DB API error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(json => {
      const response = json.response.flightroute;
      const origin = response.origin.icao_code || null;
      const destination = response.destination.icao_code || null;
      const routeText = response.origin.name && response.destination.name ? `${response.origin.name} -> ${response.destination.name}` : null;

      const data = { origin, destination, routeText };
      flightInfoCache.set(callsign, { data, cachedAt: Date.now() });
      return data;
    })
    .catch(err => {
      console.error(`Error fetching flight info for ${callsign}:`, err);
      return { origin: null, destination: null, routeText: null };
    });

  return res.json(data);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
