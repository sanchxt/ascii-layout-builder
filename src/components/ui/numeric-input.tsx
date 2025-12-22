/**
 * NumericInput Component
 *
 * A unified numeric input with optional slider, custom increment/decrement buttons,
 * and proper styling that avoids native spinner overlap issues.
 */

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Slider } from "./slider";
import { cn } from "@/lib/utils";

interface NumericInputProps {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Unit suffix (e.g., "ms", "px", "%") */
  unit?: string;
  /** Show slider below or inline */
  showSlider?: boolean;
  /** Slider position: 'below' renders slider under input, 'inline' renders compact */
  sliderPosition?: "below" | "inline";
  /** Input size variant */
  size?: "sm" | "md";
  /** Debounce delay in ms (0 to disable) */
  debounceMs?: number;
  /** Additional className for container */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** ID for accessibility */
  id?: string;
  /** Label for accessibility (sr-only) */
  label?: string;
  /** Slider step (defaults to step) */
  sliderStep?: number;
}

export function NumericInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  showSlider = false,
  sliderPosition = "below",
  size = "sm",
  debounceMs = 0,
  className,
  disabled = false,
  id,
  label,
  sliderStep,
}: NumericInputProps) {
  // Local state for debounced input
  const [localValue, setLocalValue] = useState<string>(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when external value changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clampValue = useCallback(
    (v: number): number => {
      return Math.max(min, Math.min(max, v));
    },
    [min, max]
  );

  const commitValue = useCallback(
    (v: number) => {
      const clamped = clampValue(v);
      if (debounceMs > 0) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          onChange(clamped);
        }, debounceMs);
      } else {
        onChange(clamped);
      }
    },
    [clampValue, onChange, debounceMs]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setLocalValue(raw);

      // Try to parse and commit
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        commitValue(parsed);
      }
    },
    [commitValue]
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // On blur, ensure we have a valid value
    const parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      setLocalValue(String(value));
    } else {
      const clamped = clampValue(parsed);
      setLocalValue(String(clamped));
      onChange(clamped);
    }
  }, [localValue, value, clampValue, onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Select all on focus for easy replacement
    inputRef.current?.select();
  }, []);

  const handleIncrement = useCallback(() => {
    const newValue = clampValue(value + step);
    setLocalValue(String(newValue));
    onChange(newValue);
  }, [value, step, clampValue, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = clampValue(value - step);
    setLocalValue(String(newValue));
    onChange(newValue);
  }, [value, step, clampValue, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDecrement();
      } else if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    [handleIncrement, handleDecrement]
  );

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const newValue = values[0];
      setLocalValue(String(newValue));
      onChange(newValue);
    },
    [onChange]
  );

  // Size variants
  const sizeConfig = {
    sm: {
      input: "h-6 text-xs",
      button: "h-6 w-5",
      iconSize: 10,
      container: "gap-0.5",
    },
    md: {
      input: "h-7 text-xs",
      button: "h-7 w-6",
      iconSize: 12,
      container: "gap-1",
    },
  };

  const config = sizeConfig[size];

  // Calculate if at bounds for visual feedback
  const atMin = value <= min;
  const atMax = value >= max;

  const inputElement = (
    <div
      data-numeric-input
      className={cn(
        "inline-flex items-center rounded-md border border-input bg-background",
        "transition-colors duration-150",
        "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30",
        disabled && "opacity-50 cursor-not-allowed",
        config.container
      )}
    >
      {/* Decrement button */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || atMin}
        className={cn(
          "flex items-center justify-center shrink-0",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted/80 active:bg-muted",
          "transition-colors duration-100",
          "rounded-l-[5px]",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent",
          config.button
        )}
        tabIndex={-1}
        aria-label="Decrease value"
      >
        <Minus size={config.iconSize} />
      </button>

      {/* Input field */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "w-12 text-center bg-transparent outline-none",
          "font-mono tabular-nums",
          "border-x border-input/50",
          "[appearance:textfield]",
          config.input
        )}
      />

      {/* Increment button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || atMax}
        className={cn(
          "flex items-center justify-center shrink-0",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted/80 active:bg-muted",
          "transition-colors duration-100",
          "rounded-r-[5px]",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent",
          config.button
        )}
        tabIndex={-1}
        aria-label="Increase value"
      >
        <Plus size={config.iconSize} />
      </button>
    </div>
  );

  // Inline layout: input + unit + slider in a row
  if (showSlider && sliderPosition === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          {inputElement}
          {unit && (
            <span className="text-[10px] text-muted-foreground font-medium shrink-0">
              {unit}
            </span>
          )}
        </div>
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={sliderStep ?? step}
          disabled={disabled}
          className="flex-1 min-w-[60px]"
        />
      </div>
    );
  }

  // Below layout: input row, then slider below
  if (showSlider && sliderPosition === "below") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-1 justify-end">
          {inputElement}
          {unit && (
            <span className="text-[10px] text-muted-foreground font-medium shrink-0">
              {unit}
            </span>
          )}
        </div>
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={sliderStep ?? step}
          disabled={disabled}
          className="w-full"
        />
      </div>
    );
  }

  // No slider: just input with optional unit
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {inputElement}
      {unit && (
        <span className="text-[10px] text-muted-foreground font-medium shrink-0">
          {unit}
        </span>
      )}
    </div>
  );
}

/**
 * Compact variant for tight spaces (e.g., inline in labels)
 * Just shows the input field with unit, no increment buttons
 */
interface CompactNumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
  disabled?: boolean;
}

export function CompactNumericInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  className,
  disabled = false,
}: CompactNumericInputProps) {
  const [localValue, setLocalValue] = useState<string>(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  const clampValue = useCallback(
    (v: number): number => Math.max(min, Math.min(max, v)),
    [min, max]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setLocalValue(raw);
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChange(clampValue(parsed));
      }
    },
    [onChange, clampValue]
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      setLocalValue(String(value));
    } else {
      const clamped = clampValue(parsed);
      setLocalValue(String(clamped));
      onChange(clamped);
    }
  }, [localValue, value, clampValue, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const newValue = clampValue(value + step);
        setLocalValue(String(newValue));
        onChange(newValue);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const newValue = clampValue(value - step);
        setLocalValue(String(newValue));
        onChange(newValue);
      } else if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    [value, step, clampValue, onChange]
  );

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={() => {
          setIsFocused(true);
          inputRef.current?.select();
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "h-6 w-14 px-1.5 text-xs text-right",
          "bg-background border border-input rounded-md",
          "font-mono tabular-nums",
          "outline-none transition-colors duration-150",
          "focus:border-ring focus:ring-1 focus:ring-ring/30",
          "[appearance:textfield]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {unit && (
        <span className="text-[10px] text-muted-foreground font-medium">
          {unit}
        </span>
      )}
    </div>
  );
}
