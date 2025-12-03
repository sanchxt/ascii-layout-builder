import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Theme,
  ThemeMode,
  ThemeColors,
  CustomTheme,
} from "../types/theme";
import { THEME_PRESETS, DEFAULT_THEME_ID } from "../presets/themePresets";

const MAX_CUSTOM_THEMES = 10;

interface ThemeState {
  activeThemeId: string;

  mode: ThemeMode;

  customThemes: CustomTheme[];

  isThemeBuilderOpen: boolean;

  setActiveTheme: (themeId: string) => void;
  setMode: (mode: ThemeMode) => void;
  setThemeBuilderOpen: (isOpen: boolean) => void;
  toggleThemeBuilder: () => void;

  createCustomTheme: (name: string, baseThemeId: string) => string | null;
  updateCustomTheme: (id: string, updates: Partial<ThemeColors>) => void;
  updateCustomThemeIsDark: (id: string, isDark: boolean) => void;
  deleteCustomTheme: (id: string) => void;
  renameCustomTheme: (id: string, name: string) => void;
  duplicateCustomTheme: (id: string) => string | null;

  getActiveTheme: () => Theme;
  getAllThemes: () => Theme[];
  getThemeById: (id: string) => Theme | undefined;
  getEffectiveTheme: () => Theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeThemeId: DEFAULT_THEME_ID,
      mode: "system",
      customThemes: [],
      isThemeBuilderOpen: false,

      setActiveTheme: (themeId) => set({ activeThemeId: themeId }),

      setMode: (mode) => set({ mode }),

      setThemeBuilderOpen: (isOpen) => set({ isThemeBuilderOpen: isOpen }),

      toggleThemeBuilder: () =>
        set((state) => ({ isThemeBuilderOpen: !state.isThemeBuilderOpen })),

      createCustomTheme: (name, baseThemeId) => {
        const state = get();
        if (state.customThemes.length >= MAX_CUSTOM_THEMES) {
          return null;
        }

        const baseTheme = state.getThemeById(baseThemeId);
        if (!baseTheme) return null;

        const id = `custom-${crypto.randomUUID()}`;
        const now = Date.now();

        const newTheme: CustomTheme = {
          id,
          name,
          description: `Custom theme based on ${baseTheme.name}`,
          isDark: baseTheme.isDark,
          colors: { ...baseTheme.colors },
          isCustom: true,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          customThemes: [...state.customThemes, newTheme],
          activeThemeId: id,
        }));

        return id;
      },

      updateCustomTheme: (id, updates) => {
        set((state) => ({
          customThemes: state.customThemes.map((theme) =>
            theme.id === id
              ? {
                  ...theme,
                  colors: { ...theme.colors, ...updates },
                  updatedAt: Date.now(),
                }
              : theme
          ),
        }));
      },

      updateCustomThemeIsDark: (id, isDark) => {
        set((state) => ({
          customThemes: state.customThemes.map((theme) =>
            theme.id === id
              ? { ...theme, isDark, updatedAt: Date.now() }
              : theme
          ),
        }));
      },

      deleteCustomTheme: (id) => {
        set((state) => ({
          customThemes: state.customThemes.filter((t) => t.id !== id),
          activeThemeId:
            state.activeThemeId === id ? DEFAULT_THEME_ID : state.activeThemeId,
        }));
      },

      renameCustomTheme: (id, name) => {
        set((state) => ({
          customThemes: state.customThemes.map((theme) =>
            theme.id === id ? { ...theme, name, updatedAt: Date.now() } : theme
          ),
        }));
      },

      duplicateCustomTheme: (id) => {
        const state = get();
        if (state.customThemes.length >= MAX_CUSTOM_THEMES) {
          return null;
        }

        const theme = state.getThemeById(id);
        if (!theme) return null;

        return state.createCustomTheme(`${theme.name} Copy`, id);
      },

      getActiveTheme: () => {
        const state = get();
        return state.getThemeById(state.activeThemeId) || THEME_PRESETS[0];
      },

      getAllThemes: () => {
        return [...THEME_PRESETS, ...get().customThemes];
      },

      getThemeById: (id) => {
        const preset = THEME_PRESETS.find((p) => p.id === id);
        if (preset) return preset;
        return get().customThemes.find((t) => t.id === id);
      },

      getEffectiveTheme: () => {
        const state = get();
        const activeTheme = state.getActiveTheme();

        if (state.mode === "system") {
          const prefersDark =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;

          if (activeTheme.isDark === prefersDark) {
            return activeTheme;
          }

          const matchingPreset = THEME_PRESETS.find(
            (p) => p.isDark === prefersDark
          );
          return matchingPreset || activeTheme;
        }

        return activeTheme;
      },
    }),
    {
      name: "ascii-layout-builder:theme-state",
      partialize: (state) => ({
        activeThemeId: state.activeThemeId,
        mode: state.mode,
        customThemes: state.customThemes,
      }),
    }
  )
);
