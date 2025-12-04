import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Sun,
  Moon,
  Monitor,
  Plus,
  Trash2,
  Pencil,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useThemeStore } from "../store/themeStore";
import { THEME_PRESETS } from "../presets/themePresets";
import {
  isCustomTheme,
  type ThemeColors,
  type ThemeMode,
} from "../types/theme";
import {
  applyTheme,
  applySingleColor,
  subscribeToSystemColorScheme,
} from "../utils/themeApplication";
import { ThemePreview } from "./ThemePreview";
import { ColorPairCard, SingleColorCard } from "./ColorPairCard";
import { EnhancedColorInput } from "./EnhancedColorInput";
import { cn } from "@/lib/utils";

const COLOR_PAIRS = [
  {
    id: "background",
    label: "Background / Text",
    bg: "background" as const,
    fg: "foreground" as const,
  },
  {
    id: "primary",
    label: "Primary Button",
    bg: "primary" as const,
    fg: "primaryForeground" as const,
  },
  {
    id: "secondary",
    label: "Secondary",
    bg: "secondary" as const,
    fg: "secondaryForeground" as const,
  },
  {
    id: "muted",
    label: "Muted",
    bg: "muted" as const,
    fg: "mutedForeground" as const,
  },
  {
    id: "accent",
    label: "Accent",
    bg: "accent" as const,
    fg: "accentForeground" as const,
  },
  {
    id: "card",
    label: "Card",
    bg: "card" as const,
    fg: "cardForeground" as const,
  },
  {
    id: "popover",
    label: "Popover",
    bg: "popover" as const,
    fg: "popoverForeground" as const,
  },
];

const SINGLE_COLORS = [
  { id: "border", label: "Border", key: "border" as const },
  { id: "input", label: "Input Border", key: "input" as const },
  { id: "ring", label: "Focus Ring", key: "ring" as const },
  { id: "destructive", label: "Destructive", key: "destructive" as const },
];

const SIDEBAR_PAIRS = [
  {
    id: "sidebar",
    label: "Sidebar",
    bg: "sidebar" as const,
    fg: "sidebarForeground" as const,
  },
  {
    id: "sidebarPrimary",
    label: "Sidebar Primary",
    bg: "sidebarPrimary" as const,
    fg: "sidebarPrimaryForeground" as const,
  },
  {
    id: "sidebarAccent",
    label: "Sidebar Accent",
    bg: "sidebarAccent" as const,
    fg: "sidebarAccentForeground" as const,
  },
];

const SIDEBAR_SINGLE_COLORS = [
  {
    id: "sidebarBorder",
    label: "Sidebar Border",
    key: "sidebarBorder" as const,
  },
  { id: "sidebarRing", label: "Sidebar Ring", key: "sidebarRing" as const },
];

