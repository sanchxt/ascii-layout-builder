/**
 * Layout Diff View Component
 *
 * Visual comparison showing layout differences between animation states:
 * - Side-by-side layout property comparison
 * - Gap value changes with delta indicators
 * - Layout type changes
 * - Per-element breakdown with visual indicators
 */

import { useMemo } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  Equal,
  Grid3X3,
  Rows3,
  Columns3,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnimationStore } from "../store/animationStore";
import type { AnimationStateElement } from "../types/animation";
import type { LayoutSnapshot } from "../types/cascade";

interface LayoutDiffViewProps {
  transitionId: string;
  className?: string;
}

interface ElementLayoutDiff {
  elementId: string;
  elementName: string;
  fromLayout: LayoutSnapshot | undefined;
  toLayout: LayoutSnapshot | undefined;
  changes: LayoutPropertyChange[];
  hasChanges: boolean;
}

interface LayoutPropertyChange {
  property: "type" | "gap" | "columnGap" | "rowGap";
  fromValue: string | number | undefined;
  toValue: string | number | undefined;
  delta?: number;
  changeType: "added" | "removed" | "changed" | "unchanged";
}

// Layout type icons
const LAYOUT_ICONS: Record<string, typeof Grid3X3> = {
  grid: Grid3X3,
  flex: Rows3,
  "flex-row": Columns3,
  "flex-column": Rows3,
  none: Box,
};

function getLayoutIcon(type: string | undefined) {
  return LAYOUT_ICONS[type || "none"] || Box;
}

