import { describe, expect, test } from "vitest";
import {
  bearingRad,
  decodeHTMLEntities,
  geoToCanvas,
  haversineKm,
} from "./utils";

describe("haversineKm", () => {
  test("returns 0 for identical coordinates", () => {
    expect(haversineKm(60.1699, 24.9384, 60.1699, 24.9384)).toBeCloseTo(0, 8);
  });

  test("is symmetric", () => {
    const d1 = haversineKm(60.1699, 24.9384, 59.437, 24.7536);
    const d2 = haversineKm(59.437, 24.7536, 60.1699, 24.9384);

    expect(d1).toBeCloseTo(d2, 8);
  });

  test("calculates a known distance (Helsinki to Tallinn ~82km)", () => {
    const d = haversineKm(60.1699, 24.9384, 59.437, 24.7536);

    expect(d).toBeGreaterThan(80);
    expect(d).toBeLessThan(90);
  });
});

describe("bearingRad", () => {
  test("returns approximately 0 radians for due north", () => {
    const b = bearingRad(0, 0, 1, 0);
    expect(b).toBeCloseTo(0, 6);
  });

  test("returns approximately PI/2 radians for due east", () => {
    const b = bearingRad(0, 0, 0, 1);
    expect(b).toBeCloseTo(Math.PI / 2, 6);
  });

  test("returns approximately PI radians for due south", () => {
    const b = bearingRad(1, 0, 0, 0);
    expect(Math.abs(b)).toBeCloseTo(Math.PI, 6);
  });
});

describe("geoToCanvas", () => {
  const cLat = 60.1699;
  const cLon = 24.9384;
  const radiusKm = 100;
  const cx = 300;
  const cy = 300;
  const radarRadius = 280;

  test("maps center point to canvas center", () => {
    const p = geoToCanvas(
      cLat,
      cLon,
      cLat,
      cLon,
      radiusKm,
      cx,
      cy,
      radarRadius
    );

    expect(p.x).toBeCloseTo(cx, 8);
    expect(p.y).toBeCloseTo(cy, 8);
  });

  test("maps eastward point to the right side of center", () => {
    const p = geoToCanvas(
      cLat,
      cLon + 0.1,
      cLat,
      cLon,
      radiusKm,
      cx,
      cy,
      radarRadius
    );

    expect(p.x).toBeGreaterThan(cx);
  });

  test("maps northward point above center", () => {
    const p = geoToCanvas(
      cLat + 0.1,
      cLon,
      cLat,
      cLon,
      radiusKm,
      cx,
      cy,
      radarRadius
    );

    expect(p.y).toBeLessThan(cy);
  });
});

describe("decodeHTMLEntities", () => {
  test("decodes supported entities", () => {
    const text =
      "Tom &amp; Jerry &lt;cartoon&gt; &quot;fun&quot; &#39;yes&#39;";

    expect(decodeHTMLEntities(text)).toBe(
      "Tom & Jerry <cartoon> \"fun\" 'yes'"
    );
  });

  test("leaves unsupported entities unchanged", () => {
    expect(decodeHTMLEntities("Price: &euro; 10")).toBe("Price: &euro; 10");
  });
});
