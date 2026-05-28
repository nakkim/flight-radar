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
      .map(({ lat, lon, r, desc, flight, true_heading, ias, tas, alt_baro, alt_geo }) => ({
        lat,
        lon,
        r,
        desc,
        true_heading,
        ias,
        tas,
        alt_baro,
        alt_geo,
        flight: flight ? flight.trim() : flight,
        distance: Math.round(haversineDistance(parsedLat, parsedLon, lat, lon) * 10) / 10,
        heading: Math.round(bearing(parsedLat, parsedLon, lat, lon)),
      }))
      .filter(f => f.distance <= parsedRadius)
      .filter(f => f.r  !== 'TWR')
      .sort((a, b) => a.distance - b.distance);
    res.json(flights);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach upstream API', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
