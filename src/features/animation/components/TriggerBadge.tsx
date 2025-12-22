/**
 * TriggerBadge - Reusable badge component for animation triggers
 *
 * Shows trigger type with icon and optional label/element name.
 * Supports multiple sizes and variants for different contexts.
 */

import {
  Play,
  MousePointer2,
  Pointer,
  Focus,
  Timer,
  Scroll,
  Code,
  type LucideIcon,
} from "lucide-react";
import type { AnimationTrigger, AnimationTriggerType } from "../types/animation";
import { TRIGGER_VISUALIZATION } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface TriggerBadgeProps {
  /** The trigger configuration */
  trigger: AnimationTrigger;
  /** Badge size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show the trigger type label */
  showLabel?: boolean;
  /** Whether to show the target element name */
  showElementName?: boolean;
  /** Visual variant */
  variant?: "default" | "outline" | "minimal" | "pill";
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether badge is highlighted/active */
  isActive?: boolean;
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

/** Icon mapping for each trigger type */
const triggerIcons: Record<AnimationTriggerType, LucideIcon> = {
  initial: Play,
  hover: MousePointer2,
  click: Pointer,
  focus: Focus,
  scroll: Scroll,
  auto: Timer,
  custom: Code,
};

/** Human-readable labels for trigger types */
const triggerLabels: Record<AnimationTriggerType, string> = {
  initial: "Initial",
  hover: "Hover",
  click: "Click",
  focus: "Focus",
  scroll: "Scroll",
  auto: "Auto",
  custom: "Custom",
};

/** Short labels for compact display */
const triggerShortLabels: Record<AnimationTriggerType, string> = {
  initial: "▶",
  hover: "🖱",
  click: "👆",
  focus: "◎",
  scroll: "📜",
  auto: "⏱",
  custom: "⚙",
};

export const TriggerBadge = ({
  trigger,
  size = "md",
  showLabel = false,
  showElementName = false,
  variant = "default",
  className,
  onClick,
  isActive = false,
  showTooltip = true,
}: TriggerBadgeProps) => {
  const colors = TRIGGER_VISUALIZATION.COLORS[trigger.type];
  const badgeSize = TRIGGER_VISUALIZATION.BADGE[size.toUpperCase() as "SM" | "MD" | "LG"];
  const Icon = triggerIcons[trigger.type];
  const label = triggerLabels[trigger.type];
  const elementName = trigger.element?.targetElementName;

  const tooltipContent = elementName
    ? `${label}: ${elementName}`
    : label;

  // Size-based classes
  const sizeClasses = {
    sm: "h-5 text-[10px] gap-0.5",
    md: "h-6 text-xs gap-1",
    lg: "h-7 text-sm gap-1.5",
  };

  const iconSizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  const paddingClasses = {
    sm: showLabel || showElementName ? "px-1.5" : "px-1",
    md: showLabel || showElementName ? "px-2" : "px-1.5",
    lg: showLabel || showElementName ? "px-2.5" : "px-2",
  };

  // Variant-based classes
  const variantClasses = {
    default: cn(
      colors.bg,
      colors.text,
      "border",
      colors.border,
      isActive && "ring-2 ring-offset-1 ring-offset-background",
      isActive && colors.border.replace("border-", "ring-")
    ),
    outline: cn(
      "bg-transparent border-2",
      colors.border,
      colors.text
    ),
    minimal: cn(
      "bg-transparent",
      colors.text
    ),
    pill: cn(
      colors.bg,
      colors.text,
      "rounded-full"
    ),
  };

  const baseClasses = cn(
    "inline-flex items-center justify-center font-medium transition-all duration-200",
    "select-none shrink-0",
    variant !== "pill" && "rounded-md",
    onClick && "cursor-pointer hover:opacity-80 active:scale-95",
    sizeClasses[size],
    paddingClasses[size],
    variantClasses[variant],
    className
  );

  const content = (
    <>
      <Icon className={cn(iconSizeClasses[size], "shrink-0")} />
      {showLabel && (
        <span className="font-semibold tracking-tight">{label}</span>
      )}
      {showElementName && elementName && (
        <span className="opacity-70 truncate max-w-[80px]">
          {showLabel ? `: ${elementName}` : elementName}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={baseClasses}
        title={showTooltip ? tooltipContent : undefined}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={baseClasses}
      title={showTooltip ? tooltipContent : undefined}
    >
      {content}
    </div>
  );
};

/**
 * Compact trigger icon for inline use
 * Shows just the icon with colored background
 */
export const TriggerIcon = ({
  type,
  size = "sm",
  className,
}: {
  type: AnimationTriggerType;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const colors = TRIGGER_VISUALIZATION.COLORS[type];
  const Icon = triggerIcons[type];

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded",
        colors.bg,
        colors.text,
        sizeClasses[size],
        className
      )}
      title={triggerLabels[type]}
    >
      <Icon className={iconSizeClasses[size]} />
    </div>
  );
};

/**
 * Get emoji/symbol for trigger type (for timeline labels)
 */
export const getTriggerEmoji = (type: AnimationTriggerType): string => {
  return triggerShortLabels[type];
};

/**
 * Get full label for trigger type
 */
export const getTriggerLabel = (type: AnimationTriggerType): string => {
  return triggerLabels[type];
};

/**
 * Get trigger colors from constants
 */
export const getTriggerColors = (type: AnimationTriggerType) => {
  return TRIGGER_VISUALIZATION.COLORS[type];
};