export function LayoutDiffView({ transitionId, className }: LayoutDiffViewProps) {
  const transition = useAnimationStore((s) => s.getTransition(transitionId));
  const getState = useAnimationStore((s) => s.getState);

  // Get from and to states
  const fromState = useMemo(
    () => (transition ? getState(transition.fromStateId) : undefined),
    [transition, getState]
  );

  const toState = useMemo(
    () => (transition ? getState(transition.toStateId) : undefined),
    [transition, getState]
  );

  // Calculate layout diffs for all elements
  const layoutDiffs = useMemo<ElementLayoutDiff[]>(() => {
    if (!fromState || !toState) return [];

    // Create maps for quick lookup
    const fromElements = new Map(
      fromState.elements.map((el) => [el.elementId, el])
    );
    const toElements = new Map(
      toState.elements.map((el) => [el.elementId, el])
    );

    // Get all unique element IDs
    const allElementIds = new Set([
      ...fromElements.keys(),
      ...toElements.keys(),
    ]);

    const diffs: ElementLayoutDiff[] = [];

    for (const elementId of allElementIds) {
      const fromEl = fromElements.get(elementId);
      const toEl = toElements.get(elementId);

      // Skip elements without any layout
      const fromLayout = fromEl?.layoutSnapshot;
      const toLayout = toEl?.layoutSnapshot;

      if (!fromLayout && !toLayout) continue;

      const changes = calculateLayoutChanges(fromLayout, toLayout);
      const hasChanges = changes.some((c) => c.changeType !== "unchanged");

      diffs.push({
        elementId,
        elementName: fromEl?.elementName || toEl?.elementName || elementId,
        fromLayout,
        toLayout,
        changes,
        hasChanges,
      });
    }

    // Sort: elements with changes first, then alphabetically
    return diffs.sort((a, b) => {
      if (a.hasChanges && !b.hasChanges) return -1;
      if (!a.hasChanges && b.hasChanges) return 1;
      return a.elementName.localeCompare(b.elementName);
    });
  }, [fromState, toState]);

  // Filter to only elements with layout changes
  const changedElements = layoutDiffs.filter((d) => d.hasChanges);

  if (!transition || layoutDiffs.length === 0) {
    return (
      <div className={cn("p-3 text-center text-muted-foreground", className)}>
        <p className="text-xs">No layout elements to compare</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium">Layout Changes</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {changedElements.length} of {layoutDiffs.length} elements changed
        </span>
      </div>

      {/* Summary badges */}
      {changedElements.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {changedElements.map((diff) => (
            <div
              key={diff.elementId}
              className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-[10px] text-green-600 dark:text-green-400"
            >
              {diff.elementName}
            </div>
          ))}
        </div>
      )}

      {/* Diff table */}
      <div className="border border-border rounded-md overflow-hidden bg-muted/20">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_1fr] border-b border-border bg-muted/30">
          <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground">
            From: {fromState?.name}
          </div>
          <div className="px-2 py-1.5 flex items-center justify-center">
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground">
            To: {toState?.name}
          </div>
        </div>

        {/* Element rows */}
        <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
          {layoutDiffs.map((diff) => (
            <ElementDiffRow key={diff.elementId} diff={diff} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Plus className="w-3 h-3 text-green-500" />
          <span>Added</span>
        </div>
        <div className="flex items-center gap-1">
          <Minus className="w-3 h-3 text-red-500" />
          <span>Removed</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowRight className="w-3 h-3 text-blue-500" />
          <span>Changed</span>
        </div>
        <div className="flex items-center gap-1">
          <Equal className="w-3 h-3 text-muted-foreground" />
          <span>Unchanged</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual element diff row
 */
function ElementDiffRow({ diff }: { diff: ElementLayoutDiff }) {
  const FromIcon = getLayoutIcon(diff.fromLayout?.type);
  const ToIcon = getLayoutIcon(diff.toLayout?.type);

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] py-2",
        diff.hasChanges && "bg-green-500/5"
      )}
    >
      {/* Element name row */}
      <div className="col-span-3 px-2 pb-1.5">
        <span
          className={cn(
            "text-[11px] font-medium",
            diff.hasChanges ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          )}
        >
          {diff.elementName}
        </span>
      </div>

      {/* From state */}
      <div className="px-2 space-y-1">
        {diff.fromLayout ? (
          <>
            <div className="flex items-center gap-1.5">
              <FromIcon className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {diff.fromLayout.type}
              </span>
            </div>
            <LayoutValues layout={diff.fromLayout} />
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">
            No layout
          </span>
        )}
      </div>

      {/* Arrow / change indicator */}
      <div className="px-2 flex flex-col items-center justify-center gap-1">
        {diff.changes.map((change, i) => (
          <ChangeIndicator key={i} change={change} />
        ))}
      </div>

      {/* To state */}
      <div className="px-2 space-y-1">
        {diff.toLayout ? (
          <>
            <div className="flex items-center gap-1.5">
              <ToIcon className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {diff.toLayout.type}
              </span>
            </div>
            <LayoutValues layout={diff.toLayout} />
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">
            No layout
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Display layout gap values
 */
function LayoutValues({ layout }: { layout: LayoutSnapshot }) {
  const hasGap = layout.gap !== undefined;
  const hasColumnGap = layout.columnGap !== undefined;
  const hasRowGap = layout.rowGap !== undefined;

  if (!hasGap && !hasColumnGap && !hasRowGap) {
    return (
      <span className="text-[9px] text-muted-foreground italic">
        No gap values
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {hasGap && (
        <span className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">
          gap: {layout.gap}px
        </span>
      )}
      {hasColumnGap && (
        <span className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">
          col: {layout.columnGap}px
        </span>
      )}
      {hasRowGap && (
        <span className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">
          row: {layout.rowGap}px
        </span>
      )}
    </div>
  );
}

/**
 * Change indicator icon
 */
function ChangeIndicator({ change }: { change: LayoutPropertyChange }) {
  switch (change.changeType) {
    case "added":
      return <Plus className="w-3 h-3 text-green-500" />;
    case "removed":
      return <Minus className="w-3 h-3 text-red-500" />;
    case "changed":
      return (
        <div className="flex items-center gap-0.5">
          <ArrowRight className="w-3 h-3 text-blue-500" />
          {change.delta !== undefined && (
            <span
              className={cn(
                "text-[8px] font-mono",
                change.delta > 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {change.delta > 0 ? "+" : ""}
              {change.delta}
            </span>
          )}
        </div>
      );
    default:
      return <Equal className="w-3 h-3 text-muted-foreground/50" />;
  }
}

/**
 * Calculate layout property changes between two snapshots
 */
function calculateLayoutChanges(
  from: LayoutSnapshot | undefined,
  to: LayoutSnapshot | undefined
): LayoutPropertyChange[] {
  const changes: LayoutPropertyChange[] = [];

  // Type change
  const fromType = from?.type;
  const toType = to?.type;
  if (fromType !== toType) {
    changes.push({
      property: "type",
      fromValue: fromType,
      toValue: toType,
      changeType: !fromType ? "added" : !toType ? "removed" : "changed",
    });
  }

  // Gap changes
  const gapProperties: Array<"gap" | "columnGap" | "rowGap"> = [
    "gap",
    "columnGap",
    "rowGap",
  ];

  for (const prop of gapProperties) {
    const fromValue = from?.[prop];
    const toValue = to?.[prop];

    if (fromValue === toValue) {
      if (fromValue !== undefined) {
        changes.push({
          property: prop,
          fromValue,
          toValue,
          changeType: "unchanged",
        });
      }
    } else {
      const changeType =
        fromValue === undefined
          ? "added"
          : toValue === undefined
          ? "removed"
          : "changed";

      const delta =
        changeType === "changed" && typeof fromValue === "number" && typeof toValue === "number"
          ? toValue - fromValue
          : undefined;

      changes.push({
        property: prop,
        fromValue,
        toValue,
        delta,
        changeType,
      });
    }
  }

  return changes;
}

/**
 * Compact version for inline use
 */
export function LayoutDiffSummary({ transitionId }: { transitionId: string }) {
  const transition = useAnimationStore((s) => s.getTransition(transitionId));
  const getState = useAnimationStore((s) => s.getState);

  const hasLayoutChanges = useMemo(() => {
    if (!transition) return false;

    const fromState = getState(transition.fromStateId);
    const toState = getState(transition.toStateId);

    if (!fromState || !toState) return false;

    const fromElements = new Map(
      fromState.elements.map((el) => [el.elementId, el])
    );

    for (const toEl of toState.elements) {
      const fromEl = fromElements.get(toEl.elementId);
      const fromLayout = fromEl?.layoutSnapshot;
      const toLayout = toEl.layoutSnapshot;

      if (fromLayout || toLayout) {
        const changes = calculateLayoutChanges(fromLayout, toLayout);
        if (changes.some((c) => c.changeType !== "unchanged")) {
          return true;
        }
      }
    }

    return false;
  }, [transition, getState]);

  if (!hasLayoutChanges) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded text-[10px] text-green-600 dark:text-green-400">
      <Grid3X3 className="w-3 h-3" />
      <span>Layout changes</span>
    </div>
  );
}
