const { haversineDistance, bearing } = require('./utils');

describe('haversineDistance', () => {
  test('returns 0 for identical coordinates', () => {
    expect(haversineDistance(60.1699, 24.9384, 60.1699, 24.9384)).toBe(0);
  });

  test('calculates known distance between Helsinki and Tallinn (~85 km)', () => {
    const dist = haversineDistance(60.1699, 24.9384, 59.437, 24.7536);
    expect(dist).toBeCloseTo(85, -1);
  });

  test('calculates known distance between Helsinki and Stockholm (~400 km)', () => {
    const dist = haversineDistance(60.1699, 24.9384, 59.3293, 18.0686);
    expect(dist).toBeCloseTo(400, -1);
  });

  test('is symmetric (A-B equals B-A)', () => {
    const d1 = haversineDistance(60.1699, 24.9384, 59.437, 24.7536);
    const d2 = haversineDistance(59.437, 24.7536, 60.1699, 24.9384);
    expect(d1).toBeCloseTo(d2, 5);
  });

  test('returns positive value for different coordinates', () => {
    expect(haversineDistance(0, 0, 1, 1)).toBeGreaterThan(0);
  });
});

describe('bearing', () => {
  test('returns 0 (north) when target is due north', () => {
    const b = bearing(0, 0, 1, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  test('returns 90 (east) when target is due east', () => {
    const b = bearing(0, 0, 0, 1);
    expect(b).toBeCloseTo(90, 0);
  });

  test('returns 180 (south) when target is due south', () => {
    const b = bearing(1, 0, 0, 0);
    expect(b).toBeCloseTo(180, 0);
  });

  test('returns 270 (west) when target is due west', () => {
    const b = bearing(0, 1, 0, 0);
    expect(b).toBeCloseTo(270, 0);
  });

  test('returns value in range [0, 360)', () => {
    const b = bearing(60.1699, 24.9384, 59.437, 24.7536);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });

  test('Tallinn is roughly south of Helsinki (~180°)', () => {
    const b = bearing(60.1699, 24.9384, 59.437, 24.7536);
    expect(b).toBeCloseTo(180, -2);
  });
});
