import React, { useCallback, useMemo } from "react";
import type { Line as LineType } from "@/types/line";
import { LINE_CONSTANTS } from "@/lib/constants";
import { getLineDashArray } from "../utils/lineHelpers";
import { getPointAlongLine } from "../utils/lineGeometry";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useAnimationStore } from "@/features/animation/store/animationStore";
import { getLineAbsolutePosition } from "../utils/lineHierarchy";
import { getNestingDepth } from "@/features/boxes/utils/boxHierarchy";

interface LineProps {
  line: LineType;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDragStart?: (
    lineId: string,
    clientX: number,
    clientY: number,
    handle: "line" | "start" | "end"
  ) => void;
  isDragging?: boolean;
  dragPreviewPosition?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  zoom?: number;
  isNested?: boolean;
}

export const Line = React.memo(function Line({
  line,
  isSelected,
  onSelect,
  onDragStart,
  isDragging,
  dragPreviewPosition,
  zoom = 1,
  isNested = false,
}: LineProps) {
  const boxes = useBoxStore((state) => state.boxes);
  const isSpacebarPressed = useCanvasStore(
    (state) => state.interaction.isSpacebarPressed
  );
  const editorMode = useAnimationStore((s) => s.editorMode);
  const isPreviewMode = editorMode === "preview";

  const renderPosition = useMemo(() => {
    if (dragPreviewPosition) {
      return dragPreviewPosition;
    }

    if (isNested) {
      return {
        startX: line.startX,
        startY: line.startY,
        endX: line.endX,
        endY: line.endY,
      };
    }

    if (line.parentId) {
      return getLineAbsolutePosition(line, boxes);
    }

    return {
      startX: line.startX,
      startY: line.startY,
      endX: line.endX,
      endY: line.endY,
    };
  }, [line, boxes, dragPreviewPosition, isNested]);

  const startX = renderPosition.startX;
  const startY = renderPosition.startY;
  const endX = renderPosition.endX;
  const endY = renderPosition.endY;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: "line" | "start" | "end" = "line") => {
      // Block interactions in preview mode
      if (isPreviewMode) {
        e.stopPropagation();
        return;
      }

      if (isSpacebarPressed) return;

      e.stopPropagation();

      if (line.locked) return;

      if (e.button === 0) {
        onSelect(line.id, e.shiftKey);

        if (onDragStart) {
          onDragStart(line.id, e.clientX, e.clientY, handle);
        }
      }
    },
    [line.id, line.locked, onSelect, onDragStart, isSpacebarPressed, isPreviewMode]
  );

  const dashArray = useMemo(
    () => getLineDashArray(line.lineStyle),
    [line.lineStyle]
  );

  const labelPosition = useMemo(() => {
    if (!line.label?.text) return null;

    const positionMap = { start: 0.1, middle: 0.5, end: 0.9 };
    const t = positionMap[line.label.position];
    return getPointAlongLine({ ...line, startX, startY, endX, endY }, t);
  }, [line, startX, startY, endX, endY]);

  const nestingDepth = useMemo(() => {
    if (!line.parentId) return 0;
    const parentDepth = getNestingDepth(line.parentId, boxes);
    return parentDepth + 1;
  }, [line.parentId, boxes]);

  const midpoint = useMemo(
    () => ({
      x: (startX + endX) / 2,
      y: (startY + endY) / 2,
    }),
    [startX, startY, endX, endY]
  );

  const startMarkerId = `arrow-start-${line.id}-${line.startArrow}`;
  const endMarkerId = `arrow-end-${line.id}-${line.endArrow}`;

  const getArrowMarker = (
    id: string,
    style: LineType["startArrow"],
    isStart: boolean
  ) => {
    if (style === "none") return null;

    const color = isSelected
      ? LINE_CONSTANTS.SELECTION_OUTLINE_COLOR
      : "var(--foreground)";

    if (style === "simple") {
      const path = isStart ? "M 10 0 L 0 5 L 10 10" : "M 0 0 L 10 5 L 0 10";
      return (
        <marker
          id={id}
          markerWidth="10"
          markerHeight="10"
          refX={isStart ? "0" : "10"}
          refY="5"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
        </marker>
      );
    }

    if (style === "filled") {
      const path = isStart ? "M 10 0 L 0 5 L 10 10 Z" : "M 0 0 L 10 5 L 0 10 Z";
      return (
        <marker
          id={id}
          markerWidth="10"
          markerHeight="10"
          refX={isStart ? "0" : "10"}
          refY="5"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d={path} fill={color} />
        </marker>
      );
    }

    return null;
  };

  const handleSize = LINE_CONSTANTS.ENDPOINT_HANDLE_SIZE / zoom;

  if (line.visible === false) return null;

  return (
    <g
      style={{
        opacity: isDragging ? 0.6 : 1,
        cursor: line.locked ? "not-allowed" : "move",
      }}
    >
      <defs>
        {getArrowMarker(startMarkerId, line.startArrow, true)}
        {getArrowMarker(endMarkerId, line.endArrow, false)}
      </defs>

      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="transparent"
        strokeWidth={Math.max(10, 10 / zoom)}
        style={{ cursor: line.locked ? "not-allowed" : "pointer" }}
        onMouseDown={(e) => handleMouseDown(e, "line")}
      />

      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={isSelected ? LINE_CONSTANTS.SELECTION_OUTLINE_COLOR : "var(--foreground)"}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={dashArray !== "none" ? dashArray : undefined}
        markerStart={
          line.startArrow !== "none" ? `url(#${startMarkerId})` : undefined
        }
        markerEnd={
          line.endArrow !== "none" ? `url(#${endMarkerId})` : undefined
        }
        style={{ pointerEvents: "none" }}
      />

      {isSelected && (
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={LINE_CONSTANTS.SELECTION_OUTLINE_COLOR}
          strokeWidth={4}
          strokeOpacity={0.3}
          style={{ pointerEvents: "none" }}
        />
      )}

      {isSelected && !line.locked && (
        <>
          <rect
            x={startX - handleSize / 2}
            y={startY - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="var(--background)"
            stroke={LINE_CONSTANTS.SELECTION_OUTLINE_COLOR}
            strokeWidth={1.5}
            style={{ cursor: "grab" }}
            onMouseDown={(e) => handleMouseDown(e, "start")}
          />

          <rect
            x={endX - handleSize / 2}
            y={endY - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="var(--background)"
            stroke={LINE_CONSTANTS.SELECTION_OUTLINE_COLOR}
            strokeWidth={1.5}
            style={{ cursor: "grab" }}
            onMouseDown={(e) => handleMouseDown(e, "end")}
          />
        </>
      )}

      {line.startConnection && (
        <circle
          cx={startX}
          cy={startY}
          r={4 / zoom}
          fill={LINE_CONSTANTS.SELECTION_OUTLINE_COLOR}
          style={{ pointerEvents: "none" }}
        />
      )}
      {line.endConnection && (
        <circle
          cx={endX}
          cy={endY}
          r={4 / zoom}
          fill={LINE_CONSTANTS.SELECTION_OUTLINE_COLOR}
          style={{ pointerEvents: "none" }}
        />
      )}

      {line.label?.text && labelPosition && (
        <g transform={`translate(${labelPosition.x}, ${labelPosition.y})`}>
          <rect
            x={-4}
            y={-12}
            width={line.label.text.length * 7 + 8}
            height={16}
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={1}
            rx={2}
          />
          <text
            x={0}
            y={0}
            fontSize={12}
            fill="var(--foreground)"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {line.label.text}
          </text>
        </g>
      )}

      {nestingDepth > 0 && (
        <g
          transform={`translate(${midpoint.x}, ${midpoint.y - 12})`}
          style={{ pointerEvents: "none" }}
        >
          <rect
            x={-10}
            y={-8}
            width={20}
            height={14}
            rx={2}
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={0.5}
          />
          <text
            x={0}
            y={2}
            fontSize={9}
            fontFamily="monospace"
            fill="var(--muted-foreground)"
            textAnchor="middle"
            style={{ userSelect: "none" }}
          >
            L{nestingDepth}
          </text>
        </g>
      )}
    </g>
  );
});
