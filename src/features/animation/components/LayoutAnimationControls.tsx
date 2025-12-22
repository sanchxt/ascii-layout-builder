/**
 * LayoutAnimationControls - UI for controlling layout animations
 *
 * Shows layout information for a transition and provides controls for:
 * - Layout type indicator (flex/grid/none) - read-only
 * - Gap value comparison (from → to)
 * - Animation mode toggle (instant/smooth)
 * - Child reflow toggle
 */

import { useMemo } from "react";
import { LayoutGrid, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAnimationStore } from "../store/animationStore";
import type { LayoutSnapshot, LayoutAnimationConfig } from "../types/cascade";
import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from "../types/cascade";

interface LayoutAnimationControlsProps {
  /** Transition ID to show layout info for */
  transitionId: string;
  /** Additional class name */
  className?: string;
}

interface LayoutGapInfo {
  elementId: string;
  elementName: string;
  fromLayout: LayoutSnapshot | undefined;
  toLayout: LayoutSnapshot | undefined;
  hasGapChange: boolean;
}

/**
 * Get layout type display name
 */
function getLayoutTypeName(type: "flex" | "grid" | "none" | undefined): string {
  switch (type) {
    case "flex":
      return "Flex";
    case "grid":
      return "Grid";
    case "none":
      return "None";
    default:
      return "—";
  }
}

/**
 * Format gap value for display
 */
function formatGapValue(gap: number | undefined): string {
  if (gap === undefined) return "—";
  return `${gap}px`;
}

/**
 * Get layout type color class
 */
function getLayoutTypeColor(type: "flex" | "grid" | "none" | undefined): string {
  switch (type) {
    case "flex":
      return "text-blue-500";
    case "grid":
      return "text-purple-500";
    default:
      return "text-muted-foreground";
  }
}

export function LayoutAnimationControls({
  transitionId,
  className,
}: LayoutAnimationControlsProps) {
  const transition = useAnimationStore((s) => s.getTransition(transitionId));
  const getState = useAnimationStore((s) => s.getState);
  const updateTransition = useAnimationStore((s) => s.updateTransition);

  // Get layout config (stored on transition or use defaults)
  const layoutConfig: LayoutAnimationConfig = useMemo(
    () => transition?.layoutAnimation ?? DEFAULT_LAYOUT_ANIMATION_CONFIG,
    [transition?.layoutAnimation]
  );

  // Get states for this transition
  const fromState = useMemo(
    () => (transition ? getState(transition.fromStateId) : undefined),
    [transition, getState]
  );
  const toState = useMemo(
    () => (transition ? getState(transition.toStateId) : undefined),
    [transition, getState]
  );

  // Find elements with layout changes
  const layoutGapInfos: LayoutGapInfo[] = useMemo(() => {
    if (!fromState || !toState) return [];

    const fromElements = new Map(
      fromState.elements.map((el) => [el.elementId, el])
    );

    return toState.elements
      .map((toEl) => {
        const fromEl = fromElements.get(toEl.elementId);
        const fromLayout = fromEl?.layoutSnapshot;
        const toLayout = toEl.layoutSnapshot;

        // Check if there's a gap change
        const hasGapChange =
          fromLayout?.gap !== toLayout?.gap ||
          fromLayout?.columnGap !== toLayout?.columnGap ||
          fromLayout?.rowGap !== toLayout?.rowGap;

        return {
          elementId: toEl.elementId,
          elementName: toEl.elementName,
          fromLayout,
          toLayout,
          hasGapChange,
        };
      })
      .filter((info) => info.fromLayout || info.toLayout); // Only show elements with layouts
  }, [fromState, toState]);

  // Count elements with layout changes
  const elementsWithGapChange = layoutGapInfos.filter(
    (info) => info.hasGapChange
  );
  const hasLayoutElements = layoutGapInfos.length > 0;
  const hasLayoutChanges = elementsWithGapChange.length > 0;

  // Handlers
  const handleModeChange = (smooth: boolean) => {
    updateTransition(transitionId, {
      layoutAnimation: {
        ...layoutConfig,
        mode: smooth ? "smooth" : "instant",
      },
    });
  };

  const handleChildReflowChange = (reflow: boolean) => {
    updateTransition(transitionId, {
      layoutAnimation: {
        ...layoutConfig,
        childReflow: reflow,
      },
    });
  };

  if (!transition || !hasLayoutElements) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-medium text-foreground">
          Layout Animation
        </span>
        {hasLayoutChanges && (
          <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
            {elementsWithGapChange.length} change
            {elementsWithGapChange.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Layout changes list */}
      {hasLayoutChanges ? (
        <div className="space-y-2">
          {elementsWithGapChange.slice(0, 3).map((info) => (
            <div
              key={info.elementId}
              className="bg-muted/50 rounded-md px-2 py-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-foreground truncate max-w-[100px]">
                  {info.elementName}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-medium",
                    getLayoutTypeColor(
                      info.toLayout?.type ?? info.fromLayout?.type
                    )
                  )}
                >
                  {getLayoutTypeName(
                    info.toLayout?.type ?? info.fromLayout?.type
                  )}
                </span>
              </div>

              {/* Gap change display */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-muted-foreground">Gap:</span>
                <span className="text-[10px] text-foreground">
                  {formatGapValue(info.fromLayout?.gap)}
                </span>
                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[10px] text-foreground font-medium">
                  {formatGapValue(info.toLayout?.gap)}
                </span>
              </div>

              {/* Grid-specific gaps */}
              {(info.fromLayout?.type === "grid" ||
                info.toLayout?.type === "grid") &&
                (info.fromLayout?.columnGap !== info.toLayout?.columnGap ||
                  info.fromLayout?.rowGap !== info.toLayout?.rowGap) && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {info.fromLayout?.columnGap !== info.toLayout?.columnGap && (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">
                          Col:
                        </span>
                        <span className="text-[9px]">
                          {formatGapValue(info.fromLayout?.columnGap)}
                        </span>
                        <ArrowRight className="w-2 h-2 text-muted-foreground" />
                        <span className="text-[9px] font-medium">
                          {formatGapValue(info.toLayout?.columnGap)}
                        </span>
                      </div>
                    )}
                    {info.fromLayout?.rowGap !== info.toLayout?.rowGap && (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">
                          Row:
                        </span>
                        <span className="text-[9px]">
                          {formatGapValue(info.fromLayout?.rowGap)}
                        </span>
                        <ArrowRight className="w-2 h-2 text-muted-foreground" />
                        <span className="text-[9px] font-medium">
                          {formatGapValue(info.toLayout?.rowGap)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
            </div>
          ))}

          {elementsWithGapChange.length > 3 && (
            <p className="text-[10px] text-muted-foreground text-center">
              +{elementsWithGapChange.length - 3} more
            </p>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">
          No gap changes detected between states.
        </p>
      )}

      {/* Controls */}
      {hasLayoutChanges && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          {/* Animation mode */}
          <div className="flex items-center justify-between">
            <Label className="text-[10px] flex items-center gap-1 text-muted-foreground">
              <Zap className="w-3 h-3" />
              Smooth Animation
            </Label>
            <Switch
              checked={layoutConfig.mode === "smooth"}
              onCheckedChange={handleModeChange}
            />
          </div>

          {/* Child reflow */}
          <div className="flex items-center justify-between">
            <Label className="text-[10px] flex items-center gap-1 text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              Child Reflow
            </Label>
            <Switch
              checked={layoutConfig.childReflow}
              onCheckedChange={handleChildReflowChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
