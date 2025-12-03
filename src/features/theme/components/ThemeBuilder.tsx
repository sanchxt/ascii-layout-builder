import { useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { useThemeStore } from "../store/themeStore";
import { THEME_PRESETS } from "../presets/themePresets";
import {
  isCustomTheme,
  COLOR_GROUPS,
  COLOR_LABELS,
  type ThemeColors,
} from "../types/theme";
import { applyTheme, applySingleColor } from "../utils/themeApplication";
import { ThemePresetCard } from "./ThemePresetCard";
import { ColorInput } from "./ColorInput";
import { cn } from "@/lib/utils";

export function ThemeBuilder() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["core"])
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const mode = useThemeStore((state) => state.mode);
  const activeThemeId = useThemeStore((state) => state.activeThemeId);
  const customThemes = useThemeStore((state) => state.customThemes);
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

  const activeTheme = getActiveTheme();
  const isActiveCustom = isCustomTheme(activeTheme);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
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

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    if (!isActiveCustom) return;

    updateCustomTheme(activeThemeId, { [key]: value });
    applySingleColor(key, value);
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

  const renderColorGroup = (
    groupName: string,
    colorKeys: readonly (keyof ThemeColors)[]
  ) => {
    const isExpanded = expandedGroups.has(groupName);
    const displayName =
      groupName.charAt(0).toUpperCase() + groupName.slice(1) + " Colors";

    return (
      <div key={groupName} className="border-b border-border last:border-b-0">
        <button
          onClick={() => toggleGroup(groupName)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent/50 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <span>{displayName}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {colorKeys.length}
          </span>
        </button>

        {isExpanded && (
          <div className="px-3 pb-2 space-y-2">
            {colorKeys.map((key) => (
              <ColorInput
                key={key}
                label={COLOR_LABELS[key]}
                value={activeTheme.colors[key]}
                onChange={(value) => handleColorChange(key, value)}
                disabled={!isActiveCustom}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border">
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
              onClick={() => setMode(id)}
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

      <div className="p-3 border-b border-border">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Presets
        </div>
        <div className="grid grid-cols-3 gap-2">
          {THEME_PRESETS.map((theme) => (
            <ThemePresetCard
              key={theme.id}
              theme={theme}
              isActive={activeThemeId === theme.id}
              onClick={() => handlePresetSelect(theme.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Colors
            </div>
            {!isActiveCustom && (
              <span className="text-[10px] text-warning-foreground bg-warning/20 px-1.5 py-0.5 rounded">
                Read-only
              </span>
            )}
          </div>

          {renderColorGroup("core", COLOR_GROUPS.core)}
          {renderColorGroup("ui", COLOR_GROUPS.ui)}
          {renderColorGroup("components", COLOR_GROUPS.components)}
          {renderColorGroup("sidebar", COLOR_GROUPS.sidebar)}
          {renderColorGroup("special", COLOR_GROUPS.special)}
        </div>

        <div className="p-3">
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
              title={
                customThemes.length >= 10
                  ? "Maximum 10 custom themes"
                  : "Create new theme"
              }
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          {isCreating && (
            <div className="mb-2 p-2 bg-accent rounded-lg">
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
                  className="flex-1 px-2 py-1 text-[10px] font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {customThemes.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              <p>No custom themes yet.</p>
              <p className="mt-1">
                Click "New" to create one based on the current theme.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {customThemes.map((theme) => (
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
                      className="w-4 h-4 rounded border border-border shrink-0"
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
      </div>

      {!isActiveCustom && (
        <div className="p-2 border-t border-border bg-muted/50">
          <p className="text-[10px] text-muted-foreground text-center">
            Select a custom theme or create one to edit colors
          </p>
        </div>
      )}
    </div>
  );
}
