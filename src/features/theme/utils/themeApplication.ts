import type { Theme, ThemeColors } from "../types/theme";
import { COLOR_TO_CSS_VAR, THEME_COLOR_KEYS } from "../types/theme";

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  for (const key of THEME_COLOR_KEYS) {
    const cssVar = COLOR_TO_CSS_VAR[key];
    const value = theme.colors[key];
    root.style.setProperty(cssVar, value);
  }

  if (theme.isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function applySingleColor(key: keyof ThemeColors, value: string): void {
  const root = document.documentElement;
  const cssVar = COLOR_TO_CSS_VAR[key];
  root.style.setProperty(cssVar, value);
}

export function getSystemColorScheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function subscribeToSystemColorScheme(
  callback: (scheme: "light" | "dark") => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handler);

  return () => {
    mediaQuery.removeEventListener("change", handler);
  };
}

export function resetTheme(): void {
  const root = document.documentElement;

  for (const key of THEME_COLOR_KEYS) {
    const cssVar = COLOR_TO_CSS_VAR[key];
    root.style.removeProperty(cssVar);
  }

  root.classList.remove("dark");
}
