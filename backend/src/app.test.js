const request = require("supertest");
const app = require("./app");

describe("GET /", () => {
  test("returns API metadata", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Flight Radar API",
      endpoints: {
        search: "/search?lat={lat}&lon={lon}&radius={radius}",
        flightInfo: "/flight-info/{ident}",
      },
    });
  });
});

describe("GET /search validation", () => {
  test("returns 400 when query params are missing", async () => {
    const res = await request(app).get("/search");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required query parameters/i);
  });

  test("returns 400 for invalid lat", async () => {
    const res = await request(app).get("/search?lat=120&lon=24.93&radius=50");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/lat must be a number between -90 and 90/i);
  });

  test("returns 400 for invalid lon", async () => {
    const res = await request(app).get("/search?lat=60.16&lon=190&radius=50");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/lon must be a number between -180 and 180/i);
  });

  test("returns 400 for non-positive radius", async () => {
    const res = await request(app).get("/search?lat=60.16&lon=24.93&radius=0");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/radius must be a positive number/i);
  });
});

describe("GET /search upstream", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("returns 502 when upstream responds with non-ok status", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const res = await request(app).get("/search?lat=60.1699&lon=24.9384&radius=50");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(502);
    expect(res.body.error).toContain("Upstream API error");
  });

  test("returns transformed, filtered and sorted flights from mocked upstream payload", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ac: [
          {
            lat: 60.19,
            lon: 24.95,
            r: "FIN1",
            desc: "A320",
            flight: " FIN123 ",
            true_heading: 180,
            track: 179,
            ias: 260,
            tas: 430,
            alt_baro: 11000,
            alt_geo: 11100,
            mag_heading: 175,
            baro_rate: -128,
            geom_rate: -140,
          },
          {
            lat: 60.25,
            lon: 24.97,
            r: "FIN2",
            desc: "A321",
            flight: "FIN456",
            true_heading: 210,
            track: 211,
            ias: 250,
            tas: 420,
            alt_baro: 9000,
            alt_geo: 9050,
            mag_heading: 208,
            baro_rate: 64,
            geom_rate: 70,
          }
        ],
      }),
    });

    const res = await request(app).get("/search?lat=60.1699&lon=24.9384&radius=50");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.airplanes.live/v2/point/60.1699/24.9384/50"
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);

    expect(res.body[0]).toMatchObject({
      r: "FIN1",
      flight: "FIN123",
      desc: "A320",
      ias: 260,
      tas: 430,
    });
    expect(res.body[0]).toHaveProperty("distance");
    expect(res.body[0]).toHaveProperty("heading");

    expect(res.body[1]).toMatchObject({
      r: "FIN2",
      flight: "FIN456",
      desc: "A321",
    });

    expect(res.body[0].distance).toBeLessThanOrEqual(res.body[1].distance);
  });

  test("returns 502 when fetch throws", async () => {
    global.fetch.mockRejectedValue(new Error("network down"));

    const res = await request(app).get("/search?lat=60.1699&lon=24.9384&radius=50");

    expect(res.status).toBe(502);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: "Failed to reach upstream API",
        details: "network down",
      })
    );
  });
});

describe("GET /flight-info/:ident", () => {
  test("returns default null response", async () => {
    const res = await request(app).get("/flight-info/fin123");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      origin: null,
      destination: null,
      routeText: null,
    });
  });
});
