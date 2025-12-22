/**
 * Playback Controls Component
 *
 * Professional DAW-inspired playback controls with play/pause/stop,
 * loop toggle, speed selector, and time display.
 * Features grouped button styling and clear state indicators.
 */

import {
  Play,
  Pause,
  Square,
  Repeat,
  ChevronDown,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ANIMATION_CONSTANTS } from "@/lib/constants";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  isLooping: boolean;
  playbackSpeed: number;
  currentTime: number;
  totalDuration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onSetSpeed: (speed: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  compact?: boolean;
}

export function PlaybackControls({
  isPlaying,
  isPaused,
  isLooping,
  playbackSpeed,
  currentTime,
  totalDuration,
  onPlay,
  onPause,
  onStop,
  onToggleLoop,
  onSetSpeed,
  onSeekStart,
  onSeekEnd,
  compact = false,
}: PlaybackControlsProps) {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}s`;
  };

  const iconSize = compact ? 12 : 14;
  const isActive = isPlaying && !isPaused;

  return (
    <div className="flex items-center gap-1.5">
      {/* Transport controls group */}
      <div
        className={cn(
          "flex items-center rounded-md border border-border/50",
          "bg-muted/30 p-0.5"
        )}
      >
        {/* Seek to start */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSeekStart}
          className={cn(
            "h-6 w-6 p-0 rounded-sm",
            "text-muted-foreground hover:text-foreground"
          )}
          title="Seek to start (Home)"
        >
          <SkipBack size={iconSize} />
        </Button>

        {/* Play/Pause */}
        {isActive ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPause}
            className={cn(
              "h-6 w-6 p-0 rounded-sm",
              "text-primary hover:text-primary",
              "bg-primary/15"
            )}
            title="Pause (Space)"
          >
            <Pause size={iconSize} />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlay}
            className={cn(
              "h-6 w-6 p-0 rounded-sm",
              "text-primary hover:text-primary hover:bg-primary/15"
            )}
            title="Play (Space)"
          >
            <Play size={iconSize} fill="currentColor" />
          </Button>
        )}

        {/* Stop */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onStop}
          className={cn(
            "h-6 w-6 p-0 rounded-sm",
            "text-muted-foreground hover:text-foreground",
            "disabled:opacity-30"
          )}
          title="Stop (Escape)"
          disabled={!isPlaying && !isPaused}
        >
          <Square size={iconSize} />
        </Button>

        {/* Seek to end */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSeekEnd}
          className={cn(
            "h-6 w-6 p-0 rounded-sm",
            "text-muted-foreground hover:text-foreground"
          )}
          title="Seek to end (End)"
        >
          <SkipForward size={iconSize} />
        </Button>
      </div>

      {/* Loop toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleLoop}
        className={cn(
          "h-6 w-6 p-0 rounded-md",
          isLooping
            ? "text-primary bg-primary/15 hover:bg-primary/20"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Toggle loop (L)"
      >
        <Repeat size={iconSize} />
      </Button>

      {/* Speed selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-1.5 gap-0.5 rounded-md",
              "font-mono text-[10px] tabular-nums",
              "text-muted-foreground hover:text-foreground",
              playbackSpeed !== 1 && "text-primary"
            )}
          >
            {playbackSpeed}x
            <ChevronDown size={10} className="opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[60px]">
          {ANIMATION_CONSTANTS.PLAYBACK_SPEEDS.map((speed) => (
            <DropdownMenuItem
              key={speed}
              onClick={() => onSetSpeed(speed)}
              className={cn(
                "font-mono text-xs tabular-nums justify-center",
                playbackSpeed === speed && "bg-primary/10 text-primary"
              )}
            >
              {speed}x
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Time display */}
      {!compact && (
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md",
            "bg-muted/40 border border-border/30",
            "min-w-[90px]"
          )}
        >
          <span
            className={cn(
              "font-mono text-[10px] tabular-nums tracking-tight",
              isActive ? "text-primary" : "text-foreground"
            )}
          >
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] text-muted-foreground/50">/</span>
          <span className="font-mono text-[10px] tabular-nums tracking-tight text-muted-foreground">
            {formatTime(totalDuration)}
          </span>
        </div>
      )}
    </div>
  );
}
