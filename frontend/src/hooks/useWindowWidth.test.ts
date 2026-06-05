import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import useWindowWidth from "./useWindowWidth";

describe("useWindowWidth", () => {
  test("returns current window width on mount", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });

    const { result } = renderHook(() => useWindowWidth());

    expect(result.current).toBe(1280);
  });

  test("updates width on resize event", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useWindowWidth());
    expect(result.current).toBe(1024);

    act(() => {
      window.innerWidth = 768;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(768);
  });
});
