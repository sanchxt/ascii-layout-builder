/**
 * CascadePresets - UI for selecting cascade animation presets
 *
 * Provides quick access to predefined cascade timing configurations:
 * - Waterfall: Top-down with increasing delay
 * - Ripple: Center-out animation
 * - Sequence: One-by-one, depth-first
 * - Parallel: All children together
 * - Reverse: Bottom-up animation
 */

import {
  ArrowDown,
  Circle,
  ListOrdered,
  Layers,
  ArrowUp,
} from "lucide-react";
import { useAnimationStore } from "../store/animationStore";
import type { CascadePresetType } from "../types/cascade";
import { CASCADE_PRESETS } from "../types/cascade";
import { cn } from "@/lib/utils";

interface CascadePresetsProps {
  /** Transition ID to apply preset to */
  transitionId: string;
  /** Currently active preset (if any) */
  activePreset?: CascadePresetType;
  /** Additional class name */
  className?: string;
}

const PRESET_ICONS: Record<CascadePresetType, React.ElementType> = {
  waterfall: ArrowDown,
  ripple: Circle,
  sequence: ListOrdered,
  parallel: Layers,
  "reverse-cascade": ArrowUp,
};

const PRESET_COLORS: Record<CascadePresetType, string> = {
  waterfall: "text-blue-500",
  ripple: "text-purple-500",
  sequence: "text-green-500",
  parallel: "text-orange-500",
  "reverse-cascade": "text-pink-500",
};

export const CascadePresets = ({
  transitionId,
  activePreset,
  className,
}: CascadePresetsProps) => {
  const applyTransitionCascadePreset = useAnimationStore(
    (s) => s.applyTransitionCascadePreset
  );

  const handlePresetClick = (presetId: CascadePresetType) => {
    applyTransitionCascadePreset(transitionId, presetId);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-medium text-foreground">
          Cascade Presets
        </span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground">
        Apply a cascade animation pattern to all elements.
      </p>

      {/* Preset buttons grid */}
      <div className="grid grid-cols-5 gap-1">
        {CASCADE_PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.id];
          const color = PRESET_COLORS[preset.id];
          const isActive = activePreset === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.id)}
              title={`${preset.name}: ${preset.description}`}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-1 rounded-md transition-colors",
                isActive
                  ? "bg-accent border border-border"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive ? color : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[9px] font-medium truncate w-full text-center",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {preset.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active preset description */}
      {activePreset && (
        <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">
          {CASCADE_PRESETS.find((p) => p.id === activePreset)?.description}
        </div>
      )}
    </div>
  );
};

/**
 * Compact version of CascadePresets for inline use
 */
export const CascadePresetsCompact = ({
  transitionId,
  activePreset,
  className,
}: CascadePresetsProps) => {
  const applyTransitionCascadePreset = useAnimationStore(
    (s) => s.applyTransitionCascadePreset
  );

  const handlePresetClick = (presetId: CascadePresetType) => {
    applyTransitionCascadePreset(transitionId, presetId);
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {CASCADE_PRESETS.map((preset) => {
        const Icon = PRESET_ICONS[preset.id];
        const color = PRESET_COLORS[preset.id];
        const isActive = activePreset === preset.id;

        return (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            title={`${preset.name}: ${preset.description}`}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isActive
                ? "bg-accent border border-border"
                : "bg-muted/50 hover:bg-muted"
            )}
          >
            <Icon
              className={cn(
                "w-3.5 h-3.5",
                isActive ? color : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
