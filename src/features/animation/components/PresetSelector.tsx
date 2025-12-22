/**
 * PresetSelector - Quick preset selection for animation states
 *
 * Allows users to quickly apply common animation presets to elements.
 */

import { useState } from "react";
import { Sparkles, ChevronDown, Check } from "lucide-react";
import { useAnimationStore } from "../store/animationStore";
import {
  ANIMATION_PRESETS,
  PRESET_CATEGORIES,
  getPresetById,
} from "../utils/presets";
import type { AnimationPreset, PresetCategory } from "../types/presets";
import { cn } from "@/lib/utils";

interface PresetSelectorProps {
  /** State ID to apply preset to */
  stateId: string;
  /** Element ID to apply preset to */
  elementId: string;
  /** Whether to apply from or to properties */
  applyMode?: "from" | "to";
  /** Callback after applying preset */
  onApply?: (preset: AnimationPreset) => void;
  /** Additional class name */
  className?: string;
}

export const PresetSelector = ({
  stateId,
  elementId,
  applyMode = "to",
  onApply,
  className,
}: PresetSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<PresetCategory>("fade");

  const applyPresetToElement = useAnimationStore(
    (s) => s.applyPresetToElement
  );

  const filteredPresets = ANIMATION_PRESETS.filter(
    (p) => p.category === selectedCategory
  );

  const handleApplyPreset = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    // Get properties based on mode
    const properties =
      applyMode === "from" ? preset.fromProperties : preset.toProperties;

    // Apply to element
    applyPresetToElement(stateId, elementId, properties, "current");

    onApply?.(preset);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border border-border bg-card hover:bg-accent transition-colors"
      >
        <Sparkles className="w-3 h-3 text-purple-500" />
        <span>Presets</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-lg border border-border bg-popover shadow-lg">
            {/* Category tabs */}
            <div className="flex border-b border-border">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors",
                    selectedCategory === cat.id
                      ? "text-purple-500 border-b-2 border-purple-500"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Preset list */}
            <div className="p-1 max-h-48 overflow-y-auto">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className="w-full flex items-start gap-2 p-2 rounded-md text-left hover:bg-accent transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {preset.description}
                    </div>
                  </div>
                  <Check className="w-3 h-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                </button>
              ))}
            </div>

            {/* Mode indicator */}
            <div className="px-2 py-1.5 border-t border-border bg-muted/50">
              <span className="text-[10px] text-muted-foreground">
                Applying{" "}
                <span className="font-medium text-foreground">
                  {applyMode === "from" ? "from" : "to"}
                </span>{" "}
                properties
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
