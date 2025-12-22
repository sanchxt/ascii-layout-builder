/**
 * Mini Easing Preview Component
 *
 * Tiny easing curve indicator for timeline transition blocks.
 * Shows a simplified bezier curve without grid or control points.
 */

import { useMemo } from "react";
import type { EasingCurve } from "../types/transition";
import { getEasingControlPoints } from "../utils/easingUtils";
import { cn } from "@/lib/utils";

interface MiniEasingPreviewProps {
  easing: EasingCurve;
  width?: number;
  height?: number;
  className?: string;
}

export function MiniEasingPreview({
  easing,
  width = 24,
  height = 16,
  className,
}: MiniEasingPreviewProps) {
  const [x1, y1, x2, y2] = getEasingControlPoints(easing);

  // Generate SVG path for the bezier curve
  const pathD = useMemo(() => {
    const padding = 2;
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

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block shrink-0", className)}
    >
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        className="text-muted-foreground"
      />
    </svg>
  );
}
