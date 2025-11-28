import type { Box } from "@/types/box";
import { getLayoutBadgeLabel } from "../lib/layoutParser";
import { cn } from "@/lib/utils";

interface LayoutIndicatorProps {
  box: Box;
  zoom: number;
}

export function LayoutIndicator({ box, zoom }: LayoutIndicatorProps) {
  if (!box.layout || box.layout.type === "none") {
    return null;
  }

  const label = getLayoutBadgeLabel(box.layout);

  if (!label) return null;

  const scaleFactor = Math.max(0.6, Math.min(1, 1 / zoom));

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: -20 * scaleFactor,
        left: 0,
        transform: `scale(${scaleFactor})`,
        transformOrigin: "top left",
      }}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
          box.layout.type === "flex"
            ? "bg-blue-100 text-blue-700 border border-blue-200"
            : "bg-purple-100 text-purple-700 border border-purple-200"
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function GridLinesOverlay({ box, zoom }: LayoutIndicatorProps) {
  if (!box.layout || box.layout.type !== "grid") {
    return null;
  }

  const { columns, rows, gap } = box.layout;
  const borderWidth = box.borderStyle === "double" ? 4 : 2;
  const padding = box.padding;
  const contentWidth = box.width - (borderWidth + padding) * 2;
  const contentHeight = box.height - (borderWidth + padding) * 2;

  const cellWidth = (contentWidth - (columns - 1) * gap) / columns;
  const cellHeight = (contentHeight - (rows - 1) * gap) / rows;

  const verticalLines = [];
  for (let i = 1; i < columns; i++) {
    const x = borderWidth + padding + i * (cellWidth + gap) - gap / 2;
    verticalLines.push(
      <line
        key={`v-${i}`}
        x1={x}
        y1={borderWidth + padding}
        x2={x}
        y2={box.height - borderWidth - padding}
        stroke="rgba(147, 51, 234, 0.3)"
        strokeWidth={1 / zoom}
        strokeDasharray={`${4 / zoom} ${4 / zoom}`}
      />
    );
  }

  const horizontalLines = [];
  for (let i = 1; i < rows; i++) {
    const y = borderWidth + padding + i * (cellHeight + gap) - gap / 2;
    horizontalLines.push(
      <line
        key={`h-${i}`}
        x1={borderWidth + padding}
        y1={y}
        x2={box.width - borderWidth - padding}
        y2={y}
        stroke="rgba(147, 51, 234, 0.3)"
        strokeWidth={1 / zoom}
        strokeDasharray={`${4 / zoom} ${4 / zoom}`}
      />
    );
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={box.width}
      height={box.height}
      style={{ overflow: "visible" }}
    >
      {verticalLines}
      {horizontalLines}
    </svg>
  );
}

export function FlexDirectionOverlay({ box, zoom }: LayoutIndicatorProps) {
  if (!box.layout || box.layout.type !== "flex") {
    return null;
  }

  const { direction } = box.layout;
  const isRow = direction === "row";
  const borderWidth = box.borderStyle === "double" ? 4 : 2;
  const padding = box.padding;

  const startX = borderWidth + padding + 10;
  const startY = borderWidth + padding + 10;
  const arrowLength = 30;

  const endX = isRow ? startX + arrowLength : startX;
  const endY = isRow ? startY : startY + arrowLength;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={box.width}
      height={box.height}
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id={`arrow-${box.id}`}
          markerWidth={4}
          markerHeight={4}
          refX={2}
          refY={2}
          orient="auto"
        >
          <path d="M0,0 L4,2 L0,4 Z" fill="rgba(59, 130, 246, 0.5)" />
        </marker>
      </defs>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="rgba(59, 130, 246, 0.5)"
        strokeWidth={2 / zoom}
        markerEnd={`url(#arrow-${box.id})`}
      />
    </svg>
  );
}
