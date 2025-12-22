/**
 * Easing Preview Component
 *
 * Visual display of an easing curve using SVG.
 */

import { useMemo } from "react";
import type { EasingCurve } from "../types/transition";
import { getEasingControlPoints } from "../utils/easingUtils";
import { cn } from "@/lib/utils";

interface EasingPreviewProps {
  easing: EasingCurve;
  width?: number;
  height?: number;
  className?: string;
  showGrid?: boolean;
  animated?: boolean;
}

export function EasingPreview({
  easing,
  width = 100,
  height = 60,
  className,
  showGrid = true,
  animated = false,
}: EasingPreviewProps) {
  const [x1, y1, x2, y2] = getEasingControlPoints(easing);

  // Generate SVG path for the bezier curve
  const pathD = useMemo(() => {
    // Scale control points to SVG coordinates
    // SVG y-axis is inverted (0 at top)
    const padding = 8;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const startX = padding;
    const startY = height - padding;
    const endX = width - padding;
    const endY = padding;

    // Control points (scaled and y-inverted)
    const cp1x = padding + x1 * innerWidth;
    const cp1y = height - padding - y1 * innerHeight;
    const cp2x = padding + x2 * innerWidth;
    const cp2y = height - padding - y2 * innerHeight;

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }, [x1, y1, x2, y2, width, height]);

  // Generate points for control point visualization
  const controlPoints = useMemo(() => {
    const padding = 8;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    return {
      start: { x: padding, y: height - padding },
      cp1: {
        x: padding + x1 * innerWidth,
        y: height - padding - y1 * innerHeight,
      },
      cp2: {
        x: padding + x2 * innerWidth,
        y: height - padding - y2 * innerHeight,
      },
      end: { x: width - padding, y: padding },
    };
  }, [x1, y1, x2, y2, width, height]);

  return (
    <div
      className={cn(
        "bg-muted/30 rounded-md border border-border overflow-hidden",
        className
      )}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        {/* Grid lines */}
        {showGrid && (
          <g className="text-muted-foreground/20">
            {/* Horizontal lines */}
            {[0.25, 0.5, 0.75].map((y) => (
              <line
                key={`h-${y}`}
                x1={8}
                y1={8 + (height - 16) * (1 - y)}
                x2={width - 8}
                y2={8 + (height - 16) * (1 - y)}
                stroke="currentColor"
                strokeWidth={0.5}
                strokeDasharray="2 2"
              />
            ))}
            {/* Vertical lines */}
            {[0.25, 0.5, 0.75].map((x) => (
              <line
                key={`v-${x}`}
                x1={8 + (width - 16) * x}
                y1={8}
                x2={8 + (width - 16) * x}
                y2={height - 8}
                stroke="currentColor"
                strokeWidth={0.5}
                strokeDasharray="2 2"
              />
            ))}
          </g>
        )}

        {/* Diagonal baseline (linear) */}
        <line
          x1={8}
          y1={height - 8}
          x2={width - 8}
          y2={8}
          stroke="currentColor"
          strokeWidth={0.5}
          className="text-muted-foreground/30"
        />

        {/* Control point lines */}
        <line
          x1={controlPoints.start.x}
          y1={controlPoints.start.y}
          x2={controlPoints.cp1.x}
          y2={controlPoints.cp1.y}
          stroke="currentColor"
          strokeWidth={1}
          className="text-muted-foreground/40"
        />
        <line
          x1={controlPoints.end.x}
          y1={controlPoints.end.y}
          x2={controlPoints.cp2.x}
          y2={controlPoints.cp2.y}
          stroke="currentColor"
          strokeWidth={1}
          className="text-muted-foreground/40"
        />

        {/* Bezier curve */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-primary"
          strokeLinecap="round"
        />

        {/* Control points */}
        <circle
          cx={controlPoints.cp1.x}
          cy={controlPoints.cp1.y}
          r={3}
          className="fill-primary"
        />
        <circle
          cx={controlPoints.cp2.x}
          cy={controlPoints.cp2.y}
          r={3}
          className="fill-primary"
        />

        {/* End points */}
        <circle
          cx={controlPoints.start.x}
          cy={controlPoints.start.y}
          r={2}
          className="fill-muted-foreground"
        />
        <circle
          cx={controlPoints.end.x}
          cy={controlPoints.end.y}
          r={2}
          className="fill-muted-foreground"
        />

        {/* Animated dot (if enabled) */}
        {animated && (
          <circle r={4} className="fill-primary">
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path={pathD}
              keyTimes="0;1"
              calcMode="spline"
              keySplines={`${x1} ${y1} ${x2} ${y2}`}
            />
          </circle>
        )}
      </svg>
    </div>
  );
}

/**
 * Small easing indicator for lists
 */
interface EasingIndicatorProps {
  easing: EasingCurve;
  className?: string;
}

export function EasingIndicator({ easing, className }: EasingIndicatorProps) {
  return (
    <EasingPreview
      easing={easing}
      width={40}
      height={24}
      showGrid={false}
      className={cn("border-0 bg-transparent", className)}
    />
  );
}
