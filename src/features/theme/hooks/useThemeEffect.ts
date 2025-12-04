import { useEffect } from "react";
import { useThemeStore } from "../store/themeStore";
import { THEME_PRESETS } from "../presets/themePresets";
import {
  applyTheme,
  subscribeToSystemColorScheme,
} from "../utils/themeApplication";

export function useThemeEffect(): void {
  const mode = useThemeStore((state) => state.mode);
  const activeThemeId = useThemeStore((state) => state.activeThemeId);
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);
  const getActiveTheme = useThemeStore((state) => state.getActiveTheme);
  const setActiveTheme = useThemeStore((state) => state.setActiveTheme);

  useEffect(() => {
    const theme = getEffectiveTheme();
    applyTheme(theme);

    if (mode === "system") {
      const unsubscribe = subscribeToSystemColorScheme(() => {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        const activeTheme = getActiveTheme();

        if (activeTheme.isDark !== prefersDark) {
          const matchingPreset = THEME_PRESETS.find(
            (p) => p.isDark === prefersDark
          );
          if (matchingPreset) {
            setActiveTheme(matchingPreset.id);
          }
        }

        const newTheme = getEffectiveTheme();
        applyTheme(newTheme);
      });

      return unsubscribe;
    }
  }, [mode, activeThemeId, getEffectiveTheme, getActiveTheme, setActiveTheme]);
}
