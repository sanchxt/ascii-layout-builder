/**
 * Bezier Graph Editor Component
 *
 * Interactive SVG-based bezier curve editor with draggable control points.
 * Allows visual customization of easing curves.
 */

import React, { useState, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  clampBezierControlPoints,
  roundBezierControlPoints,
} from "../utils/easingUtils";

interface BezierGraphEditorProps {
  controlPoints: [number, number, number, number]; // [x1, y1, x2, y2]
  onChange: (points: [number, number, number, number]) => void;
  width?: number;
  height?: number;
  disabled?: boolean;
  className?: string;
}

export function BezierGraphEditor({
  controlPoints,
  onChange,
  width = 300,
  height = 150,
  disabled = false,
  className,
}: BezierGraphEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingPoint, setDraggingPoint] = useState<0 | 1 | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<0 | 1 | null>(null);

  const [x1, y1, x2, y2] = controlPoints;

  const padding = 16;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // Y-axis range to accommodate overshoot (-0.5 to 1.5)
  const yMin = -0.5;
  const yMax = 1.5;
  const yRange = yMax - yMin;

  // Convert normalized bezier coordinates to SVG coordinates
  const toSvg = useCallback(
    (nx: number, ny: number): [number, number] => {
      const svgX = padding + nx * innerWidth;
      // Map y from [yMin, yMax] to [height - padding, padding] (inverted)
      const normalizedY = (ny - yMin) / yRange;
      const svgY = height - padding - normalizedY * innerHeight;
      return [svgX, svgY];
    },
    [innerWidth, innerHeight, height, yMin, yRange]
  );

  // Convert SVG coordinates to normalized bezier coordinates
  const toNormalized = useCallback(
    (svgX: number, svgY: number): [number, number] => {
      const nx = (svgX - padding) / innerWidth;
      const invertedY = (height - padding - svgY) / innerHeight;
      const ny = yMin + invertedY * yRange;
      return [nx, ny];
    },
    [innerWidth, innerHeight, height, yMin, yRange]
  );

  // Calculate SVG positions
  const [startX, startY] = toSvg(0, 0);
  const [endX, endY] = toSvg(1, 1);
  const [cp1x, cp1y] = toSvg(x1, y1);
  const [cp2x, cp2y] = toSvg(x2, y2);

  // Generate the bezier path
  const pathD = useMemo(() => {
    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }, [startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY]);

  // Handle pointer events
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, pointIndex: 0 | 1) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      setDraggingPoint(pointIndex);
    },
    [disabled]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingPoint === null || disabled) return;

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const svgX = e.clientX - rect.left;
      const svgY = e.clientY - rect.top;

      const [nx, ny] = toNormalized(svgX, svgY);

      // Update the appropriate control point
      let newPoints: [number, number, number, number];
      if (draggingPoint === 0) {
        newPoints = [nx, ny, x2, y2];
      } else {
        newPoints = [x1, y1, nx, ny];
      }

      // Clamp and round
      const clamped = clampBezierControlPoints(...newPoints);
      const rounded = roundBezierControlPoints(...clamped);

      onChange(rounded);
    },
    [draggingPoint, disabled, toNormalized, x1, y1, x2, y2, onChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (draggingPoint !== null) {
        (e.target as Element).releasePointerCapture(e.pointerId);
        setDraggingPoint(null);
      }
    },
    [draggingPoint]
  );

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: React.ReactElement[] = [];
    // Vertical lines at 0.25, 0.5, 0.75
    [0.25, 0.5, 0.75].forEach((x, i) => {
      const [svgX] = toSvg(x, 0);
      lines.push(
        <line
          key={`v-${i}`}
          x1={svgX}
          y1={padding}
          x2={svgX}
          y2={height - padding}
          stroke="currentColor"
          strokeWidth={0.5}
          strokeDasharray="2 2"
          className="text-muted-foreground/20"
        />
      );
    });
    // Horizontal lines at 0, 0.5, 1 (in normalized y space)
    [0, 0.5, 1].forEach((y, i) => {
      const [, svgY] = toSvg(0, y);
      lines.push(
        <line
          key={`h-${i}`}
          x1={padding}
          y1={svgY}
          x2={width - padding}
          y2={svgY}
          stroke="currentColor"
          strokeWidth={0.5}
          strokeDasharray="2 2"
          className="text-muted-foreground/20"
        />
      );
    });
    return lines;
  }, [toSvg, width, height]);

  return (
    <div
      className={cn(
        "bg-muted/30 rounded-lg border border-border overflow-hidden",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Grid lines */}
        {gridLines}

        {/* Boundary box */}
        <rect
          x={padding}
          y={padding}
          width={innerWidth}
          height={innerHeight}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.5}
          className="text-muted-foreground/30"
        />

        {/* Linear baseline (diagonal) */}
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="currentColor"
          strokeWidth={0.5}
          className="text-muted-foreground/30"
        />

        {/* Control point lines */}
        <line
          x1={startX}
          y1={startY}
          x2={cp1x}
          y2={cp1y}
          stroke="currentColor"
          strokeWidth={1}
          className="text-purple-400/60"
        />
        <line
          x1={endX}
          y1={endY}
          x2={cp2x}
          y2={cp2y}
          stroke="currentColor"
          strokeWidth={1}
          className="text-purple-400/60"
        />

        {/* Bezier curve */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="text-purple-500"
        />

        {/* Endpoints (fixed) */}
        <circle
          cx={startX}
          cy={startY}
          r={4}
          className="fill-muted-foreground"
        />
        <circle cx={endX} cy={endY} r={4} className="fill-muted-foreground" />

        {/* Control point 1 - hit area (larger, invisible) */}
        <circle
          cx={cp1x}
          cy={cp1y}
          r={14}
          fill="transparent"
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => handlePointerDown(e, 0)}
          onPointerEnter={() => setHoveredPoint(0)}
          onPointerLeave={() => setHoveredPoint(null)}
        />
        {/* Control point 1 - visual */}
        <circle
          cx={cp1x}
          cy={cp1y}
          r={draggingPoint === 0 || hoveredPoint === 0 ? 7 : 6}
          className={cn(
            "transition-all pointer-events-none",
            draggingPoint === 0
              ? "fill-purple-600"
              : hoveredPoint === 0
              ? "fill-purple-500"
              : "fill-purple-400"
          )}
        />

        {/* Control point 2 - hit area (larger, invisible) */}
        <circle
          cx={cp2x}
          cy={cp2y}
          r={14}
          fill="transparent"
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => handlePointerDown(e, 1)}
          onPointerEnter={() => setHoveredPoint(1)}
          onPointerLeave={() => setHoveredPoint(null)}
        />
        {/* Control point 2 - visual */}
        <circle
          cx={cp2x}
          cy={cp2y}
          r={draggingPoint === 1 || hoveredPoint === 1 ? 7 : 6}
          className={cn(
            "transition-all pointer-events-none",
            draggingPoint === 1
              ? "fill-purple-600"
              : hoveredPoint === 1
              ? "fill-purple-500"
              : "fill-purple-400"
          )}
        />

        {/* Labels for control points when hovered/dragging */}
        {(hoveredPoint === 0 || draggingPoint === 0) && (
          <text
            x={cp1x}
            y={cp1y - 12}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground font-mono"
          >
            {x1.toFixed(2)}, {y1.toFixed(2)}
          </text>
        )}
        {(hoveredPoint === 1 || draggingPoint === 1) && (
          <text
            x={cp2x}
            y={cp2y - 12}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground font-mono"
          >
            {x2.toFixed(2)}, {y2.toFixed(2)}
          </text>
        )}
      </svg>
    </div>
  );
}
