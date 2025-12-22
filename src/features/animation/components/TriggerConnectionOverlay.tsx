/**
 * TriggerConnectionOverlay - SVG overlay showing connections between triggers and states
 *
 * Draws animated dashed lines from trigger source elements to their target state
 * indicators. Useful for visualizing which elements trigger which animation states.
 */

import { useMemo, useRef, useEffect, useState } from "react";
import { useAnimationStore } from "../store/animationStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { getAbsolutePosition } from "@/features/boxes/utils/boxHierarchy";
import { TRIGGER_VISUALIZATION } from "@/lib/constants";
import type { AnimationState } from "../types/animation";

interface TriggerConnectionOverlayProps {
  /** Current canvas zoom level */
  zoom: number;
  /** Current artboard ID being viewed (optional filter) */
  artboardId?: string;
  /** Whether to show all connections or just selected/active */
  showAll?: boolean;
}

interface ConnectionData {
  stateId: string;
  stateName: string;
  triggerType: AnimationState["trigger"]["type"];
  sourceElementId: string;
  sourcePosition: { x: number; y: number };
  sourceSize: { width: number; height: number };
}

export function TriggerConnectionOverlay({
  zoom,
  artboardId,
  showAll = false,
}: TriggerConnectionOverlayProps) {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const states = useAnimationStore((s) => s.states);
  const activeStateId = useAnimationStore((s) => s.activeStateId);
  const previewMode = useAnimationStore((s) => s.previewMode);

  const boxes = useBoxStore((s) => s.boxes);
  const artboards = useArtboardStore((s) => s.artboards);

  // Ref to track state list positions (passed from parent or computed)
  const [stateListPositions, setStateListPositions] = useState<
    Map<string, DOMRect>
  >(new Map());

  // Only show when connection lines are toggled on in preview mode
  // or when in animation mode with an active state
  const isVisible =
    (editorMode === "preview" && previewMode.showConnectionLines) ||
    (editorMode === "animation" && activeStateId !== null && showAll);

  // Compute connection data
  const connections = useMemo(() => {
    if (!isVisible) return [];

    const result: ConnectionData[] = [];

    // Filter states by artboard if specified
    const relevantStates = artboardId
      ? states.filter((s) => s.artboardId === artboardId)
      : states;

    for (const state of relevantStates) {
      // Only show connections for element-based triggers
      if (!["hover", "click", "focus"].includes(state.trigger.type)) {
        continue;
      }

      const targetElementId = state.trigger.element?.targetElementId;
      if (!targetElementId) continue;

      // In non-showAll mode, only show active state connection
      if (!showAll && state.id !== activeStateId) continue;

      const box = boxes.find((b) => b.id === targetElementId);
      if (!box) continue;

      // Get absolute position
      const absPos = getAbsolutePosition(box, boxes);

      let finalX = absPos.x;
      let finalY = absPos.y;

      if (box.artboardId) {
        const artboard = artboards.find((a) => a.id === box.artboardId);
        if (artboard) {
          finalX = artboard.x + box.x;
          finalY = artboard.y + box.y;
        }
      }

      result.push({
        stateId: state.id,
        stateName: state.name,
        triggerType: state.trigger.type,
        sourceElementId: targetElementId,
        sourcePosition: { x: finalX, y: finalY },
        sourceSize: { width: box.width, height: box.height },
      });
    }

    return result;
  }, [
    isVisible,
    states,
    boxes,
    artboards,
    artboardId,
    activeStateId,
    showAll,
  ]);

  // Effect to observe state list item positions
  useEffect(() => {
    const updatePositions = () => {
      const newPositions = new Map<string, DOMRect>();

      connections.forEach((conn) => {
        // Try to find the state card element in the DOM
        const stateCard = document.querySelector(
          `[data-state-id="${conn.stateId}"]`
        );
        if (stateCard) {
          newPositions.set(conn.stateId, stateCard.getBoundingClientRect());
        }
      });

      setStateListPositions(newPositions);
    };

    // Initial update
    updatePositions();

    // Update on scroll/resize
    const observer = new ResizeObserver(updatePositions);
    const scrollContainers = document.querySelectorAll("[data-state-list]");
    scrollContainers.forEach((container) => {
      observer.observe(container);
      container.addEventListener("scroll", updatePositions);
    });

    window.addEventListener("resize", updatePositions);

    return () => {
      observer.disconnect();
      scrollContainers.forEach((container) => {
        container.removeEventListener("scroll", updatePositions);
      });
      window.removeEventListener("resize", updatePositions);
    };
  }, [connections]);

  if (!isVisible || connections.length === 0) {
    return null;
  }

  const lineConfig = TRIGGER_VISUALIZATION.CONNECTION_LINE;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 50 }}
    >
      <defs>
        {/* Animated dash pattern */}
        <style>
          {`
            @keyframes dash-flow {
              to {
                stroke-dashoffset: -20;
              }
            }
            .connection-line {
              animation: dash-flow ${lineConfig.ANIMATION_DURATION} linear infinite;
            }
          `}
        </style>

        {/* Gradient definitions for each trigger type */}
        {connections.map((conn) => {
          const color =
            TRIGGER_VISUALIZATION.COLORS[conn.triggerType]?.stroke || "#888";
          return (
            <linearGradient
              key={`gradient-${conn.stateId}`}
              id={`connection-gradient-${conn.stateId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="50%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </linearGradient>
          );
        })}

        {/* Arrow marker */}
        <marker
          id="connection-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0,0 L 8,4 L 0,8 L 2,4 Z" fill="currentColor" />
        </marker>
      </defs>

      {connections.map((conn) => {
        const color =
          TRIGGER_VISUALIZATION.COLORS[conn.triggerType]?.stroke || "#888";
        const isActive = conn.stateId === activeStateId;
        const isHovered = previewMode.hoveredElementId === conn.sourceElementId;

        // Calculate source point (center-top of element)
        const sourceX = conn.sourcePosition.x + conn.sourceSize.width / 2;
        const sourceY = conn.sourcePosition.y;

        // For now, draw a curved line upward as visual indicator
        // In full implementation, this would connect to the state list
        const controlY = sourceY - 50;
        const endY = sourceY - 80;

        return (
          <g key={conn.stateId}>
            {/* Glow effect for active/hovered connections */}
            {(isActive || isHovered) && (
              <path
                d={`M ${sourceX} ${sourceY} Q ${sourceX} ${controlY} ${sourceX} ${endY}`}
                fill="none"
                stroke={color}
                strokeWidth={lineConfig.WIDTH * 3}
                strokeOpacity={0.2}
                strokeLinecap="round"
              />
            )}

            {/* Main connection line */}
            <path
              className="connection-line"
              d={`M ${sourceX} ${sourceY} Q ${sourceX} ${controlY} ${sourceX} ${endY}`}
              fill="none"
              stroke={`url(#connection-gradient-${conn.stateId})`}
              strokeWidth={isActive || isHovered ? lineConfig.WIDTH * 1.5 : lineConfig.WIDTH}
              strokeDasharray={lineConfig.DASH}
              strokeLinecap="round"
              style={{ color }}
            />

            {/* State name label at end of line */}
            <g transform={`translate(${sourceX}, ${endY - 10})`}>
              <rect
                x={-40}
                y={-10}
                width={80}
                height={20}
                rx={4}
                fill="var(--card)"
                stroke={color}
                strokeWidth={1}
                opacity={0.95}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fill="currentColor"
                fontSize={10}
                fontWeight={isActive ? 600 : 400}
                className="text-foreground"
              >
                {conn.stateName.length > 12
                  ? conn.stateName.slice(0, 10) + "..."
                  : conn.stateName}
              </text>
            </g>

            {/* Source indicator dot */}
            <circle
              cx={sourceX}
              cy={sourceY}
              r={isActive || isHovered ? 5 : 4}
              fill={color}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {(isActive || isHovered) && (
                <animate
                  attributeName="r"
                  values="4;6;4"
                  dur="1s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Simplified connection indicator for individual elements
 * Shows a small badge indicating this element triggers animations
 */
export function ElementTriggerIndicator({
  elementId,
  position,
  size,
}: {
  elementId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}) {
  const states = useAnimationStore((s) => s.states);
  const previewMode = useAnimationStore((s) => s.previewMode);

  const triggerStates = useMemo(() => {
    return states.filter(
      (s) =>
        s.trigger.element?.targetElementId === elementId &&
        ["hover", "click", "focus"].includes(s.trigger.type)
    );
  }, [states, elementId]);

  if (triggerStates.length === 0) return null;

  const isHovered = previewMode.hoveredElementId === elementId;

  // Get primary trigger color
  const primaryColor =
    TRIGGER_VISUALIZATION.COLORS[triggerStates[0].trigger.type]?.stroke ||
    "#888";

  return (
    <div
      className="absolute pointer-events-none transition-transform duration-200"
      style={{
        left: position.x + size.width - 8,
        top: position.y - 8,
        transform: isHovered ? "scale(1.2)" : "scale(1)",
      }}
    >
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-md"
        style={{ backgroundColor: primaryColor }}
      >
        {triggerStates.length}
      </div>
    </div>
  );
}
