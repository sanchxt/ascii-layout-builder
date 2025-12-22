/**
 * Timeline Easing Editor Component
 *
 * Expandable inline panel in the timeline for editing transition easing.
 * Combines bezier graph editor, preset chips, and duration/delay controls.
 * Features professional DAW-inspired styling with unified NumericInput controls.
 */

import { useCallback, useEffect, useRef } from "react";
import { X, Clock, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { cn } from "@/lib/utils";
import { ANIMATION_CONSTANTS } from "@/lib/constants";
import { useAnimationStore } from "../store/animationStore";
import type { EasingPreset } from "../types/transition";
import { BezierGraphEditor } from "./BezierGraphEditor";
import { EasingPresetChips } from "./EasingPresetChips";
import {
  getEasingControlPoints,
  detectEasingPreset,
  createCustomEasingCurve,
} from "../utils/easingUtils";

interface TimelineEasingEditorProps {
  transitionId: string;
  onClose?: () => void;
  className?: string;
}

export function TimelineEasingEditor({
  transitionId,
  onClose,
  className,
}: TimelineEasingEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const transition = useAnimationStore((state) =>
    state.getTransition(transitionId)
  );
  const getState = useAnimationStore((state) => state.getState);
  const updateTransition = useAnimationStore((state) => state.updateTransition);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        const target = e.target as HTMLElement;

        // Don't close if clicking inside the timeline container
        if (target.closest("[data-timeline-container]")) return;
        // Don't close if clicking on timeline tracks
        if (target.closest("[data-timeline-track]")) return;
        // Don't close if clicking on the sidebar transition editor panel
        if (target.closest("[data-transition-editor-panel]")) return;
        // Don't close if clicking on dropdowns, popovers, or menus (they use portals)
        if (target.closest("[data-radix-popper-content-wrapper]")) return;
        if (target.closest("[role='menu']")) return;
        if (target.closest("[role='listbox']")) return;
        // Don't close if clicking on numeric input controls
        if (target.closest("[data-numeric-input]")) return;

        onClose?.();
      }
    };

    // Delay adding listener to avoid immediate close
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 150);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleDurationChange = useCallback(
    (value: number) => {
      updateTransition(transitionId, {
        duration: Math.max(
          ANIMATION_CONSTANTS.MIN_TRANSITION_DURATION,
          Math.min(ANIMATION_CONSTANTS.MAX_TRANSITION_DURATION, value)
        ),
      });
    },
    [transitionId, updateTransition]
  );

  const handleDelayChange = useCallback(
    (value: number) => {
      updateTransition(transitionId, {
        delay: Math.max(0, Math.min(ANIMATION_CONSTANTS.MAX_DELAY, value)),
      });
    },
    [transitionId, updateTransition]
  );

  const handlePresetSelect = useCallback(
    (preset: EasingPreset) => {
      updateTransition(transitionId, {
        easing: { preset },
      });
    },
    [transitionId, updateTransition]
  );

  const handleBezierChange = useCallback(
    (points: [number, number, number, number]) => {
      updateTransition(transitionId, {
        easing: createCustomEasingCurve(...points),
      });
    },
    [transitionId, updateTransition]
  );

  if (!transition) {
    return null;
  }

  const fromState = getState(transition.fromStateId);
  const toState = getState(transition.toStateId);
  const controlPoints = getEasingControlPoints(transition.easing);
  const detectedPreset = detectEasingPreset(transition.easing);

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-gradient-to-b from-card to-background",
        "border-b border-border",
        "shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]",
        "animate-in slide-in-from-top-2 duration-200",
        "max-h-[220px] overflow-y-auto",
        className
      )}
    >
      <div className="p-3 space-y-3">
        {/* Header - sticky */}
        <div className="flex items-center justify-between sticky top-0 bg-gradient-to-b from-card via-card to-card/95 pb-2 -mt-1 pt-1 z-10 -mx-3 px-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Transition
            </span>
            <div className="h-3 w-px bg-border/50" />
            <span className="text-xs text-foreground font-medium">
              {fromState?.name ?? "?"} <span className="text-muted-foreground/60 mx-0.5">→</span> {toState?.name ?? "?"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </Button>
        </div>

        {/* Main content - responsive layout */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Bezier graph editor - smaller on constrained viewports */}
          <div className="shrink-0 flex justify-center sm:justify-start">
            <BezierGraphEditor
              controlPoints={controlPoints}
              onChange={handleBezierChange}
              width={200}
              height={100}
            />
          </div>

          {/* Controls - compact layout */}
          <div className="flex-1 space-y-2 min-w-0">
            {/* Preset chips */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Easing</Label>
              <EasingPresetChips
                selectedPreset={detectedPreset}
                onSelectPreset={handlePresetSelect}
                compact
              />
            </div>

            {/* Duration & Delay in a row on wider screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Duration */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  Duration
                </Label>
                <NumericInput
                  value={transition.duration}
                  onChange={handleDurationChange}
                  min={ANIMATION_CONSTANTS.MIN_TRANSITION_DURATION}
                  max={ANIMATION_CONSTANTS.MAX_TRANSITION_DURATION}
                  step={50}
                  unit="ms"
                />
              </div>

              {/* Delay */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer size={10} />
                  Delay
                </Label>
                <NumericInput
                  value={transition.delay}
                  onChange={handleDelayChange}
                  min={0}
                  max={ANIMATION_CONSTANTS.MAX_DELAY}
                  step={50}
                  unit="ms"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
