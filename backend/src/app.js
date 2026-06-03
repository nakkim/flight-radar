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
      flightInfo: '/flight-info/{ident}',
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

// Simple in-memory cache: ident -> { origin, destination, routeText, cachedAt }
const flightInfoCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

app.get('/flight-info/:ident', async (req, res) => {
  const ident = req.params.ident.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  const cached = flightInfoCache.get(ident);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const response = await fetch(`https://uk.flightaware.com/live/flight/${ident}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) {
      return res.status(502).json({ error: `FlightAware error: ${response.status}` });
    }
    const html = await response.text();

    const originMatch = html.match(/<meta\s+name="origin"\s+content="([^"]+)"/);
    const destinationMatch = html.match(/<meta\s+name="destination"\s+content="([^"]+)"/);
    const routeTextMatch = html.match(/<meta\s+name="twitter:description"\s+content="Track [^"]+ flight from ([^"]+)"/);

    const data = {
      origin: originMatch ? originMatch[1] : null,
      destination: destinationMatch ? destinationMatch[1] : null,
      routeText: routeTextMatch ? routeTextMatch[1] : null,
    };

    flightInfoCache.set(ident, { data, cachedAt: Date.now() });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch flight info', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
