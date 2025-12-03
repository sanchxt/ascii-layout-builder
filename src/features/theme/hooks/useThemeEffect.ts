import { useEffect } from "react";
import { useThemeStore } from "../store/themeStore";
import {
  applyTheme,
  subscribeToSystemColorScheme,
} from "../utils/themeApplication";

export function useThemeEffect(): void {
  const mode = useThemeStore((state) => state.mode);
  const activeThemeId = useThemeStore((state) => state.activeThemeId);
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);

  useEffect(() => {
    const theme = getEffectiveTheme();
    applyTheme(theme);

    if (mode === "system") {
      const unsubscribe = subscribeToSystemColorScheme(() => {
        const newTheme = getEffectiveTheme();
        applyTheme(newTheme);
      });

      return unsubscribe;
    }
  }, [mode, activeThemeId, getEffectiveTheme]);
}
