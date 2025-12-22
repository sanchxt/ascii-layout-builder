/**
 * StateThumbnail - Schematic preview of animation state elements
 *
 * Renders a simple SVG representation of element positions and sizes
 * within an animation state. Uses a mini-map style visualization.
 */

import { useMemo } from "react";
import type { AnimationStateElement } from "../types/animation";
import { cn } from "@/lib/utils";

interface StateThumbnailProps {
  elements: AnimationStateElement[];
  isActive?: boolean;
  className?: string;
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Calculate bounding box that contains all elements
 */
function calculateBoundingBox(elements: AnimationStateElement[]): BoundingBox {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 60, width: 100, height: 60 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const x = el.x + (el.translateX ?? 0);
    const y = el.y + (el.translateY ?? 0);
    const width = el.width * el.scale;
    const height = el.height * el.scale;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  // Add padding
  const padding = 10;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export const StateThumbnail = ({
  elements,
  isActive = false,
  className,
}: StateThumbnailProps) => {
  const visibleElements = elements.filter((el) => el.visible);

  const { viewBox, scaledElements } = useMemo(() => {
    const bbox = calculateBoundingBox(visibleElements);

    // Calculate scale to fit within thumbnail (16:9 aspect ratio)
    const thumbnailWidth = 160;
    const thumbnailHeight = 100;
    const scaleX = thumbnailWidth / bbox.width;
    const scaleY = thumbnailHeight / bbox.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

    // Calculate centered viewBox
    const scaledWidth = bbox.width * scale;
    const scaledHeight = bbox.height * scale;
    const offsetX = (thumbnailWidth - scaledWidth) / 2;
    const offsetY = (thumbnailHeight - scaledHeight) / 2;

    // Transform elements to thumbnail coordinates
    const scaled = visibleElements.map((el) => {
      const x = el.x + (el.translateX ?? 0);
      const y = el.y + (el.translateY ?? 0);
      const width = el.width * el.scale;
      const height = el.height * el.scale;

      return {
        id: el.elementId,
        x: offsetX + (x - bbox.minX) * scale,
        y: offsetY + (y - bbox.minY) * scale,
        width: width * scale,
        height: height * scale,
        opacity: el.opacity,
        rotation: el.rotation,
      };
    });

    return {
      boundingBox: bbox,
      viewBox: `0 0 ${thumbnailWidth} ${thumbnailHeight}`,
      scaledElements: scaled,
    };
  }, [visibleElements]);

  const strokeColor = isActive
    ? "var(--color-purple-400)"
    : "var(--color-muted-foreground)";
  const fillColor = isActive
    ? "var(--color-purple-500)"
    : "var(--color-muted-foreground)";

  if (visibleElements.length === 0) {
    return (
      <div
        className={cn(
          "aspect-video rounded-md flex items-center justify-center border",
          isActive
            ? "bg-purple-500/5 border-purple-500/30"
            : "bg-muted border-border/50",
          className
        )}
      >
        <span
          className={cn(
            "text-[10px]",
            isActive ? "text-purple-400" : "text-muted-foreground/50"
          )}
        >
          No elements
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "aspect-video rounded-md overflow-hidden border",
        isActive
          ? "bg-purple-500/5 border-purple-500/30"
          : "bg-muted/30 border-border/50",
        className
      )}
    >
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background pattern */}
        <defs>
          <pattern
            id={`grid-${isActive ? "active" : "inactive"}`}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="1"
              cy="1"
              r="0.5"
              fill={isActive ? "rgba(168, 85, 247, 0.15)" : "rgba(0, 0, 0, 0.05)"}
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#grid-${isActive ? "active" : "inactive"})`}
        />

        {/* Element rectangles */}
        {scaledElements.map((el) => (
          <g
            key={el.id}
            style={{
              transform: `rotate(${el.rotation}deg)`,
              transformOrigin: `${el.x + el.width / 2}px ${el.y + el.height / 2}px`,
            }}
          >
            <rect
              x={el.x}
              y={el.y}
              width={Math.max(el.width, 2)}
              height={Math.max(el.height, 2)}
              fill={fillColor}
              fillOpacity={el.opacity * 0.2}
              stroke={strokeColor}
              strokeWidth={isActive ? 1.5 : 1}
              strokeOpacity={el.opacity * 0.6}
              rx={1}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
