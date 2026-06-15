import { useEffect, useState } from "react";
import type { ThemeMode } from "../types/types";

const getSystemDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyTheme = (mode: ThemeMode): boolean => {
  const isDark = mode === "system" ? getSystemDark() : mode === "dark";
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );
  return isDark;
};

const useTheme = () => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    () => (localStorage.getItem("THEME") as ThemeMode | null) ?? "system"
  );
  const [isDark, setIsDark] = useState(() =>
    applyTheme((localStorage.getItem("THEME") as ThemeMode | null) ?? "system")
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(applyTheme(themeMode));
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setIsDark(applyTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    if (mode === "system") {
      localStorage.removeItem("THEME");
    } else {
      localStorage.setItem("THEME", mode);
    }
    setThemeModeState(mode);
  };

  return { isDark, themeMode, setThemeMode };
};

export default useTheme;
