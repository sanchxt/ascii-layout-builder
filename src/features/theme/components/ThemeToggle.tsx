import { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Check,
  ChevronDown,
  Settings2,
} from "lucide-react";
import { useThemeStore } from "../store/themeStore";
import { THEME_PRESETS } from "../presets/themePresets";
import { isCustomTheme } from "../types/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeThemeId = useThemeStore((state) => state.activeThemeId);
  const mode = useThemeStore((state) => state.mode);
  const customThemes = useThemeStore((state) => state.customThemes);
  const setActiveTheme = useThemeStore((state) => state.setActiveTheme);
  const setMode = useThemeStore((state) => state.setMode);
  const toggleThemeBuilder = useThemeStore((state) => state.toggleThemeBuilder);
  const getActiveTheme = useThemeStore((state) => state.getActiveTheme);

  const activeTheme = getActiveTheme();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const getThemeIcon = () => {
    if (mode === "system") return Monitor;
    if (activeTheme.isDark) return Moon;
    return Sun;
  };

  const ThemeIcon = getThemeIcon();

  const handleThemeSelect = (themeId: string) => {
    setActiveTheme(themeId);
    const theme = [...THEME_PRESETS, ...customThemes].find(
      (t) => t.id === themeId
    );
    if (theme) {
      setMode(theme.isDark ? "dark" : "light");
    }
    setIsOpen(false);
  };

  const handleModeSelect = (newMode: "light" | "dark" | "system") => {
    setMode(newMode);
    if (newMode === "system") {
      setIsOpen(false);
      return;
    }
    const matchingTheme = THEME_PRESETS.find(
      (t) => t.isDark === (newMode === "dark")
    );
    if (matchingTheme) {
      setActiveTheme(matchingTheme.id);
    }
    setIsOpen(false);
  };

  const handleCustomize = () => {
    toggleThemeBuilder();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
          "text-muted-foreground hover:text-foreground hover:bg-accent",
          isOpen && "bg-accent text-foreground"
        )}
        title="Theme"
      >
        <ThemeIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{activeTheme.name}</span>
        <ChevronDown
          className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Mode
            </div>
            <div className="flex gap-1">
              {[
                { id: "light" as const, icon: Sun, label: "Light" },
                { id: "dark" as const, icon: Moon, label: "Dark" },
                { id: "system" as const, icon: Monitor, label: "System" },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => handleModeSelect(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors",
                    mode === id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 border-b border-border max-h-48 overflow-y-auto">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Presets
            </div>
            <div className="space-y-0.5">
              {THEME_PRESETS.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left",
                    activeThemeId === theme.id
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <div
                    className="w-4 h-4 rounded border border-border shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.background} 50%, ${theme.colors.foreground} 50%)`,
                    }}
                  />
                  <span className="flex-1">{theme.name}</span>
                  {theme.isDark && (
                    <Moon className="w-3 h-3 text-muted-foreground" />
                  )}
                  {activeThemeId === theme.id && (
                    <Check className="w-3 h-3 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {customThemes.length > 0 && (
            <div className="p-2 border-b border-border max-h-32 overflow-y-auto">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
                My Themes
              </div>
              <div className="space-y-0.5">
                {customThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left",
                      activeThemeId === theme.id
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <div
                      className="w-4 h-4 rounded border border-border shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.background} 50%, ${theme.colors.foreground} 50%)`,
                      }}
                    />
                    <span className="flex-1 truncate">{theme.name}</span>
                    {isCustomTheme(theme) && (
                      <Palette className="w-3 h-3 text-muted-foreground" />
                    )}
                    {activeThemeId === theme.id && (
                      <Check className="w-3 h-3 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-2">
            <button
              onClick={handleCustomize}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Customize Theme</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