export function ThemeEditorModal() {
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );
  const [editingColor, setEditingColor] = useState<{
    key: keyof ThemeColors;
    label: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["main"])
  );

  const isOpen = useThemeStore((state) => state.isThemeBuilderOpen);
  const mode = useThemeStore((state) => state.mode);
  const activeThemeId = useThemeStore((state) => state.activeThemeId);
  const customThemes = useThemeStore((state) => state.customThemes);
  const recentColors = useThemeStore((state) => state.recentColors);
  const setThemeBuilderOpen = useThemeStore(
    (state) => state.setThemeBuilderOpen
  );
  const setMode = useThemeStore((state) => state.setMode);
  const setActiveTheme = useThemeStore((state) => state.setActiveTheme);
  const createCustomTheme = useThemeStore((state) => state.createCustomTheme);
  const updateCustomTheme = useThemeStore((state) => state.updateCustomTheme);
  const deleteCustomTheme = useThemeStore((state) => state.deleteCustomTheme);
  const renameCustomTheme = useThemeStore((state) => state.renameCustomTheme);
  const duplicateCustomTheme = useThemeStore(
    (state) => state.duplicateCustomTheme
  );
  const getActiveTheme = useThemeStore((state) => state.getActiveTheme);
  const addRecentColor = useThemeStore((state) => state.addRecentColor);

  const activeTheme = getActiveTheme();
  const isActiveCustom = isCustomTheme(activeTheme);

  useEffect(() => {
    const unsubscribe = subscribeToSystemColorScheme(() => {
      setSystemPrefersDark(
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingColor) {
          setEditingColor(null);
        } else {
          setThemeBuilderOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, editingColor, setThemeBuilderOpen]);

  const filteredPresets = useMemo(() => {
    if (mode === "system") {
      return THEME_PRESETS.filter((p) => p.isDark === systemPrefersDark);
    }
    return THEME_PRESETS.filter((p) => p.isDark === (mode === "dark"));
  }, [mode, systemPrefersDark]);

  const filteredCustomThemes = useMemo(() => {
    if (mode === "system") {
      return customThemes.filter((t) => t.isDark === systemPrefersDark);
    }
    return customThemes.filter((t) => t.isDark === (mode === "dark"));
  }, [mode, systemPrefersDark, customThemes]);

  const handleClose = () => {
    setEditingColor(null);
    setThemeBuilderOpen(false);
  };

  const handlePresetSelect = (themeId: string) => {
    setActiveTheme(themeId);
    const theme = THEME_PRESETS.find((t) => t.id === themeId);
    if (theme) {
      applyTheme(theme);
      setMode(theme.isDark ? "dark" : "light");
    }
  };

  const handleCustomThemeSelect = (themeId: string) => {
    setActiveTheme(themeId);
    const theme = customThemes.find((t) => t.id === themeId);
    if (theme) {
      applyTheme(theme);
      setMode(theme.isDark ? "dark" : "light");
    }
  };

  const handleModeSelect = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const handleColorChange = useCallback(
    (key: keyof ThemeColors, value: string) => {
      if (!isActiveCustom) return;
      updateCustomTheme(activeThemeId, { [key]: value });
      applySingleColor(key, value);
    },
    [isActiveCustom, activeThemeId, updateCustomTheme]
  );

  const handleColorUsed = useCallback(
    (color: string) => {
      addRecentColor(color);
    },
    [addRecentColor]
  );

  const handleColorClick = (key: keyof ThemeColors, label: string) => {
    if (!isActiveCustom) return;
    setEditingColor({ key, label });
  };

  const handleCreateTheme = () => {
    if (!newThemeName.trim()) return;
    const id = createCustomTheme(newThemeName.trim(), activeThemeId);
    if (id) {
      setIsCreating(false);
      setNewThemeName("");
    }
  };

  const handleStartRename = (themeId: string, currentName: string) => {
    setEditingThemeId(themeId);
    setEditingName(currentName);
  };

  const handleFinishRename = () => {
    if (editingThemeId && editingName.trim()) {
      renameCustomTheme(editingThemeId, editingName.trim());
    }
    setEditingThemeId(null);
    setEditingName("");
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className="relative w-[95vw] max-w-6xl h-[90vh] bg-background rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Theme Editor
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize your application theme
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-border flex flex-col bg-card/30">
            <div className="p-4 border-b border-border">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Mode
              </div>
              <div className="flex gap-1">
                {[
                  { id: "light" as const, icon: Sun, label: "Light" },
                  { id: "dark" as const, icon: Moon, label: "Dark" },
                  { id: "system" as const, icon: Monitor, label: "Auto" },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => handleModeSelect(id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors",
                      mode === id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-border">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Presets
              </div>
              <div className="space-y-1">
                {filteredPresets.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handlePresetSelect(theme.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left",
                      activeThemeId === theme.id
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <div
                      className="w-4 h-4 rounded border border-border/50 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.background} 50%, ${theme.colors.foreground} 50%)`,
                      }}
                    />
                    <span className="flex-1 truncate">{theme.name}</span>
                    {activeThemeId === theme.id && (
                      <Check className="w-3 h-3 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  My Themes
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  disabled={customThemes.length >= 10}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors",
                    customThemes.length >= 10
                      ? "text-muted-foreground cursor-not-allowed"
                      : "text-primary hover:bg-primary/10"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              {isCreating && (
                <div className="mb-3 p-2 bg-accent rounded-lg">
                  <input
                    type="text"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateTheme();
                      if (e.key === "Escape") {
                        setIsCreating(false);
                        setNewThemeName("");
                      }
                    }}
                    placeholder="Theme name..."
                    autoFocus
                    className="w-full px-2 py-1 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={handleCreateTheme}
                      disabled={!newThemeName.trim()}
                      className="flex-1 px-2 py-1 text-[10px] font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewThemeName("");
                      }}
                      className="flex-1 px-2 py-1 text-[10px] font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {filteredCustomThemes.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  <p>No custom themes yet.</p>
                  <p className="mt-1">Click "New" to create one.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCustomThemes.map((theme) => (
                    <div
                      key={theme.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded transition-colors",
                        activeThemeId === theme.id
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <button
                        onClick={() => handleCustomThemeSelect(theme.id)}
                        className="flex-1 flex items-center gap-2 min-w-0"
                      >
                        <div
                          className="w-4 h-4 rounded border border-border/50 shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${theme.colors.background} 50%, ${theme.colors.foreground} 50%)`,
                          }}
                        />
                        {editingThemeId === theme.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleFinishRename}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleFinishRename();
                              if (e.key === "Escape") {
                                setEditingThemeId(null);
                                setEditingName("");
                              }
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-0 px-1 py-0.5 text-xs rounded border border-ring bg-background focus:outline-none"
                          />
                        ) : (
                          <span className="text-xs text-foreground truncate">
                            {theme.name}
                          </span>
                        )}
                      </button>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(theme.id, theme.name);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-background/50 transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateCustomTheme(theme.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-background/50 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomTheme(theme.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-background/50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isActiveCustom && (
              <div className="p-3 border-t border-border bg-muted/30">
                <p className="text-[10px] text-muted-foreground text-center">
                  Create a custom theme to edit colors
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Live Preview
              </div>
              <div className="max-w-md">
                <ThemePreview />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {editingColor ? (
                <div className="max-w-sm">
                  <button
                    onClick={() => setEditingColor(null)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4"
                  >
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    <span>Back to color pairs</span>
                  </button>
                  <EnhancedColorInput
                    value={activeTheme.colors[editingColor.key]}
                    onChange={(value) =>
                      handleColorChange(editingColor.key, value)
                    }
                    recentColors={recentColors}
                    onColorUsed={handleColorUsed}
                    label={editingColor.label}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <button
                      onClick={() => toggleSection("main")}
                      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors"
                    >
                      {expandedSections.has("main") ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      Main Colors
                    </button>
                    {expandedSections.has("main") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {COLOR_PAIRS.map((pair) => (
                          <ColorPairCard
                            key={pair.id}
                            label={pair.label}
                            backgroundColor={activeTheme.colors[pair.bg]}
                            foregroundColor={activeTheme.colors[pair.fg]}
                            onBackgroundChange={(v) =>
                              handleColorChange(pair.bg, v)
                            }
                            onForegroundChange={(v) =>
                              handleColorChange(pair.fg, v)
                            }
                            disabled={!isActiveCustom}
                            onColorClick={(type) =>
                              handleColorClick(
                                type === "background" ? pair.bg : pair.fg,
                                type === "background"
                                  ? `${pair.label} Background`
                                  : `${pair.label} Foreground`
                              )
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      onClick={() => toggleSection("single")}
                      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors"
                    >
                      {expandedSections.has("single") ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      Border & Special
                    </button>
                    {expandedSections.has("single") && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SINGLE_COLORS.map((color) => (
                          <SingleColorCard
                            key={color.id}
                            label={color.label}
                            color={activeTheme.colors[color.key]}
                            onChange={(v) => handleColorChange(color.key, v)}
                            disabled={!isActiveCustom}
                            onColorClick={() =>
                              handleColorClick(color.key, color.label)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      onClick={() => toggleSection("sidebar")}
                      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors"
                    >
                      {expandedSections.has("sidebar") ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      Sidebar Colors
                    </button>
                    {expandedSections.has("sidebar") && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          {SIDEBAR_PAIRS.map((pair) => (
                            <ColorPairCard
                              key={pair.id}
                              label={pair.label}
                              backgroundColor={activeTheme.colors[pair.bg]}
                              foregroundColor={activeTheme.colors[pair.fg]}
                              onBackgroundChange={(v) =>
                                handleColorChange(pair.bg, v)
                              }
                              onForegroundChange={(v) =>
                                handleColorChange(pair.fg, v)
                              }
                              disabled={!isActiveCustom}
                              onColorClick={(type) =>
                                handleColorClick(
                                  type === "background" ? pair.bg : pair.fg,
                                  type === "background"
                                    ? `${pair.label} Background`
                                    : `${pair.label} Foreground`
                                )
                              }
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {SIDEBAR_SINGLE_COLORS.map((color) => (
                            <SingleColorCard
                              key={color.id}
                              label={color.label}
                              color={activeTheme.colors[color.key]}
                              onChange={(v) => handleColorChange(color.key, v)}
                              disabled={!isActiveCustom}
                              onColorClick={() =>
                                handleColorClick(color.key, color.label)
                              }
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
