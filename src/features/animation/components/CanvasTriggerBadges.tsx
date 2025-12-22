/**
 * CanvasTriggerBadges - Floating badges above boxes showing trigger types
 *
 * Renders badges on the canvas for elements that have associated animation triggers.
 * Shows trigger type icon and optional element connection indicator.
 */

import { useMemo } from "react";
import { TriggerIcon } from "./TriggerBadge";
import { useAnimationStore } from "../store/animationStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { getAbsolutePosition } from "@/features/boxes/utils/boxHierarchy";
import { TRIGGER_VISUALIZATION } from "@/lib/constants";
import type { AnimationState } from "../types/animation";
import { cn } from "@/lib/utils";

interface CanvasTriggerBadgesProps {
  /** Current canvas zoom level */
  zoom: number;
  /** Current artboard ID being viewed (optional filter) */
  artboardId?: string;
}

interface TriggerBadgeData {
  stateId: string;
  stateName: string;
  triggerType: AnimationState["trigger"]["type"];
  elementId: string;
  elementName: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export function CanvasTriggerBadges({
  zoom,
  artboardId,
}: CanvasTriggerBadgesProps) {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const states = useAnimationStore((s) => s.states);
  const activeStateId = useAnimationStore((s) => s.activeStateId);
  const previewMode = useAnimationStore((s) => s.previewMode);

  const boxes = useBoxStore((s) => s.boxes);
  const artboards = useArtboardStore((s) => s.artboards);

  // Only show in animation or preview mode
  const isVisible = editorMode === "animation" || editorMode === "preview";

  // Compute badge data for all element-based triggers
  const triggerBadges = useMemo(() => {
    if (!isVisible) return [];

    const badges: TriggerBadgeData[] = [];

    // Filter states by artboard if specified
    const relevantStates = artboardId
      ? states.filter((s) => s.artboardId === artboardId)
      : states;

    for (const state of relevantStates) {
      // Skip initial trigger states - they don't have element triggers
      if (state.trigger.type === "initial" || state.trigger.type === "auto") {
        continue;
      }

      // Check if state has an element trigger
      const targetElementId = state.trigger.element?.targetElementId;
      if (!targetElementId) continue;

      // Find the box
      const box = boxes.find((b) => b.id === targetElementId);
      if (!box) continue;

      // Get absolute position
      const absPos = getAbsolutePosition(box, boxes);

      // If box is in an artboard, add artboard offset
      let finalX = absPos.x;
      let finalY = absPos.y;

      if (box.artboardId) {
        const artboard = artboards.find((a) => a.id === box.artboardId);
        if (artboard) {
          finalX = artboard.x + box.x;
          finalY = artboard.y + box.y;
        }
      }

      badges.push({
        stateId: state.id,
        stateName: state.name,
        triggerType: state.trigger.type,
        elementId: targetElementId,
        elementName: state.trigger.element?.targetElementName || box.name || "Element",
        position: { x: finalX, y: finalY },
        size: { width: box.width, height: box.height },
      });
    }

    return badges;
  }, [isVisible, states, boxes, artboards, artboardId]);

  // Group badges by element ID to handle multiple triggers on same element
  const groupedBadges = useMemo(() => {
    const groups = new Map<string, TriggerBadgeData[]>();

    for (const badge of triggerBadges) {
      const existing = groups.get(badge.elementId) || [];
      existing.push(badge);
      groups.set(badge.elementId, existing);
    }

    return groups;
  }, [triggerBadges]);

  if (!isVisible || triggerBadges.length === 0) {
    return null;
  }

  // Calculate inverse scale to keep badges readable at all zoom levels
  const badgeScale = Math.max(0.5, Math.min(1, 1 / zoom));

  return (
    <div className="pointer-events-none">
      {Array.from(groupedBadges.entries()).map(([elementId, badges]) => {
        const firstBadge = badges[0];
        const isActive = badges.some((b) => b.stateId === activeStateId);
        const isPreviewTarget = previewMode.hoveredElementId === elementId;

        // Position badge above the element
        const badgeX = firstBadge.position.x + firstBadge.size.width / 2;
        const badgeY = firstBadge.position.y + TRIGGER_VISUALIZATION.CANVAS_BADGE.OFFSET_Y;

        return (
          <div
            key={elementId}
            className={cn(
              "absolute flex items-center gap-0.5 pointer-events-auto transition-all duration-200",
              isActive && "ring-2 ring-purple-500 ring-offset-1 rounded-md",
              isPreviewTarget && "animate-pulse"
            )}
            style={{
              left: badgeX,
              top: badgeY,
              transform: `translate(-50%, -100%) scale(${badgeScale})`,
              transformOrigin: "center bottom",
              zIndex: isActive ? 1000 : 100,
            }}
            title={badges.map((b) => `${b.stateName} (${b.triggerType})`).join(", ")}
          >
            {badges.map((badge, idx) => (
              <TriggerIcon
                key={badge.stateId}
                type={badge.triggerType}
                size="md"
                className={cn(
                  "shadow-md border border-border/50",
                  idx > 0 && "-ml-1",
                  badge.stateId === activeStateId && "ring-1 ring-purple-500"
                )}
              />
            ))}

            {/* Show count if multiple triggers */}
            {badges.length > 1 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-muted text-muted-foreground text-[9px] font-bold rounded-full flex items-center justify-center border border-border shadow-sm">
                {badges.length}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Minimal badge that shows on an element during preview mode
 * to indicate it's a trigger source
 */
export function PreviewTriggerIndicator({
  elementId,
  zoom,
}: {
  elementId: string;
  zoom: number;
}) {
  const states = useAnimationStore((s) => s.states);
  const previewMode = useAnimationStore((s) => s.previewMode);

  // Find states triggered by this element
  const triggerStates = useMemo(() => {
    return states.filter(
      (s) =>
        s.trigger.element?.targetElementId === elementId &&
        ["hover", "click", "focus"].includes(s.trigger.type)
    );
  }, [states, elementId]);

  if (triggerStates.length === 0) return null;

  const isHovered = previewMode.hoveredElementId === elementId;

  return (
    <div
      className={cn(
        "absolute -top-2 -right-2 transition-all duration-200",
        isHovered ? "opacity-100 scale-110" : "opacity-70"
      )}
      style={{
        transform: `scale(${Math.max(0.5, 1 / zoom)})`,
        transformOrigin: "top right",
      }}
    >
      <div className="flex items-center gap-0.5">
        {triggerStates.slice(0, 3).map((state) => (
          <TriggerIcon
            key={state.id}
            type={state.trigger.type}
            size="sm"
            className="shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}
