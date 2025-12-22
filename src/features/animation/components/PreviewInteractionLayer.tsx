/**
 * PreviewInteractionLayer - Transparent overlay for handling preview interactions
 *
 * Creates interactive hit areas over trigger elements that respond to
 * hover, click, and focus events in preview mode without interfering
 * with the actual canvas editing.
 */

import { useMemo, useCallback } from "react";
import { useAnimationStore } from "../store/animationStore";
import { usePreviewMode, useElementTriggers } from "../hooks/usePreviewMode";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { getAbsolutePosition } from "@/features/boxes/utils/boxHierarchy";
import { TRIGGER_VISUALIZATION } from "@/lib/constants";
import { TriggerIcon } from "./TriggerBadge";
import { cn } from "@/lib/utils";

interface PreviewInteractionLayerProps {
  /** Current canvas zoom level */
  zoom: number;
  /** Optional artboard filter */
  artboardId?: string;
}

/**
 * Main interaction layer that renders hit areas over trigger elements
 */
export function PreviewInteractionLayer({
  zoom,
  artboardId,
}: PreviewInteractionLayerProps) {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const boxes = useBoxStore((s) => s.boxes);

  const { handleElementHover, handleElementClick, triggerElements } =
    usePreviewMode({ artboardId });

  // Only show in preview mode
  if (editorMode !== "preview") return null;

  // Get unique trigger elements with their positions
  const triggerHitAreas = useMemo(() => {
    const areas: Array<{
      elementId: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }> = [];

    for (const elementId of triggerElements) {
      const box = boxes.find((b) => b.id === elementId);
      if (!box) continue;

      // Filter by artboard if specified
      if (artboardId && box.artboardId !== artboardId) continue;

      // getAbsolutePosition already handles:
      // - Artboard offset for artboard boxes
      // - Parent-relative to absolute conversion for nested boxes
      const absPos = getAbsolutePosition(box, boxes);

      areas.push({
        elementId,
        position: { x: absPos.x, y: absPos.y },
        size: { width: box.width, height: box.height },
      });
    }

    return areas;
  }, [triggerElements, boxes, artboardId]);

  if (triggerHitAreas.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[9999]">
      {triggerHitAreas.map((area) => (
        <TriggerHitArea
          key={area.elementId}
          elementId={area.elementId}
          position={area.position}
          size={area.size}
          zoom={zoom}
          artboardId={artboardId}
          onHover={handleElementHover}
          onClick={handleElementClick}
        />
      ))}
    </div>
  );
}

/**
 * Individual hit area for a trigger element
 */
interface TriggerHitAreaProps {
  elementId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zoom: number;
  artboardId?: string;
  onHover: (elementId: string | null) => void;
  onClick: (elementId: string) => void;
}

function TriggerHitArea({
  elementId,
  position,
  size,
  zoom,
  artboardId,
  onHover,
  onClick,
}: TriggerHitAreaProps) {
  const { triggers, isHovered, isActiveTarget, triggerTypes } =
    useElementTriggers(elementId, artboardId);

  const handleMouseEnter = useCallback(() => {
    onHover(elementId);
  }, [elementId, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(elementId);
    },
    [elementId, onClick]
  );

  // Get trigger colors for visual feedback
  const primaryTriggerType = triggerTypes[0];
  const colors = primaryTriggerType
    ? TRIGGER_VISUALIZATION.COLORS[primaryTriggerType]
    : null;

  // Determine cursor based on trigger types
  const cursor = triggerTypes.includes("click")
    ? "pointer"
    : triggerTypes.includes("hover")
    ? "default"
    : "default";

  return (
    <div
      className={cn(
        "absolute pointer-events-auto transition-all duration-200",
        isHovered && "z-50"
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Highlight overlay when hovered/active */}
      <div
        className={cn(
          "absolute inset-0 rounded transition-all duration-200 pointer-events-none",
          isHovered && "ring-2 ring-offset-2 ring-offset-transparent",
          isActiveTarget && "ring-2 ring-offset-2 ring-offset-transparent"
        )}
        style={{
          backgroundColor: isHovered || isActiveTarget
            ? colors?.fill || "rgba(168, 85, 247, 0.1)"
            : "transparent",
          ringColor: colors?.stroke || "rgb(168, 85, 247)",
        }}
      />

      {/* Glow effect */}
      {(isHovered || isActiveTarget) && (
        <div
          className="absolute inset-0 rounded pointer-events-none animate-pulse"
          style={{
            boxShadow: `0 0 20px ${colors?.stroke || "rgb(168, 85, 247)"}40`,
          }}
        />
      )}

      {/* Trigger type indicator on hover */}
      {isHovered && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-1 bg-card/95 backdrop-blur-sm rounded-md border border-border shadow-lg whitespace-nowrap"
          style={{
            transform: `translate(-50%, 0) scale(${Math.max(0.6, 1 / zoom)})`,
            transformOrigin: "center bottom",
          }}
        >
          {triggers.slice(0, 3).map((t) => (
            <TriggerIcon key={t.id} type={t.trigger.type} size="sm" />
          ))}
          {triggers.length > 3 && (
            <span className="text-[9px] text-muted-foreground ml-0.5">
              +{triggers.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Click ripple effect */}
      {isActiveTarget && triggerTypes.includes("click") && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-8 h-8 rounded-full animate-ping"
            style={{
              backgroundColor: colors?.stroke || "rgb(168, 85, 247)",
              opacity: 0.3,
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Simplified interaction indicator that can be used on Box components
 */
export function BoxPreviewIndicator({
  elementId,
  isVisible = true,
}: {
  elementId: string;
  isVisible?: boolean;
}) {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const { triggers, isHovered, isActiveTarget } = useElementTriggers(elementId);

  if (editorMode !== "preview" || !isVisible || triggers.length === 0) {
    return null;
  }

  const primaryColor =
    TRIGGER_VISUALIZATION.COLORS[triggers[0].trigger.type]?.stroke ||
    "rgb(168, 85, 247)";

  return (
    <>
      {/* Corner indicator */}
      <div
        className={cn(
          "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow-md transition-transform duration-200",
          isHovered && "scale-125"
        )}
        style={{ backgroundColor: primaryColor }}
      >
        {triggers.length}
      </div>

      {/* Border highlight */}
      {(isHovered || isActiveTarget) && (
        <div
          className="absolute inset-0 rounded border-2 pointer-events-none"
          style={{
            borderColor: primaryColor,
            boxShadow: `0 0 10px ${primaryColor}40`,
          }}
        />
      )}
    </>
  );
}
