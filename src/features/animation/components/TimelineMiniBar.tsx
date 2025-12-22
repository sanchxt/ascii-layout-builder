/**
 * TimelineMiniBar Component
 *
 * Compact mobile timeline bar with draggable progress indicator,
 * play/pause control, and expand button.
 * Features touch-friendly interactions and visual feedback.
 */

import { useCallback, useRef } from "react";
import { Play, Pause, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePanelCoordinator } from "@/lib/store/panelCoordinatorStore";
import { useAnimationPlayback } from "../hooks/useAnimationPlayback";

interface TimelineMiniBarProps {
  artboardId: string | null;
  className?: string;
}

export function TimelineMiniBar({
  artboardId,
  className,
}: TimelineMiniBarProps) {
  const { openPanel } = usePanelCoordinator();
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    isPaused,
    currentTime,
    totalDuration,
    play,
    pause,
    seekTo,
  } = useAnimationPlayback(artboardId);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const remaining = Math.floor((ms % 1000) / 10);
    return `${seconds}.${remaining.toString().padStart(2, "0")}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const isActive = isPlaying && !isPaused;

  const handlePlayPause = () => {
    if (isActive) {
      pause();
    } else {
      play();
    }
  };

  const handleExpand = () => {
    openPanel("timeline");
  };

  // Handle progress bar click/drag for seeking
  const handleProgressInteraction = useCallback(
    (clientX: number) => {
      if (!progressRef.current || totalDuration === 0) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = x / rect.width;
      const time = percent * totalDuration;
      seekTo(time);
    },
    [totalDuration, seekTo]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleProgressInteraction(e.clientX);
    },
    [handleProgressInteraction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length > 0) {
        handleProgressInteraction(e.touches[0].clientX);
      }
    },
    [handleProgressInteraction]
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        "border-t border-border bg-background",
        "shrink-0",
        className
      )}
    >
      {/* Progress bar - draggable */}
      <div
        ref={progressRef}
        className={cn(
          "h-1.5 bg-muted cursor-pointer",
          "touch-none select-none"
        )}
        onClick={handleProgressClick}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchMove}
      >
        <div
          className={cn(
            "h-full transition-all duration-75",
            isActive ? "bg-primary" : "bg-primary/70"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="h-10 flex items-center justify-between px-2">
        {/* Left: Play/Pause */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className={cn(
              "h-8 w-8 p-0 rounded-full",
              isActive
                ? "text-primary bg-primary/15"
                : "text-primary hover:bg-primary/10"
            )}
          >
            {isActive ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" fill="currentColor" />
            )}
          </Button>

          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
            Timeline
          </span>
        </div>

        {/* Center: Time display */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded",
            "font-mono text-[10px] tabular-nums",
            "bg-muted/50"
          )}
        >
          <span className={cn(isActive && "text-primary")}>
            {formatTime(currentTime)}
          </span>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-muted-foreground">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Right: Expand button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpand}
          className="h-8 w-8 p-0 rounded-full"
          title="Expand timeline"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
