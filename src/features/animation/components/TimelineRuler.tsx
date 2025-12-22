/**
 * Timeline Ruler Component
 *
 * Professional time ruler with dynamic tick intervals,
 * sticky positioning, and synchronized horizontal scroll.
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TimelineRulerProps {
  totalDuration: number;
  pixelsPerMs: number;
  offsetX: number;
  leftPadding?: number;
  className?: string;
}

export function TimelineRuler({
  totalDuration,
  pixelsPerMs,
  offsetX,
  leftPadding = 120,
  className,
}: TimelineRulerProps) {
  // Calculate optimal tick interval based on zoom level and duration
  const { majorInterval, minorInterval, labelFormat } = useMemo(() => {
    // Determine tick intervals based on zoom level
    // Aim for major ticks roughly every 60-120 pixels
    const targetMajorPixels = 90;
    const targetMajorMs = targetMajorPixels / pixelsPerMs;

    // Snap to nice intervals: 100ms, 250ms, 500ms, 1000ms, 2000ms, 5000ms
    const niceIntervals = [100, 250, 500, 1000, 2000, 5000, 10000];
    let major = niceIntervals.find((i) => i >= targetMajorMs) ?? 10000;

    // Minor ticks are a fraction of major
    let minor: number;
    if (major <= 250) {
      minor = 50;
    } else if (major <= 500) {
      minor = 100;
    } else if (major <= 1000) {
      minor = 250;
    } else if (major <= 2000) {
      minor = 500;
    } else {
      minor = 1000;
    }

    // Label format based on duration
    let format: "ms" | "s" | "m:s";
    if (totalDuration < 3000) {
      format = "ms";
    } else if (totalDuration < 60000) {
      format = "s";
    } else {
      format = "m:s";
    }

    return { majorInterval: major, minorInterval: minor, labelFormat: format };
  }, [totalDuration, pixelsPerMs]);

  // Generate ticks
  const ticks = useMemo(() => {
    const result: { time: number; label: string; major: boolean }[] = [];
    const endTime = totalDuration + majorInterval;

    for (let time = 0; time <= endTime; time += minorInterval) {
      const isMajor = time % majorInterval === 0;

      let label = "";
      if (isMajor) {
        if (labelFormat === "ms") {
          label = `${time}ms`;
        } else if (labelFormat === "s") {
          label = `${(time / 1000).toFixed(1)}s`;
        } else {
          const minutes = Math.floor(time / 60000);
          const seconds = Math.floor((time % 60000) / 1000);
          label = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        }
      }

      result.push({ time, label, major: isMajor });
    }

    return result;
  }, [totalDuration, majorInterval, minorInterval, labelFormat]);

  const totalWidth = totalDuration * pixelsPerMs + 100;

  return (
    <div
      className={cn(
        "relative h-full bg-gradient-to-b from-muted/40 to-muted/20",
        className
      )}
      style={{ overflow: "clip" }} // Use clip instead of hidden to allow positioned elements to render
    >
      {/* Fixed left area (matches track labels) */}
      <div
        className="absolute left-0 top-0 h-full bg-gradient-to-r from-background via-background to-background/95 z-10 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.08)]"
        style={{ width: leftPadding }}
      >
        <div className="h-full flex items-center px-2">
          <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
            Time
          </span>
        </div>
      </div>

      {/* Scrollable tick area */}
      <div
        className="absolute h-full"
        style={{
          left: leftPadding,
          width: totalWidth,
          transform: `translateX(${-offsetX}px)`,
        }}
      >
        {ticks.map(({ time, label, major }) => {
          const x = time * pixelsPerMs;

          return (
            <div
              key={time}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: x }}
            >
              {/* Tick mark */}
              <div
                className={cn(
                  "w-px transition-colors duration-150",
                  major
                    ? "h-3.5 bg-foreground/35"
                    : "h-2 bg-foreground/15 mt-1.5"
                )}
              />

              {/* Label for major ticks */}
              {label && (
                <span
                  className={cn(
                    "text-[9px] font-mono tabular-nums text-muted-foreground/70",
                    "whitespace-nowrap mt-0.5",
                    // Center the label on the tick
                    "-translate-x-1/2"
                  )}
                  style={{
                    // Prevent label from extending past container edges
                    marginLeft: time === 0 ? "50%" : undefined,
                  }}
                >
                  {label}
                </span>
              )}
            </div>
          );
        })}

        {/* Zero line indicator */}
        <div
          className="absolute top-0 w-0.5 h-full bg-primary/40"
          style={{ left: 0 }}
        />
      </div>

      {/* Bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border/60" />
    </div>
  );
}
