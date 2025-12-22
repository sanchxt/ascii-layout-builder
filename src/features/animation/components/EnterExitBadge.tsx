/**
 * EnterExitBadge - Visual indicator for element enter/exit animation type
 *
 * Shows a small badge indicating whether an element has enter, exit, or no
 * special animation behavior.
 */

import { ArrowDownRight, ArrowUpLeft, Minus } from "lucide-react";
import type { EnterExitType } from "../types/animation";
import { cn } from "@/lib/utils";

interface EnterExitBadgeProps {
  /** Current enter/exit type */
  type: EnterExitType;
  /** Callback when clicked (for toggling) */
  onClick?: () => void;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class name */
  className?: string;
}

const typeConfig: Record<
  EnterExitType,
  {
    icon: typeof ArrowDownRight;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  enter: {
    icon: ArrowDownRight,
    label: "Enter",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  exit: {
    icon: ArrowUpLeft,
    label: "Exit",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  none: {
    icon: Minus,
    label: "None",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

export const EnterExitBadge = ({
  type,
  onClick,
  size = "sm",
  className,
}: EnterExitBadgeProps) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] gap-0.5",
    md: "px-2 py-1 text-xs gap-1",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
  };

  if (type === "none" && !onClick) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md font-medium transition-colors",
        sizeClasses[size],
        config.bgColor,
        config.color,
        onClick && "hover:opacity-80 cursor-pointer",
        !onClick && "cursor-default",
        className
      )}
      title={`${config.label} animation${onClick ? " (click to change)" : ""}`}
      disabled={!onClick}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </button>
  );
};

/**
 * EnterExitSelector - Dropdown for selecting enter/exit type
 */
interface EnterExitSelectorProps {
  /** Current type */
  value: EnterExitType;
  /** Callback when type changes */
  onChange: (type: EnterExitType) => void;
  /** Additional class name */
  className?: string;
}

export const EnterExitSelector = ({
  value,
  onChange,
  className,
}: EnterExitSelectorProps) => {
  const types: EnterExitType[] = ["none", "enter", "exit"];

  const handleCycle = () => {
    const currentIndex = types.indexOf(value);
    const nextIndex = (currentIndex + 1) % types.length;
    onChange(types[nextIndex]);
  };

  return (
    <EnterExitBadge
      type={value}
      onClick={handleCycle}
      size="md"
      className={className}
    />
  );
};
