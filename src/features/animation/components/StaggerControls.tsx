/**
 * StaggerControls - UI for applying stagger delays to selected elements
 *
 * Allows users to apply sequential delays to a group of elements,
 * creating cascading animation effects.
 */

import { useState } from "react";
import { Layers, Clock, Play } from "lucide-react";
import { useAnimationStore } from "../store/animationStore";
import { ANIMATION_CONSTANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StaggerControlsProps {
  /** Transition ID to apply stagger to */
  transitionId: string;
  /** Element IDs that are selected */
  selectedElementIds: string[];
  /** Additional class name */
  className?: string;
}

export const StaggerControls = ({
  transitionId,
  selectedElementIds,
  className,
}: StaggerControlsProps) => {
  const [staggerDelay, setStaggerDelay] = useState<number>(
    ANIMATION_CONSTANTS.DEFAULT_STAGGER_DELAY
  );

  const applyStaggerToSelection = useAnimationStore(
    (s) => s.applyStaggerToSelection
  );

  const handleApply = () => {
    if (selectedElementIds.length < 2) return;
    applyStaggerToSelection(transitionId, selectedElementIds, staggerDelay);
  };

  const isDisabled = selectedElementIds.length < 2;

  const presetDelays = [25, 50, 100, 150];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-medium text-foreground">
          Stagger Animation
        </span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground">
        Apply sequential delays to selected elements for a cascading effect.
      </p>

      {/* Selection info */}
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs",
          isDisabled ? "bg-muted/50 text-muted-foreground" : "bg-purple-500/10"
        )}
      >
        <span
          className={cn(
            "font-medium",
            !isDisabled && "text-purple-500"
          )}
        >
          {selectedElementIds.length}
        </span>
        <span>element{selectedElementIds.length !== 1 ? "s" : ""} selected</span>
        {isDisabled && (
          <span className="text-[10px]">(min. 2 required)</span>
        )}
      </div>

      {/* Delay slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Delay between elements
          </label>
          <span className="text-xs font-medium text-foreground">
            {staggerDelay}ms
          </span>
        </div>

        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={staggerDelay}
          onChange={(e) => setStaggerDelay(Number(e.target.value))}
          disabled={isDisabled}
          className="w-full h-1.5 rounded-full appearance-none bg-muted disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
        />

        {/* Preset buttons */}
        <div className="flex gap-1">
          {presetDelays.map((delay) => (
            <button
              key={delay}
              onClick={() => setStaggerDelay(delay)}
              disabled={isDisabled}
              className={cn(
                "flex-1 py-1 text-[10px] font-medium rounded-md transition-colors",
                staggerDelay === delay
                  ? "bg-purple-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-accent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {delay}ms
            </button>
          ))}
        </div>
      </div>

      {/* Preview info */}
      {!isDisabled && (
        <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">
          Total animation span:{" "}
          <span className="font-medium text-foreground">
            {(selectedElementIds.length - 1) * staggerDelay}ms
          </span>
        </div>
      )}

      {/* Apply button */}
      <button
        onClick={handleApply}
        disabled={isDisabled}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-colors",
          isDisabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-purple-500 text-white hover:bg-purple-600"
        )}
      >
        <Play className="w-3.5 h-3.5" />
        Apply Stagger
      </button>
    </div>
  );
};
