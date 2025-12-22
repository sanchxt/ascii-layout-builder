/**
 * Timeline Track Component
 *
 * A single state row in the timeline with professional styling,
 * sticky labels, and improved interaction feedback.
 */

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ANIMATION_CONSTANTS, TRIGGER_VISUALIZATION } from "@/lib/constants";
import type { ComputedTimeline } from "../types/transition";
import type { AnimationState } from "../types/animation";
import { useAnimationStore } from "../store/animationStore";
import { MiniEasingPreview } from "./MiniEasingPreview";
import { TriggerIcon } from "./TriggerBadge";

interface TimelineTrackProps {
  state: AnimationState;
  timeline: ComputedTimeline;
  pixelsPerMs: number;
  offsetX: number;
  onTransitionClick?: (transitionId: string) => void;
  onStateClick?: (stateId: string) => void;
  leftPadding?: number;
  isEven?: boolean;
}

const TRACK_HEIGHT = 40;

export function TimelineTrack({
  state,
  timeline,
  pixelsPerMs,
  offsetX,
  onTransitionClick,
  onStateClick,
  leftPadding = 120,
  isEven = false,
}: TimelineTrackProps) {
  const selectedTransitionId = useAnimationStore((s) => s.selectedTransitionId);
  const activeStateId = useAnimationStore((s) => s.activeStateId);
  const updateStateHoldTime = useAnimationStore((s) => s.updateStateHoldTime);
  const getTransition = useAnimationStore((s) => s.getTransition);
  const createTransition = useAnimationStore((s) => s.createTransition);

  // Drag state for hold time resize
  const [isDragging, setIsDragging] = useState(false);
  const [dragHoldTime, setDragHoldTime] = useState<number | null>(null);
  const dragStartRef = useRef<{ x: number; holdTime: number } | null>(null);

  // Find timing for this state
  const stateTiming = timeline.stateTimings.find(
    (st) => st.stateId === state.id
  );

  // Find transitions from this state
  const outgoingTransition = timeline.transitionTimings.find(
    (tt) => tt.fromStateId === state.id
  );

  const totalWidth = timeline.totalDuration * pixelsPerMs;
  const isSelected = activeStateId === state.id;

  // Get trigger-specific colors
  const triggerColors = TRIGGER_VISUALIZATION.COLORS[state.trigger.type];

  // Handle drag start for hold time resize
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragHoldTime(state.holdTime);
      dragStartRef.current = {
        x: e.clientX,
        holdTime: state.holdTime,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return;

        const deltaX = moveEvent.clientX - dragStartRef.current.x;
        const deltaMs = deltaX / pixelsPerMs;
        const newHoldTime = Math.max(
          ANIMATION_CONSTANTS.MIN_HOLD_TIME,
          Math.min(
            ANIMATION_CONSTANTS.MAX_HOLD_TIME,
            Math.round((dragStartRef.current.holdTime + deltaMs) / 50) * 50
          )
        );

        setDragHoldTime(newHoldTime);
        updateStateHoldTime(state.id, newHoldTime);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setDragHoldTime(null);
        dragStartRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [state.id, state.holdTime, pixelsPerMs, updateStateHoldTime]
  );

  // Handle state click
  const handleStateClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStateClick?.(state.id);
    },
    [state.id, onStateClick]
  );

  return (
    <div
      className={cn(
        "relative group",
        isEven ? "bg-muted/[0.03]" : "bg-transparent",
        isSelected && "bg-primary/[0.08] ring-1 ring-inset ring-primary/20"
      )}
      style={{
        height: TRACK_HEIGHT,
      }}
    >
      {/* Fixed left label area */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full z-20",
          "bg-gradient-to-r from-background via-background to-background/90",
          "flex items-center gap-1.5 px-2",
          "border-r border-border/40",
          "shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)]"
        )}
        style={{ width: leftPadding }}
      >
        {/* Trigger type icon with color */}
        <div
          className={cn(
            "shrink-0 flex items-center justify-center rounded-sm",
            "w-5 h-5",
            triggerColors.bg
          )}
        >
          <TriggerIcon type={state.trigger.type} size="sm" />
        </div>

        {/* State name and element name */}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className={cn(
              "text-[11px] font-medium truncate leading-tight",
              isSelected && "text-primary"
            )}
            title={state.name}
          >
            {state.name}
          </span>
          {state.trigger.element?.targetElementName && (
            <span
              className="text-[9px] text-muted-foreground/70 truncate leading-tight"
              title={state.trigger.element.targetElementName}
            >
              {state.trigger.element.targetElementName}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable track content */}
      <div
        className="absolute h-full"
        style={{
          left: leftPadding,
          width: totalWidth + 100,
          transform: `translateX(${-offsetX}px)`,
        }}
      >
        {/* State active period block */}
        {stateTiming && (
          <div
            onClick={handleStateClick}
            className={cn(
              "absolute top-1 cursor-pointer transition-all duration-100",
              "rounded-[4px] border",
              isSelected
                ? "bg-primary/25 border-primary shadow-sm shadow-primary/20"
                : cn(
                    "hover:brightness-110",
                    triggerColors.bg,
                    triggerColors.border
                  )
            )}
            style={{
              left: stateTiming.startTime * pixelsPerMs,
              width: Math.max(
                (stateTiming.endTime - stateTiming.startTime) * pixelsPerMs,
                8
              ),
              height: TRACK_HEIGHT - 8,
            }}
            title={`${state.name}${stateTiming.holdTime > 0 ? ` (Hold: ${stateTiming.holdTime}ms)` : ""}`}
          >
            {/* Hold time indicator */}
            {stateTiming.holdTime > 0 && (
              <div
                className={cn(
                  "absolute left-0 top-0 h-full rounded-l-[3px]",
                  isSelected ? "bg-primary/30" : "bg-foreground/10"
                )}
                style={{
                  width: Math.max(stateTiming.holdTime * pixelsPerMs, 4),
                }}
              />
            )}

            {/* State label inside block (if space allows) */}
            {(stateTiming.endTime - stateTiming.startTime) * pixelsPerMs > 80 && (
              <div className="absolute inset-0 flex items-center px-2">
                <span
                  className={cn(
                    "text-[10px] font-medium truncate",
                    isSelected
                      ? "text-primary"
                      : triggerColors.text
                  )}
                >
                  {state.name}
                  {stateTiming.holdTime > 0 && (
                    <span className="ml-1 opacity-60 font-normal">
                      {stateTiming.holdTime}ms
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Drag tooltip during resize */}
            {isDragging && dragHoldTime !== null && (
              <div
                className={cn(
                  "absolute -top-7 right-0 px-1.5 py-0.5 rounded",
                  "bg-foreground text-background text-[9px] font-mono",
                  "whitespace-nowrap pointer-events-none z-30"
                )}
              >
                Hold: {dragHoldTime}ms
              </div>
            )}

            {/* Resize handle for hold time */}
            <div
              onMouseDown={handleDragStart}
              className={cn(
                "absolute right-0 top-0 h-full w-3 cursor-ew-resize",
                "flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                isDragging && "opacity-100"
              )}
              title="Drag to adjust hold time"
            >
              <div
                className={cn(
                  "h-4 w-1 rounded-full",
                  isSelected ? "bg-primary" : "bg-foreground/40"
                )}
              />
            </div>
          </div>
        )}

        {/* Outgoing transition block */}
        {outgoingTransition &&
          (() => {
            const transitionData = getTransition(outgoingTransition.transitionId);
            const transitionWidth =
              (outgoingTransition.endTime - outgoingTransition.startTime) *
              pixelsPerMs;
            const isTransitionSelected =
              selectedTransitionId === outgoingTransition.transitionId;

            return (
              <button
                data-timeline-track
                className={cn(
                  "absolute top-1 cursor-pointer transition-all duration-150",
                  "rounded-[5px] border border-dashed",
                  isTransitionSelected
                    ? "bg-primary/15 border-primary/70 shadow-sm shadow-primary/10"
                    : "bg-muted/30 border-muted-foreground/25 hover:bg-muted/50 hover:border-muted-foreground/40"
                )}
                style={{
                  left: outgoingTransition.startTime * pixelsPerMs,
                  width: Math.max(transitionWidth, 24),
                  height: TRACK_HEIGHT - 8,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!onTransitionClick) return;

                  // Check if implicit transition
                  if (outgoingTransition.transitionId.startsWith("implicit-")) {
                    const newTransitionId = createTransition(
                      outgoingTransition.fromStateId,
                      outgoingTransition.toStateId
                    );
                    onTransitionClick(newTransitionId);
                  } else {
                    onTransitionClick(outgoingTransition.transitionId);
                  }
                }}
                title={`Transition: ${Math.round(outgoingTransition.endTime - outgoingTransition.startTime)}ms`}
              >
                {/* Mini easing preview */}
                {transitionData && transitionWidth > 50 && (
                  <MiniEasingPreview
                    easing={transitionData.easing}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                  />
                )}

                {/* Transition duration label */}
                {transitionWidth > 36 && (
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center text-[9px] font-mono tabular-nums",
                      isTransitionSelected
                        ? "text-primary font-medium"
                        : "text-muted-foreground/80",
                      transitionWidth > 50 ? "justify-end pr-2" : "justify-center"
                    )}
                  >
                    {Math.round(
                      outgoingTransition.endTime - outgoingTransition.startTime
                    )}
                    ms
                  </span>
                )}
              </button>
            );
          })()}
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border/20" />
    </div>
  );
}
