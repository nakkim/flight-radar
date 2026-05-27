# Planes Radar Backend

A small Node.js/Express backend API that fetches nearby aircraft from an upstream data source and enriches the results with:

- Distance (km) from a query point (Haversine)
- Heading (bearing in degrees) from the query point

## Features

- `GET /` root endpoint with API info
- `GET /search` endpoint for nearby flight lookup
- Input validation for coordinates and radius
- Upstream error handling (`502` for upstream failures)
- Unit tests for geospatial utility functions

## Tech Stack

- Node.js
- Express
- Morgan (request logging in non-production)
- Jest (tests)

## Project Structure

```text
.
├── package.json
└── src
    ├── app.js
    └── utils
        ├── utils.js
        └── utils.test.js
```

## Installation

```bash
npm install
```

## Available Scripts

- `npm start` runs the server with Node
- `npm run dev` runs the server with Nodemon
- `npm test` runs Jest tests

## Running Locally

```bash
npm run dev
```

## API Endpoints

### `GET /`

Returns API info and available endpoint(s).

Example response:

```json
{
  "message": "Flight Radar API",
  "endpoints": {
    "search": "/search?lat={lat}&lon={lon}&radius={radius}"
  }
}
```

### `GET /search?lat={lat}&lon={lon}&radius={radius}`

Fetches nearby aircraft from `https://api.airplanes.live` and returns a filtered/sorted list.

Query parameters:

- `lat` (required): number between `-90` and `90`
- `lon` (required): number between `-180` and `180`
- `radius` (required): positive number (km)

Example request:

```bash
curl "http://localhost:3000/search?lat=60.1699&lon=24.9384&radius=50"
```

Example response item:

```json
[
  {
    "lat": 60.22,
    "lon": 24.91,
    "r": "abcd12",
    "desc": "Airbus A320",
    "true_heading": 170,
    "ias": 250,
    "tas": 430,
    "alt_baro": 12000,
    "alt_geo": 12100,
    "flight": "ABC123",
    "distance": 5.8,
    "heading": 187
  }
]
```

Notes:

- Results are filtered to include only aircraft entries with `lat`, `lon`, `ias`, and `tas`.
- `distance` is rounded to 1 decimal place.
- `heading` is rounded to nearest integer.
- Results are sorted by `distance` ascending.

## Error Handling

Common errors:

- `400` when query params are missing or invalid
- `502` when upstream API is unavailable or returns an error

Example `400` response:

```json
{ "error": "lat, lon and radius are required query parameters" }
```

Example `502` response:

```json
{ "error": "Failed to reach upstream API", "details": "..." }
```

## License

ISC
