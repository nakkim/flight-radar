import { afterEach, beforeEach, describe, vi } from "vitest";

vi.mock("../App", () => ({
  POLL_INTERVAL_MS: 2000,
}));

describe.skip("useFlights", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T12:00:00Z"));
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  // TODO: add tests for useFlights
});
