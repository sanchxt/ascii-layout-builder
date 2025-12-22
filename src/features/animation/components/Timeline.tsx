/**
 * Timeline Component
 *
 * Professional DAW-inspired animation timeline with playback controls,
 * synchronized ruler and tracks, and responsive design.
 */

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { ChevronUp, ChevronDown, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ANIMATION_CONSTANTS } from "@/lib/constants";
import { useAnimationStore } from "../store/animationStore";
import { useAnimationPlayback } from "../hooks/useAnimationPlayback";
import { useAnimationShortcuts } from "../hooks/useAnimationShortcuts";
import { PlaybackControls } from "./PlaybackControls";
import { TimelineRuler } from "./TimelineRuler";
import { TimelineTrack } from "./TimelineTrack";
import { TimelinePlayhead, TimelineSeekArea } from "./TimelinePlayhead";
import { TimelineEasingEditor } from "./TimelineEasingEditor";
import { useMediaQuery } from "@/lib/useMediaQuery";

interface TimelineProps {
  artboardId: string | null;
  className?: string;
}

// Constants for timeline layout
const RULER_HEIGHT = 28;
const TRACK_HEIGHT = 40;
const LEFT_LABEL_WIDTH = 120;

export function Timeline({ artboardId, className }: TimelineProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");

  // State
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [height, setHeight] = useState<number>(
    isMobile
      ? ANIMATION_CONSTANTS.TIMELINE_MIN_HEIGHT
      : ANIMATION_CONSTANTS.TIMELINE_DEFAULT_HEIGHT
  );

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const lastAutoScrollTime = useRef(0);

  // Store selectors
  const allStates = useAnimationStore((state) => state.states);
  const selectTransition = useAnimationStore((state) => state.selectTransition);
  const selectState = useAnimationStore((state) => state.selectState);
  const selectedTransitionId = useAnimationStore(
    (state) => state.selectedTransitionId
  );

  // Auto-collapse on mobile when viewport changes
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
      setHeight(ANIMATION_CONSTANTS.TIMELINE_MIN_HEIGHT);
    }
  }, [isMobile]);

  // Memoize filtered/sorted states
  const states = useMemo(() => {
    if (!artboardId) return [];
    return allStates
      .filter((s) => s.artboardId === artboardId)
      .sort((a, b) => a.order - b.order);
  }, [allStates, artboardId]);

  // Playback hook
  const {
    isPlaying,
    isPaused,
    isLooping,
    playbackSpeed,
    currentTime,
    totalDuration,
    timeline,
    play,
    pause,
    stop,
    seekTo,
    setSpeed,
    toggleLoop,
  } = useAnimationPlayback(artboardId);

  // Keyboard shortcuts
  useAnimationShortcuts({ totalDuration });

  const pixelsPerMs = ANIMATION_CONSTANTS.TIMELINE_PX_PER_MS;

  // Auto-scroll to follow playhead during playback
  useEffect(() => {
    if (!isPlaying || isPaused || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const playheadX = currentTime * pixelsPerMs;
    const containerWidth = container.clientWidth - LEFT_LABEL_WIDTH;
    const scrollLeft = container.scrollLeft;
    const visibleStart = scrollLeft;
    const visibleEnd = scrollLeft + containerWidth;

    // Only auto-scroll at most every 100ms to avoid jitter
    const now = Date.now();
    if (now - lastAutoScrollTime.current < 100) return;

    // If playhead is outside visible area, scroll to center it
    if (playheadX < visibleStart + 50 || playheadX > visibleEnd - 50) {
      const targetScroll = Math.max(0, playheadX - containerWidth / 2);
      container.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
      lastAutoScrollTime.current = now;
    }
  }, [currentTime, isPlaying, isPaused, pixelsPerMs]);

  // Resize handling
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;

      const startY = e.clientY;
      const startHeight = height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const delta = startY - moveEvent.clientY;
        const newHeight = Math.max(
          ANIMATION_CONSTANTS.TIMELINE_MIN_HEIGHT,
          Math.min(ANIMATION_CONSTANTS.TIMELINE_MAX_HEIGHT, startHeight + delta)
        );
        setHeight(newHeight);
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [height]
  );

  // Horizontal scroll handler
  const handleScroll = useCallback(() => {
    // Force re-render to update ruler and playhead positions
    // The scroll position is read directly from the ref in render
  }, []);

  // Get current scroll offset
  const getScrollLeft = useCallback(() => {
    return scrollContainerRef.current?.scrollLeft ?? 0;
  }, []);

  // Transition click handler
  const handleTransitionClick = useCallback(
    (transitionId: string) => {
      selectTransition(transitionId);
    },
    [selectTransition]
  );

  // State click handler
  const handleStateClick = useCallback(
    (stateId: string) => {
      selectState(stateId);
      selectTransition(null);
    },
    [selectState, selectTransition]
  );

  // Close easing editor
  const handleCloseEasingEditor = useCallback(() => {
    selectTransition(null);
  }, [selectTransition]);

  // Empty state
  if (!artboardId || states.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center border-t border-border bg-muted/30",
          isMobile ? "h-16" : "h-20",
          className
        )}
      >
        <p className="text-sm text-muted-foreground">
          Create animation states to see the timeline
        </p>
      </div>
    );
  }

  // Calculate dimensions
  const tracksContentHeight = states.length * TRACK_HEIGHT;
  const totalTimelineWidth = totalDuration * pixelsPerMs + 100;
  const currentScrollLeft = getScrollLeft();

  return (
    <div
      ref={containerRef}
      data-timeline-container
      className={cn(
        "border-t border-border bg-background flex flex-col",
        "transition-[height] duration-200 ease-out",
        isCollapsed && "h-auto",
        className
      )}
      style={{ height: isCollapsed ? "auto" : height }}
    >
      {/* Resize handle */}
      {!isCollapsed && (
        <div
          className={cn(
            "h-2 cursor-ns-resize flex items-center justify-center",
            "hover:bg-primary/10 active:bg-primary/20",
            "transition-colors duration-100",
            "group"
          )}
          onMouseDown={handleResizeStart}
        >
          <GripHorizontal
            size={14}
            className="text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors"
          />
        </div>
      )}

      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-border",
          "bg-gradient-to-b from-muted/40 to-muted/20",
          isMobile ? "px-2 h-9" : "px-3 h-10"
        )}
      >
        <div className={cn("flex items-center", isMobile ? "gap-2" : "gap-3")}>
          <span
            className={cn(
              "font-semibold text-muted-foreground uppercase tracking-wider",
              isMobile ? "text-[9px]" : "text-[10px]"
            )}
          >
            Timeline
          </span>

          {/* Playback controls - hide on collapsed/mobile */}
          {!isCollapsed && !isMobile && (
            <PlaybackControls
              isPlaying={isPlaying}
              isPaused={isPaused}
              isLooping={isLooping}
              playbackSpeed={playbackSpeed}
              currentTime={currentTime}
              totalDuration={totalDuration}
              onPlay={play}
              onPause={pause}
              onStop={stop}
              onToggleLoop={toggleLoop}
              onSetSpeed={setSpeed}
              onSeekStart={() => seekTo(0)}
              onSeekEnd={() => seekTo(totalDuration)}
              compact={isTablet}
            />
          )}
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("p-0", isMobile ? "h-6 w-6" : "h-7 w-7")}
        >
          {isCollapsed ? (
            <ChevronUp size={isMobile ? 14 : 16} />
          ) : (
            <ChevronDown size={isMobile ? 14 : 16} />
          )}
        </Button>
      </div>

      {/* Content (when expanded) */}
      {!isCollapsed && timeline && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Inline easing editor (appears above tracks when transition selected) */}
          {selectedTransitionId && (
            <TimelineEasingEditor
              transitionId={selectedTransitionId}
              onClose={handleCloseEasingEditor}
            />
          )}

          {/* Timeline content area */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Ruler - sticky at top */}
            <div
              className="shrink-0 border-b border-border/50"
              style={{ height: RULER_HEIGHT, overflow: "clip" }}
            >
              <TimelineRuler
                totalDuration={totalDuration}
                pixelsPerMs={pixelsPerMs}
                offsetX={currentScrollLeft}
                leftPadding={LEFT_LABEL_WIDTH}
              />
            </div>

            {/* Tracks scroll container */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-auto relative min-h-0"
              onScroll={handleScroll}
            >
              {/* Seek area (background) */}
              <TimelineSeekArea
                totalDuration={totalDuration}
                pixelsPerMs={pixelsPerMs}
                offsetX={currentScrollLeft}
                onSeek={seekTo}
                className="absolute inset-0 z-0"
                style={{
                  left: LEFT_LABEL_WIDTH,
                  width: `calc(100% - ${LEFT_LABEL_WIDTH}px)`,
                }}
              />

              {/* Tracks */}
              <div
                className="relative z-10"
                style={{
                  minWidth: totalTimelineWidth + LEFT_LABEL_WIDTH,
                  minHeight: tracksContentHeight,
                }}
              >
                {states.map((state, index) => (
                  <TimelineTrack
                    key={state.id}
                    state={state}
                    timeline={timeline}
                    pixelsPerMs={pixelsPerMs}
                    offsetX={currentScrollLeft}
                    onTransitionClick={handleTransitionClick}
                    onStateClick={handleStateClick}
                    leftPadding={LEFT_LABEL_WIDTH}
                    isEven={index % 2 === 0}
                  />
                ))}
              </div>

              {/* Playhead */}
              <TimelinePlayhead
                currentTime={currentTime}
                totalDuration={totalDuration}
                pixelsPerMs={pixelsPerMs}
                offsetX={currentScrollLeft}
                containerHeight={tracksContentHeight}
                onSeek={seekTo}
                leftPadding={LEFT_LABEL_WIDTH}
                isPlaying={isPlaying && !isPaused}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className={cn(
              "shrink-0 flex items-center justify-between",
              "border-t border-border bg-muted/20",
              "text-muted-foreground font-mono",
              isMobile ? "px-2 text-[9px] h-7" : "px-3 text-[10px] h-8"
            )}
          >
            <span>
              Total: <span className="text-foreground">{(totalDuration / 1000).toFixed(2)}s</span>
            </span>
            <span>
              {states.length} state{states.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
