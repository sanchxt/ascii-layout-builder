/**
 * Easing Preset Chips Component
 *
 * Row of clickable preset buttons for quick easing selection.
 * Shows a "Custom" indicator when the curve doesn't match any preset.
 */

import { cn } from "@/lib/utils";
import type { EasingPreset } from "../types/transition";
import { EASING_PRESET_OPTIONS, EASING_PRESET_LABELS } from "../utils/easingUtils";

interface EasingPresetChipsProps {
  selectedPreset: EasingPreset | "custom";
  onSelectPreset: (preset: EasingPreset) => void;
  className?: string;
  compact?: boolean;
}

export function EasingPresetChips({
  selectedPreset,
  onSelectPreset,
  className,
  compact = false,
}: EasingPresetChipsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1",
        compact && "gap-0.5",
        className
      )}
    >
      {EASING_PRESET_OPTIONS.map((preset) => (
        <button
          key={preset}
          onClick={() => onSelectPreset(preset)}
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
            compact && "px-1.5 py-0.5 text-[10px]",
            selectedPreset === preset
              ? "bg-purple-500 text-white"
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
          )}
        >
          {compact ? getCompactLabel(preset) : EASING_PRESET_LABELS[preset]}
        </button>
      ))}

      {/* Custom indicator - non-clickable */}
      {selectedPreset === "custom" && (
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            "border border-dashed border-purple-500/50 text-purple-500",
            compact && "px-1.5 py-0.5 text-[10px]"
          )}
        >
          Custom
        </span>
      )}
    </div>
  );
}

/**
 * Get compact label for tight spaces
 */
function getCompactLabel(preset: EasingPreset): string {
  const compactLabels: Record<EasingPreset, string> = {
    linear: "Lin",
    ease: "Ease",
    "ease-in": "In",
    "ease-out": "Out",
    "ease-in-out": "InOut",
    spring: "Spring",
    bounce: "Bounce",
  };
  return compactLabels[preset];
}
