/**
 * Timing Diagram Component
 *
 * Gantt-chart style visualization showing:
 * - Element names on Y-axis (with hierarchy indentation)
 * - Time in ms on X-axis
 * - Horizontal bars showing animation duration + delay
 * - Color coding for cascade levels
 * - Current playhead position indicator
 */

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnimationStore } from "../store/animationStore";
import { calculateCascadeTimings, buildHierarchyTree, flattenDepthFirst } from "../utils/cascadeTiming";
import type { AnimationStateElement } from "../types/animation";
import type { CascadeConfig } from "../types/cascade";
import type { EasingCurve } from "../types/transition";

interface TimingDiagramProps {
  transitionId: string;
  className?: string;
}

interface ElementTiming {
  elementId: string;
  elementName: string;
  depth: number;
  delay: number;
  duration: number;
  hasChildren: boolean;
}

// Color palette for cascade levels
const LEVEL_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-green-500",
];

function getLevelColor(depth: number): string {
  return LEVEL_COLORS[depth % LEVEL_COLORS.length];
}

export function TimingDiagram({ transitionId, className }: TimingDiagramProps) {
  const transition = useAnimationStore((s) => s.getTransition(transitionId));
  const getState = useAnimationStore((s) => s.getState);
  const playback = useAnimationStore((s) => s.playback);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Get the target state elements for the transition
  const toState = useMemo(
    () => (transition ? getState(transition.toStateId) : undefined),
    [transition, getState]
  );

  // Calculate element timings
  const elementTimings = useMemo<ElementTiming[]>(() => {
    if (!transition || !toState) return [];

    const elements = toState.elements;
    const cascade = transition.cascade;
    const baseDuration = transition.duration;
    const baseDelay = transition.delay;
    const easing = transition.easing;

    // Calculate cascade timings
    const timingsMap = calculateCascadeTimings(
      elements,
      cascade,
      baseDuration,
      baseDelay,
      easing
    );

    // Build hierarchy tree and flatten
    const tree = buildHierarchyTree(elements);
    const orderedNodes = flattenDepthFirst(tree);

    // Map to ElementTiming objects
    return orderedNodes.map((node) => {
      const timing = timingsMap.get(node.element.elementId);
      const hasChildren = elements.some(
        (el) => el.parentId === node.element.elementId
      );

      return {
        elementId: node.element.elementId,
        elementName: node.element.elementName,
        depth: node.depth,
        delay: timing?.delay ?? baseDelay,
        duration: timing?.duration ?? baseDuration,
        hasChildren,
      };
    });
  }, [transition, toState]);

  // Calculate total duration for scaling
  const totalDuration = useMemo(() => {
    if (elementTimings.length === 0) return 1000;
    return Math.max(
      ...elementTimings.map((t) => t.delay + t.duration),
      1000
    );
  }, [elementTimings]);

  // Filter visible elements (respect collapsed state)
  const visibleTimings = useMemo(() => {
    const result: ElementTiming[] = [];
    const collapsedParents: Set<string> = new Set();

    for (const timing of elementTimings) {
      // Check if any ancestor is collapsed
      const ancestors = getAncestors(timing.elementId, elementTimings);
      const hasCollapsedAncestor = ancestors.some((id) => collapsed.has(id));

      if (!hasCollapsedAncestor) {
        result.push(timing);
      }

      // Track collapsed parents
      if (collapsed.has(timing.elementId)) {
        collapsedParents.add(timing.elementId);
      }
    }

    return result;
  }, [elementTimings, collapsed]);

  // Toggle collapse state
  const toggleCollapse = (elementId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(elementId)) {
        next.delete(elementId);
      } else {
        next.add(elementId);
      }
      return next;
    });
  };

  // Current playhead time
  const currentTime = playback.activeTransitionId === transitionId
    ? playback.currentTime
    : 0;

  // Pixel scaling (400px width for time axis)
  const timeWidth = 300;
  const pxPerMs = timeWidth / totalDuration;

  if (!transition || elementTimings.length === 0) {
    return (
      <div className={cn("p-3 text-center text-muted-foreground", className)}>
        <p className="text-xs">No timing data available</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-medium">Cascade Timing</span>
        <span className="text-[10px] text-muted-foreground">
          {Math.round(totalDuration)}ms total
        </span>
      </div>

      {/* Diagram container */}
      <div className="border border-border rounded-md overflow-hidden bg-muted/20">
        {/* Time ruler */}
        <div className="flex border-b border-border bg-muted/30">
          <div className="w-32 shrink-0 px-2 py-1 text-[9px] text-muted-foreground border-r border-border">
            Element
          </div>
          <div className="relative flex-1 h-5">
            {/* Time markers */}
            {Array.from({ length: 5 }).map((_, i) => {
              const time = (totalDuration / 4) * i;
              return (
                <div
                  key={i}
                  className="absolute top-0 h-full flex items-center"
                  style={{ left: time * pxPerMs }}
                >
                  <span className="text-[8px] text-muted-foreground px-0.5">
                    {Math.round(time)}ms
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Element rows */}
        <div className="max-h-48 overflow-y-auto">
          {visibleTimings.map((timing) => {
            const isCollapsed = collapsed.has(timing.elementId);
            const barLeft = timing.delay * pxPerMs;
            const barWidth = Math.max(timing.duration * pxPerMs, 4);
            const color = getLevelColor(timing.depth);

            return (
              <div
                key={timing.elementId}
                className="flex border-b border-border/50 last:border-b-0"
              >
                {/* Element name with indentation */}
                <div className="w-32 shrink-0 px-2 py-1 border-r border-border/50 flex items-center gap-1 overflow-hidden">
                  {/* Indentation */}
                  <div style={{ width: timing.depth * 12 }} />

                  {/* Collapse toggle */}
                  {timing.hasChildren ? (
                    <button
                      onClick={() => toggleCollapse(timing.elementId)}
                      className="p-0.5 hover:bg-muted rounded"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  ) : (
                    <div className="w-4" />
                  )}

                  {/* Depth indicator dot */}
                  <div
                    className={cn("w-1.5 h-1.5 rounded-full shrink-0", color)}
                  />

                  {/* Name */}
                  <span className="text-[10px] truncate">{timing.elementName}</span>
                </div>

                {/* Timing bar */}
                <div className="relative flex-1 py-1">
                  {/* Background grid lines */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-border/30"
                      style={{ left: ((totalDuration / 4) * (i + 1)) * pxPerMs }}
                    />
                  ))}

                  {/* Delay indicator (lighter bar) */}
                  {timing.delay > 0 && (
                    <div
                      className={cn("absolute h-4 top-1/2 -translate-y-1/2 opacity-20 rounded-sm", color)}
                      style={{
                        left: 0,
                        width: barLeft,
                      }}
                    />
                  )}

                  {/* Duration bar */}
                  <div
                    className={cn(
                      "absolute h-4 top-1/2 -translate-y-1/2 rounded-sm",
                      color,
                      "opacity-80 hover:opacity-100 transition-opacity"
                    )}
                    style={{
                      left: barLeft,
                      width: barWidth,
                    }}
                    title={`Delay: ${Math.round(timing.delay)}ms, Duration: ${Math.round(timing.duration)}ms`}
                  >
                    {/* Duration label if bar is wide enough */}
                    {barWidth > 30 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-medium">
                        {Math.round(timing.duration)}ms
                      </span>
                    )}
                  </div>

                  {/* Playhead */}
                  {currentTime > 0 && currentTime < totalDuration && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: currentTime * pxPerMs }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 px-2 py-1.5 border-t border-border bg-muted/30">
          <span className="text-[9px] text-muted-foreground">Depth:</span>
          {LEVEL_COLORS.slice(0, 3).map((color, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-sm", color)} />
              <span className="text-[9px] text-muted-foreground">{i}</span>
            </div>
          ))}
          <span className="text-[9px] text-muted-foreground">...</span>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{elementTimings.length} elements</span>
        <span>|</span>
        <span>
          Max delay: {Math.round(Math.max(...elementTimings.map((t) => t.delay)))}ms
        </span>
      </div>
    </div>
  );
}

/**
 * Get ancestor element IDs for an element
 */
function getAncestors(
  elementId: string,
  timings: ElementTiming[]
): string[] {
  const ancestors: string[] = [];
  // This is a simplified version - in reality we'd need parent tracking
  // For now, we'll use the depth to approximate hierarchy
  const element = timings.find((t) => t.elementId === elementId);
  if (!element || element.depth === 0) return ancestors;

  // Find elements that appear before this one with lower depth
  const index = timings.findIndex((t) => t.elementId === elementId);
  for (let i = index - 1; i >= 0; i--) {
    const prev = timings[i];
    if (prev.depth < element.depth && prev.hasChildren) {
      ancestors.push(prev.elementId);
      if (prev.depth === 0) break;
    }
  }

  return ancestors;
}

/**
 * Compact version for inline use in timeline
 */
export function TimingDiagramCompact({ transitionId }: { transitionId: string }) {
  const transition = useAnimationStore((s) => s.getTransition(transitionId));

  if (!transition?.cascade?.enabled) {
    return null;
  }

  return (
    <div className="p-2 border-t border-border/50 bg-muted/20">
      <TimingDiagram transitionId={transitionId} />
    </div>
  );
}
