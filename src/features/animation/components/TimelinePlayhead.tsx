/**
 * Timeline Playhead Component
 *
 * Draggable vertical line indicating current playback position
 * with improved styling and glow effect during playback.
 */

import { useCallback, useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/zIndex";

interface TimelinePlayheadProps {
  currentTime: number;
  totalDuration: number;
  pixelsPerMs: number;
  offsetX: number;
  containerHeight: number;
  onSeek: (time: number) => void;
  leftPadding?: number;
  isPlaying?: boolean;
}

export function TimelinePlayhead({
  currentTime,
  totalDuration,
  pixelsPerMs,
  offsetX,
  containerHeight,
  onSeek,
  leftPadding = 120,
  isPlaying = false,
}: TimelinePlayheadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate position relative to the track area (after left padding)
  const xPosition = currentTime * pixelsPerMs - offsetX + leftPadding;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      // Account for left padding when calculating time
      const x = e.clientX - rect.left - leftPadding + offsetX;
      const time = Math.max(0, Math.min(x / pixelsPerMs, totalDuration));
      onSeek(time);
    },
    [isDragging, offsetX, pixelsPerMs, totalDuration, onSeek, leftPadding]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Don't render if playhead is outside visible area on the left (with margin)
  // No upper bound - let it extend as far as the timeline goes
  if (xPosition < leftPadding - 20) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute top-0 pointer-events-none",
        "transition-opacity duration-150",
        isDragging && "opacity-90"
      )}
      style={{
        left: xPosition,
        height: containerHeight,
        zIndex: Z_INDEX.TIMELINE_PLAYHEAD,
      }}
    >
      {/* Head triangle */}
      <div
        className={cn(
          "pointer-events-auto cursor-ew-resize",
          "-translate-x-1/2",
          "relative"
        )}
        onMouseDown={handleMouseDown}
      >
        <svg
          width="14"
          height="12"
          viewBox="0 0 14 12"
          className={cn(
            "fill-primary transition-all duration-200",
            isPlaying && "drop-shadow-[0_0_6px_oklch(var(--primary))]"
          )}
        >
          <polygon points="0,0 14,0 7,12" />
        </svg>

        {/* Glow effect when playing */}
        {isPlaying && (
          <svg
            width="14"
            height="12"
            viewBox="0 0 14 12"
            className="absolute top-0 left-0 fill-primary/40 animate-pulse"
            style={{ filter: "blur(5px)" }}
          >
            <polygon points="0,0 14,0 7,12" />
          </svg>
        )}
      </div>

      {/* Vertical line */}
      <div
        className={cn(
          "w-0.5 bg-primary pointer-events-auto cursor-ew-resize transition-shadow duration-200",
          "-translate-x-1/2",
          isPlaying && "shadow-[0_0_8px_oklch(var(--primary)/0.6)]"
        )}
        style={{ height: containerHeight - 12 }}
        onMouseDown={handleMouseDown}
      />

      {/* Time tooltip during drag */}
      {isDragging && (
        <div
          className={cn(
            "absolute top-14 left-1/2 -translate-x-1/2",
            "px-2 py-1 rounded-md",
            "bg-foreground text-background text-[10px] font-mono tabular-nums",
            "whitespace-nowrap pointer-events-none",
            "shadow-lg"
          )}
          style={{ zIndex: Z_INDEX.TIMELINE_TOOLTIP }}
        >
          {(currentTime / 1000).toFixed(2)}s
        </div>
      )}
    </div>
  );
}

/**
 * Timeline click/tap area for seeking
 */
interface TimelineSeekAreaProps {
  totalDuration: number;
  pixelsPerMs: number;
  offsetX: number;
  onSeek: (time: number) => void;
  className?: string;
  style?: CSSProperties;
}

export function TimelineSeekArea({
  totalDuration,
  pixelsPerMs,
  offsetX,
  onSeek,
  className,
  style,
}: TimelineSeekAreaProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + offsetX;
      const time = Math.max(0, Math.min(x / pixelsPerMs, totalDuration));
      onSeek(time);
    },
    [offsetX, pixelsPerMs, totalDuration, onSeek]
  );

  return (
    <div
      className={cn("cursor-crosshair", className)}
      onClick={handleClick}
      style={style}
    />
  );
}
