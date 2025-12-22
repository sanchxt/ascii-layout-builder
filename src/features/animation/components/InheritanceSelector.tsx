/**
 * InheritanceSelector - UI for selecting animation inheritance mode
 *
 * Allows users to choose how a child element's animation relates to its parent:
 * - Independent: Element animates on its own
 * - Inherit: Element follows parent's transform additively
 * - Relative: Element maintains relative offset from parent
 */

import { GitMerge, Move, Unlink } from "lucide-react";
import { useAnimationStore } from "../store/animationStore";
import type { AnimationInheritanceMode } from "../types/cascade";
import { cn } from "@/lib/utils";

interface InheritanceSelectorProps {
  /** Animation state ID */
  stateId: string;
  /** Element ID */
  elementId: string;
  /** Current inheritance mode */
  currentMode: AnimationInheritanceMode | undefined;
  /** Whether element has a parent (only show for nested elements) */
  hasParent: boolean;
  /** Additional class name */
  className?: string;
}

const INHERITANCE_OPTIONS: Array<{
  mode: AnimationInheritanceMode;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    mode: "independent",
    label: "Independent",
    description: "Animates on its own",
    icon: Unlink,
    color: "text-gray-500",
  },
  {
    mode: "inherit",
    label: "Inherit",
    description: "Follows parent transform",
    icon: GitMerge,
    color: "text-blue-500",
  },
  {
    mode: "relative",
    label: "Relative",
    description: "Maintains offset from parent",
    icon: Move,
    color: "text-green-500",
  },
];

export const InheritanceSelector = ({
  stateId,
  elementId,
  currentMode,
  hasParent,
  className,
}: InheritanceSelectorProps) => {
  const updateElementInheritance = useAnimationStore(
    (s) => s.updateElementInheritance
  );

  // Only show for nested elements
  if (!hasParent) {
    return null;
  }

  const activeMode = currentMode ?? "relative";

  const handleModeChange = (mode: AnimationInheritanceMode) => {
    updateElementInheritance(stateId, elementId, mode);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitMerge className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-medium text-foreground">
          Animation Inheritance
        </span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground">
        How this element follows its parent during animation.
      </p>

      {/* Mode buttons */}
      <div className="flex gap-1">
        {INHERITANCE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = activeMode === option.mode;

          return (
            <button
              key={option.mode}
              onClick={() => handleModeChange(option.mode)}
              title={option.description}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md transition-colors",
                isActive
                  ? "bg-accent border border-border"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive ? option.color : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active mode description */}
      <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">
        {INHERITANCE_OPTIONS.find((o) => o.mode === activeMode)?.description}
      </div>
    </div>
  );
};
