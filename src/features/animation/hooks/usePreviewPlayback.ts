/**
 * Preview Playback Hook
 *
 * Provides animated transitions for preview mode triggers.
 * When a trigger fires, smoothly animates from the initial/current state
 * to the triggered state, and back when the trigger ends.
 */

import { useCallback, useEffect, useRef, useMemo } from "react";
import { useAnimationStore } from "../store/animationStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import type { AnimationStateElement, AnimationState } from "../types/animation";
import type { EasingCurve } from "../types/transition";
import { interpolateElements } from "../utils/interpolation";

const DEFAULT_PREVIEW_DURATION = 300; // ms
const DEFAULT_EASING: EasingCurve = { preset: "ease-out" };

interface PreviewPlaybackState {
  isAnimating: boolean;
  direction: "forward" | "reverse";
  fromStateId: string | null;
  toStateId: string | null;
  progress: number;
  startTime: number;
  duration: number;
}

/**
 * Hook to manage animated transitions in preview mode
 *
 * @param artboardId - Filter animations to specific artboard
 */
export function usePreviewPlayback(artboardId: string | null) {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const states = useAnimationStore((s) => s.states);
  const transitions = useAnimationStore((s) => s.transitions);
  const previewMode = useAnimationStore((s) => s.previewMode);
  const setInterpolatedElements = useAnimationStore(
    (s) => s.setInterpolatedElements
  );
  const clearInterpolatedElements = useAnimationStore(
    (s) => s.clearInterpolatedElements
  );
  const boxes = useBoxStore((s) => s.boxes);

  // Filter states by artboard
  const relevantStates = useMemo(() => {
    if (!artboardId) return states;
    return states.filter((s) => s.artboardId === artboardId);
  }, [states, artboardId]);

  // Find the initial state (trigger type === "initial" or first state)
  const initialState = useMemo(() => {
    const initial = relevantStates.find((s) => s.trigger.type === "initial");
    if (initial) return initial;
    // Fall back to first state by order
    const sorted = [...relevantStates].sort((a, b) => a.order - b.order);
    return sorted[0] || null;
  }, [relevantStates]);

  // Animation state
  const playbackRef = useRef<PreviewPlaybackState>({
    isAnimating: false,
    direction: "forward",
    fromStateId: null,
    toStateId: null,
    progress: 0,
    startTime: 0,
    duration: DEFAULT_PREVIEW_DURATION,
  });

  const animationFrameRef = useRef<number | null>(null);
  const previousTriggeredStateIdRef = useRef<string | null>(null);
  const hasEnteredPreviewRef = useRef(false);

  /**
   * Get the transition configuration between two states (if defined)
   */
  const getTransitionConfig = useCallback(
    (fromStateId: string, toStateId: string) => {
      return transitions.find(
        (t) => t.fromStateId === fromStateId && t.toStateId === toStateId
      );
    },
    [transitions]
  );

  /**
   * Start animation to a target state
   */
  const startAnimation = useCallback(
    (
      fromState: AnimationState,
      toState: AnimationState,
      direction: "forward" | "reverse"
    ) => {
      // Get transition config if it exists
      const transition = getTransitionConfig(fromState.id, toState.id);
      const duration = transition?.duration ?? DEFAULT_PREVIEW_DURATION;

      playbackRef.current = {
        isAnimating: true,
        direction,
        fromStateId: fromState.id,
        toStateId: toState.id,
        progress: 0,
        startTime: performance.now(),
        duration,
      };

      // Start animation loop if not already running
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    },
    [getTransitionConfig]
  );

  /**
   * Animation loop
   */
  const animate = useCallback(
    (timestamp: number) => {
      const pb = playbackRef.current;

      if (!pb.isAnimating || !pb.fromStateId || !pb.toStateId) {
        animationFrameRef.current = null;
        return;
      }

      // Calculate progress
      const elapsed = timestamp - pb.startTime;
      const rawProgress = Math.min(1, elapsed / pb.duration);

      // Get states
      const fromState = relevantStates.find((s) => s.id === pb.fromStateId);
      const toState = relevantStates.find((s) => s.id === pb.toStateId);

      if (!fromState || !toState) {
        animationFrameRef.current = null;
        pb.isAnimating = false;
        return;
      }

      // Get easing from transition or use default
      const transition = getTransitionConfig(fromState.id, toState.id);
      const easing: EasingCurve = transition?.easing ?? DEFAULT_EASING;

      // Interpolate elements
      const interpolated = interpolateElements(
        fromState.elements,
        toState.elements,
        rawProgress,
        easing
      );

      // Convert Map to Record and update store
      const elementsRecord: Record<string, AnimationStateElement> = {};
      interpolated.forEach((el, id) => {
        elementsRecord[id] = el;
      });
      setInterpolatedElements(elementsRecord);

      // Update progress
      pb.progress = rawProgress;

      // Check if animation is complete
      if (rawProgress >= 1) {
        pb.isAnimating = false;
        animationFrameRef.current = null;

        // When reverse animation completes, SET interpolated elements to initial state
        // This ensures boxes return to their initial animation state position,
        // not the boxStore position which may have diverged
        if (pb.direction === "reverse" && initialState) {
          const initialRecord: Record<string, AnimationStateElement> = {};
          initialState.elements.forEach((el) => {
            initialRecord[el.elementId] = el;
          });
          setInterpolatedElements(initialRecord);
        }
        // Forward animation: keep current interpolated elements (already at target state)

        return;
      }

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [relevantStates, getTransitionConfig, setInterpolatedElements, initialState]
  );

  /**
   * Handle trigger state changes
   */
  useEffect(() => {
    // Only run in preview mode
    if (editorMode !== "preview" || !previewMode.isActive) {
      return;
    }

    const currentTriggeredStateId = previewMode.activeTriggeredStateId;
    const previousTriggeredStateId = previousTriggeredStateIdRef.current;

    // State triggered
    if (
      currentTriggeredStateId &&
      currentTriggeredStateId !== previousTriggeredStateId
    ) {
      const triggeredState = relevantStates.find(
        (s) => s.id === currentTriggeredStateId
      );

      if (triggeredState && initialState) {
        // Determine the "from" state
        // If we were already at a triggered state, animate from that
        // Otherwise, animate from initial state
        const fromState = previousTriggeredStateId
          ? relevantStates.find((s) => s.id === previousTriggeredStateId)
          : initialState;

        if (fromState) {
          startAnimation(fromState, triggeredState, "forward");
        }
      }
    }

    // State reset (trigger ended)
    if (
      !currentTriggeredStateId &&
      previousTriggeredStateId &&
      initialState
    ) {
      const previousState = relevantStates.find(
        (s) => s.id === previousTriggeredStateId
      );

      if (previousState) {
        startAnimation(previousState, initialState, "reverse");
      }
    }

    // Update previous state ref
    previousTriggeredStateIdRef.current = currentTriggeredStateId;
  }, [
    editorMode,
    previewMode.isActive,
    previewMode.activeTriggeredStateId,
    relevantStates,
    initialState,
    startAnimation,
  ]);

  /**
   * Clear interpolated elements when exiting preview mode
   */
  useEffect(() => {
    if (editorMode !== "preview") {
      // Cancel any running animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      playbackRef.current = {
        isAnimating: false,
        direction: "forward",
        fromStateId: null,
        toStateId: null,
        progress: 0,
        startTime: 0,
        duration: DEFAULT_PREVIEW_DURATION,
      };

      // Clear interpolated elements
      clearInterpolatedElements();

      // Reset ref
      previousTriggeredStateIdRef.current = null;
    }
  }, [editorMode, clearInterpolatedElements]);

  /**
   * Set initial state elements when FIRST entering preview mode
   *
   * IMPORTANT: This effect should only run once when first entering preview mode,
   * NOT on every activeTriggeredStateId change. The previous implementation caused
   * a race condition where this would fire when hover ends (activeTriggeredStateId = null),
   * immediately overwriting the reverse animation.
   */
  useEffect(() => {
    // Only set initial state on FIRST entry to preview mode
    if (
      editorMode === "preview" &&
      previewMode.isActive &&
      initialState &&
      !hasEnteredPreviewRef.current
    ) {
      hasEnteredPreviewRef.current = true;
      const elementsRecord: Record<string, AnimationStateElement> = {};
      initialState.elements.forEach((el) => {
        elementsRecord[el.elementId] = el;
      });
      setInterpolatedElements(elementsRecord);
    }

    // Reset flag when exiting preview mode
    if (editorMode !== "preview") {
      hasEnteredPreviewRef.current = false;
    }
  }, [editorMode, previewMode.isActive, initialState, setInterpolatedElements]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isAnimating: playbackRef.current.isAnimating,
    progress: playbackRef.current.progress,
    direction: playbackRef.current.direction,
  };
}

/**
 * Check if preview playback is currently animating
 */
export function useIsPreviewAnimating(): boolean {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const previewMode = useAnimationStore((s) => s.previewMode);

  return editorMode === "preview" && previewMode.isActive;
}
