/**
 * Hold Time Control Component
 *
 * Slider + input for configuring how long a state holds
 * before transitioning to the next state.
 */

import { useCallback } from "react";
import { Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ANIMATION_CONSTANTS } from "@/lib/constants";

interface HoldTimeControlProps {
  /** Current hold time in milliseconds */
  value: number;
  /** Called when hold time changes */
  onChange: (value: number) => void;
  /** Compact mode for inline display (e.g., in StateCard dropdown) */
  compact?: boolean;
  /** Additional class names */
  className?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
}

export function HoldTimeControl({
  value,
  onChange,
  compact = false,
  className,
  disabled = false,
}: HoldTimeControlProps) {
  const handleValueChange = useCallback(
    (newValue: number) => {
      const clampedValue = Math.max(
        ANIMATION_CONSTANTS.MIN_HOLD_TIME,
        Math.min(ANIMATION_CONSTANTS.MAX_HOLD_TIME, newValue)
      );
      onChange(clampedValue);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      if (!isNaN(newValue)) {
        handleValueChange(newValue);
      }
    },
    [handleValueChange]
  );

  const handleSliderChange = useCallback(
    ([newValue]: number[]) => {
      handleValueChange(newValue);
    },
    [handleValueChange]
  );

  if (compact) {
    // Compact mode: horizontal layout with smaller controls
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Label className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Timer size={12} />
          Hold
        </Label>
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={ANIMATION_CONSTANTS.MIN_HOLD_TIME}
          max={5000} // Cap at 5s for compact slider
          step={50}
          className="flex-1 min-w-16"
          disabled={disabled}
        />
        <div className="flex items-center gap-0.5 shrink-0">
          <Input
            type="number"
            value={value}
            onChange={handleInputChange}
            className="h-6 w-14 text-xs text-right"
            min={ANIMATION_CONSTANTS.MIN_HOLD_TIME}
            max={ANIMATION_CONSTANTS.MAX_HOLD_TIME}
            step={50}
            disabled={disabled}
          />
          <span className="text-[10px] text-muted-foreground">ms</span>
        </div>
      </div>
    );
  }

  // Full mode: vertical layout with label on top
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1">
          <Timer size={12} />
          Hold Time
        </Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={value}
            onChange={handleInputChange}
            className="h-7 w-20 text-xs text-right"
            min={ANIMATION_CONSTANTS.MIN_HOLD_TIME}
            max={ANIMATION_CONSTANTS.MAX_HOLD_TIME}
            step={50}
            disabled={disabled}
          />
          <span className="text-xs text-muted-foreground">ms</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={handleSliderChange}
        min={ANIMATION_CONSTANTS.MIN_HOLD_TIME}
        max={ANIMATION_CONSTANTS.MAX_HOLD_TIME}
        step={50}
        className="w-full"
        disabled={disabled}
      />
      <p className="text-[10px] text-muted-foreground">
        How long to display this state before transitioning
      </p>
    </div>
  );
}
