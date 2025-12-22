import { useRef, useCallback, useState } from "react";
import { useMinimapData, useMinimapNavigation } from "../hooks/useMinimapData";
import { cn } from "@/lib/utils";

interface CanvasMinimapProps {
  className?: string;
  width?: number;
  height?: number;
}

export const CanvasMinimap = ({
  className,
  width = 200,
  height = 100,
}: CanvasMinimapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const { elements, bounds, viewport, scale } = useMinimapData({
    containerWidth: width,
    containerHeight: height,
  });
  const { navigateToPoint } = useMinimapNavigation();

  const scaledWidth = Math.min(width, bounds.width * scale);
  const scaledHeight = Math.min(height, bounds.height * scale);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || scale === 0) return;

      const rect = svgRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert minimap coordinates to canvas coordinates
      const canvasX = clickX / scale + bounds.minX;
      const canvasY = clickY / scale + bounds.minY;

      navigateToPoint(canvasX, canvasY);
    },
    [scale, bounds.minX, bounds.minY, navigateToPoint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      setHoverPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const hasContent = elements.length > 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-md",
        "bg-gradient-to-br from-card/80 to-muted/40",
        "border border-border/60",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        className
      )}
      style={{ width, height }}
    >
      {/* Blueprint grid pattern */}
      <svg
        className="absolute inset-0 pointer-events-none opacity-30"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="minimap-grid-small"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 8 0 L 0 0 0 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-muted-foreground/30"
            />
          </pattern>
          <pattern
            id="minimap-grid-large"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <rect width="40" height="40" fill="url(#minimap-grid-small)" />
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-muted-foreground/50"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#minimap-grid-large)" />
      </svg>

      {!hasContent ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">
            Empty Canvas
          </span>
        </div>
      ) : (
        <svg
          ref={svgRef}
          width={scaledWidth}
          height={scaledHeight}
          viewBox={`0 0 ${scaledWidth} ${scaledHeight}`}
          className="cursor-crosshair relative"
          onClick={handleClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleMouseMove}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <defs>
            {/* Viewport glow filter */}
            <filter id="viewport-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Selection highlight gradient */}
            <linearGradient id="selection-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.5" />
            </linearGradient>

            {/* Artboard pattern fill */}
            <pattern
              id="artboard-pattern"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.5" fill="currentColor" className="text-border" />
            </pattern>
          </defs>

          {/* Render artboards (background layer) */}
          {elements
            .filter((el) => el.type === "artboard")
            .map((el) => (
              <g key={el.id}>
                <rect
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  fill="url(#artboard-pattern)"
                  stroke="var(--border)"
                  strokeWidth="1"
                  rx="1"
                  opacity="0.6"
                />
                {/* Artboard label line */}
                <line
                  x1={el.x}
                  y1={el.y - 2}
                  x2={el.x + Math.min(el.width, 20)}
                  y2={el.y - 2}
                  stroke="var(--muted-foreground)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </g>
            ))}

          {/* Render boxes */}
          {elements
            .filter((el) => el.type === "box")
            .map((el) => (
              <rect
                key={el.id}
                x={el.x}
                y={el.y}
                width={Math.max(el.width, 2)}
                height={Math.max(el.height, 2)}
                fill={el.isSelected ? "url(#selection-gradient)" : "var(--foreground)"}
                fillOpacity={el.isSelected ? 1 : el.isNested ? 0.25 : 0.4}
                stroke={el.isSelected ? "var(--primary)" : el.isNested ? "var(--muted-foreground)" : "var(--foreground)"}
                strokeWidth={el.isSelected ? 1.5 : 0.5}
                strokeOpacity={el.isSelected ? 1 : 0.6}
                rx="0.5"
                className={cn(
                  "transition-all duration-150",
                  el.isSelected && "drop-shadow-sm"
                )}
              />
            ))}

          {/* Render lines */}
          {elements
            .filter((el) => el.type === "line")
            .map((el) => (
              <line
                key={el.id}
                x1={el.startX}
                y1={el.startY}
                x2={el.endX}
                y2={el.endY}
                stroke={el.isSelected ? "var(--primary)" : "var(--muted-foreground)"}
                strokeWidth={el.isSelected ? 2 : 1}
                strokeLinecap="round"
                opacity={el.isSelected ? 1 : 0.6}
                className="transition-all duration-150"
              />
            ))}

          {/* Viewport indicator */}
          <g filter={isHovering ? "url(#viewport-glow)" : undefined}>
            {/* Viewport fill */}
            <rect
              x={viewport.x}
              y={viewport.y}
              width={Math.max(viewport.width, 4)}
              height={Math.max(viewport.height, 4)}
              fill="var(--primary)"
              fillOpacity={isHovering ? 0.12 : 0.08}
              rx="1"
              className="transition-all duration-200"
            />
            {/* Viewport border */}
            <rect
              x={viewport.x}
              y={viewport.y}
              width={Math.max(viewport.width, 4)}
              height={Math.max(viewport.height, 4)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={isHovering ? 2 : 1.5}
              strokeDasharray={isHovering ? "none" : "3 2"}
              rx="1"
              className="transition-all duration-200"
              style={{
                filter: isHovering ? "drop-shadow(0 0 3px var(--primary))" : undefined,
              }}
            />
            {/* Corner markers */}
            {isHovering && (
              <>
                <circle cx={viewport.x} cy={viewport.y} r="2" fill="var(--primary)" />
                <circle cx={viewport.x + viewport.width} cy={viewport.y} r="2" fill="var(--primary)" />
                <circle cx={viewport.x} cy={viewport.y + viewport.height} r="2" fill="var(--primary)" />
                <circle cx={viewport.x + viewport.width} cy={viewport.y + viewport.height} r="2" fill="var(--primary)" />
              </>
            )}
          </g>

          {/* Hover crosshair indicator */}
          {isHovering && (
            <g opacity="0.5" pointerEvents="none">
              <line
                x1={hoverPos.x}
                y1={0}
                x2={hoverPos.x}
                y2={scaledHeight}
                stroke="var(--primary)"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
              <line
                x1={0}
                y1={hoverPos.y}
                x2={scaledWidth}
                y2={hoverPos.y}
                stroke="var(--primary)"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 bg-gradient-to-t from-background/80 to-transparent">
        <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground/70">
          <span className="uppercase tracking-wider">Overview</span>
          <span>
            {Math.round(bounds.width)}x{Math.round(bounds.height)}
          </span>
        </div>
      </div>

      {/* Click hint */}
      {isHovering && (
        <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-primary/90 text-[7px] font-medium text-primary-foreground uppercase tracking-wider pointer-events-none">
          Click to navigate
        </div>
      )}
    </div>
  );
};
