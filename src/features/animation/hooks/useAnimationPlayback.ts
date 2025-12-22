/**
 * Animation Playback Engine Hook
 *
 * Provides requestAnimationFrame-based animation playback with
 * interpolated element values for smooth 60fps canvas rendering.
 */

import { useCallback, useEffect, useRef, useMemo } from "react";
import { useAnimationStore } from "../store/animationStore";
import type {
  StateTransition,
  ComputedTimeline,
  EasingCurve,
} from "../types/transition";
import type { AnimationStateElement, AnimationState } from "../types/animation";
import {
  interpolateElements,
  interpolateElementsWithCascade,
  calculateStaggerDelays,
} from "../utils/interpolation";
import { DEFAULT_EASING } from "../types/transition";

export interface UseAnimationPlaybackReturn {
  // Interpolated values for rendering
  getAnimatedElement: (elementId: string) => AnimationStateElement | null;

  // Playback state
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
  isLooping: boolean;

  // Current transition info
  currentTransition: StateTransition | null;
  currentFromState: AnimationState | null;
  currentToState: AnimationState | null;
  progress: number;

  // Computed timeline
  timeline: ComputedTimeline | null;

  // Controls (forwarded from store)
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setSpeed: (speed: number) => void;
  toggleLoop: () => void;
}

/**
 * Compute the full timeline for an artboard's states and transitions
 *
 * Timeline structure:
 * - Each state has a hold period (state.holdTime) where it displays without animation
 * - After hold period, transition begins to next state
 * - Transition has its own delay (transition.delay) and duration (transition.duration)
 */
function computeTimeline(
  states: AnimationState[],
  transitions: StateTransition[]
): ComputedTimeline {
  if (states.length === 0) {
    return {
      totalDuration: 0,
      segments: [],
      stateTimings: [],
      transitionTimings: [],
    };
  }

  // Sort states by order
  const sortedStates = [...states].sort((a, b) => a.order - b.order);

  const stateTimings: ComputedTimeline["stateTimings"] = [];
  const transitionTimings: ComputedTimeline["transitionTimings"] = [];
  const segments: ComputedTimeline["segments"] = [];

  let currentTime = 0;

  for (let i = 0; i < sortedStates.length; i++) {
    const state = sortedStates[i];
    const nextState = sortedStates[i + 1];

    // State segment starts at currentTime
    const stateStart = currentTime;

    // Hold time from the state itself (how long to display before transitioning)
    const holdTime = state.holdTime ?? 0;
    const holdEndTime = stateStart + holdTime;

    if (nextState) {
      // Find transition to next state
      const transition = transitions.find(
        (t) => t.fromStateId === state.id && t.toStateId === nextState.id
      );

      if (transition) {
        // Transition delay is added after hold time
        const transitionStart = holdEndTime + transition.delay;

        // State ends when transition starts
        const stateEnd = transitionStart;

        stateTimings.push({
          stateId: state.id,
          stateName: state.name,
          startTime: stateStart,
          holdEndTime,
          endTime: stateEnd,
          holdTime,
        });

        segments.push({
          startTime: stateStart,
          endTime: stateEnd,
          type: "state",
          referenceId: state.id,
          label: state.name,
        });

        currentTime = transitionStart;

        // Transition segment
        const transitionEnd = currentTime + transition.duration;

        transitionTimings.push({
          transitionId: transition.id,
          startTime: currentTime,
          endTime: transitionEnd,
          fromStateId: state.id,
          toStateId: nextState.id,
        });

        segments.push({
          startTime: currentTime,
          endTime: transitionEnd,
          type: "transition",
          referenceId: transition.id,
          label: `${state.name} → ${nextState.name}`,
        });

        currentTime = transitionEnd;
      } else {
        // No transition defined - use state hold time, then create default transition
        const stateEnd = holdEndTime;

        stateTimings.push({
          stateId: state.id,
          stateName: state.name,
          startTime: stateStart,
          holdEndTime,
          endTime: stateEnd,
          holdTime,
        });

        segments.push({
          startTime: stateStart,
          endTime: stateEnd,
          type: "state",
          referenceId: state.id,
          label: state.name,
        });

        currentTime = stateEnd;

        // Add implicit transition (300ms default)
        const defaultTransitionDuration = 300;
        const transitionEnd = currentTime + defaultTransitionDuration;

        transitionTimings.push({
          transitionId: `implicit-${state.id}-${nextState.id}`,
          startTime: currentTime,
          endTime: transitionEnd,
          fromStateId: state.id,
          toStateId: nextState.id,
        });

        segments.push({
          startTime: currentTime,
          endTime: transitionEnd,
          type: "transition",
          referenceId: `implicit-${state.id}-${nextState.id}`,
          label: `${state.name} → ${nextState.name}`,
        });

        currentTime = transitionEnd;
      }
    } else {
      // Last state - include hold time but no transition after
      const stateEnd = holdEndTime;

      stateTimings.push({
        stateId: state.id,
        stateName: state.name,
        startTime: stateStart,
        holdEndTime,
        endTime: stateEnd,
        holdTime,
      });

      segments.push({
        startTime: stateStart,
        endTime: stateEnd,
        type: "state",
        referenceId: state.id,
        label: state.name,
      });

      currentTime = stateEnd;
    }
  }

  return {
    totalDuration: currentTime,
    segments,
    stateTimings,
    transitionTimings,
  };
}

/**
 * Animation Playback Hook
 *
 * Manages the animation loop and provides interpolated element values
 * for canvas rendering during playback.
 */
export function useAnimationPlayback(
  artboardId: string | null
): UseAnimationPlaybackReturn {
  // Store selectors - use stable references to avoid infinite re-renders
  const playback = useAnimationStore((state) => state.playback);
  const allStates = useAnimationStore((state) => state.states);
  const allTransitions = useAnimationStore((state) => state.transitions);
  const getTransition = useAnimationStore((state) => state.getTransition);
  const getState = useAnimationStore((state) => state.getState);

  // Memoize filtered states and transitions
  const states = useMemo(() => {
    if (!artboardId) return [];
    return allStates
      .filter((s) => s.artboardId === artboardId)
      .sort((a, b) => a.order - b.order);
  }, [allStates, artboardId]);

  const transitions = useMemo(() => {
    if (!artboardId) return [];
    // Get state IDs for this artboard to filter transitions
    const stateIds = new Set(states.map((s) => s.id));
    return allTransitions.filter(
      (t) => stateIds.has(t.fromStateId) || stateIds.has(t.toStateId)
    );
  }, [allTransitions, artboardId, states]);

  // Store actions
  const play = useAnimationStore((state) => state.play);
  const pause = useAnimationStore((state) => state.pause);
  const stop = useAnimationStore((state) => state.stop);
  const seekTo = useAnimationStore((state) => state.seekTo);
  const setPlaybackSpeed = useAnimationStore((state) => state.setPlaybackSpeed);
  const toggleLoop = useAnimationStore((state) => state.toggleLoop);
  const setPlaybackState = useAnimationStore((state) => state.setPlaybackState);
  const setInterpolatedElements = useAnimationStore(
    (state) => state.setInterpolatedElements
  );
  const clearInterpolatedElements = useAnimationStore(
    (state) => state.clearInterpolatedElements
  );

  // Refs for animation loop
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Current interpolated elements (for getAnimatedElement)
  const interpolatedElementsRef = useRef<Map<string, AnimationStateElement>>(
    new Map()
  );

  // Compute timeline
  const timeline = useMemo(() => {
    if (!artboardId || states.length === 0) return null;
    return computeTimeline(states, transitions);
  }, [artboardId, states, transitions]);

  const totalDuration = timeline?.totalDuration ?? 0;

  // Find current transition and states based on currentTime
  const currentTransitionInfo = useMemo(() => {
    if (!timeline || timeline.transitionTimings.length === 0) {
      return {
        transition: null,
        fromState: null,
        toState: null,
        progress: 0,
      };
    }

    const { currentTime } = playback;

    // Find which transition we're in
    for (const timing of timeline.transitionTimings) {
      if (currentTime >= timing.startTime && currentTime < timing.endTime) {
        const transitionDuration = timing.endTime - timing.startTime;
        const timeInTransition = currentTime - timing.startTime;
        const progress = transitionDuration > 0 ? timeInTransition / transitionDuration : 1;

        // Get actual transition if it's not implicit
        const transition = timing.transitionId.startsWith("implicit-")
          ? null
          : getTransition(timing.transitionId);

        return {
          transition: transition ?? null,
          fromState: getState(timing.fromStateId) ?? null,
          toState: getState(timing.toStateId) ?? null,
          progress,
          timing,
        };
      }
    }

    // Check if we're at a state (not transitioning)
    for (const timing of timeline.stateTimings) {
      if (currentTime >= timing.startTime && currentTime <= timing.endTime) {
        return {
          transition: null,
          fromState: getState(timing.stateId) ?? null,
          toState: null,
          progress: 0,
        };
      }
    }

    // At the end - show last state
    if (states.length > 0) {
      const lastState = states[states.length - 1];
      return {
        transition: null,
        fromState: lastState,
        toState: null,
        progress: 1,
      };
    }

    return {
      transition: null,
      fromState: null,
      toState: null,
      progress: 0,
    };
  }, [timeline, playback.currentTime, getTransition, getState, states]);

  // Update interpolated elements when time changes
  useEffect(() => {
    const { fromState, toState, transition, progress } = currentTransitionInfo;
    const isPlaybackActive = playback.isPlaying || playback.isPaused;

    if (!fromState) {
      interpolatedElementsRef.current = new Map();
      if (isPlaybackActive) {
        clearInterpolatedElements();
      }
      return;
    }

    // If not in a transition, just use the current state's elements
    if (!toState) {
      const stateElements = new Map(
        fromState.elements.map((el) => [el.elementId, el])
      );
      interpolatedElementsRef.current = stateElements;

      // Sync to store if playback is active
      if (isPlaybackActive) {
        const elementsRecord: Record<string, AnimationStateElement> = {};
        stateElements.forEach((el, id) => {
          elementsRecord[id] = el;
        });
        setInterpolatedElements(elementsRecord);
      }
      return;
    }

    // Interpolate between states
    const easing: EasingCurve = transition?.easing ?? DEFAULT_EASING;
    const baseDuration = transition?.duration ?? 300;

    let interpolated: Map<string, AnimationStateElement>;

    // Phase 2: Check if cascade animation is enabled
    if (transition?.cascade?.enabled) {
      // Use cascade-aware interpolation
      // Calculate current time relative to this transition
      const timing = (currentTransitionInfo as { timing?: { startTime: number } }).timing;
      const transitionStartTime = timing?.startTime ?? 0;
      const currentTimeInTransition = playback.currentTime - transitionStartTime;

      interpolated = interpolateElementsWithCascade(
        fromState.elements,
        toState.elements,
        currentTimeInTransition,
        easing,
        transition.cascade,
        baseDuration,
        transition.delay
      );
    } else {
      // Use standard interpolation with element overrides and stagger

      // Calculate element overrides if any
      let elementOverrides: Map<
        string,
        { duration: number; delay: number; easing: EasingCurve }
      > | undefined;

      if (transition?.elementOverrides && transition.elementOverrides.length > 0) {
        elementOverrides = new Map(
          transition.elementOverrides.map((eo) => [
            eo.elementId,
            {
              duration: eo.duration,
              delay: eo.delay,
              easing: eo.easing,
            },
          ])
        );
      }

      // Handle legacy stagger
      if (transition?.stagger?.enabled) {
        const elementIds = fromState.elements.map((el) => el.elementId);
        const staggerDelays = calculateStaggerDelays(
          elementIds,
          transition.stagger.delay,
          transition.stagger.from
        );

        // Convert stagger delays to element overrides
        if (!elementOverrides) {
          elementOverrides = new Map();
        }

        for (const [elementId, delay] of staggerDelays) {
          const existing = elementOverrides.get(elementId);
          if (existing) {
            existing.delay = delay;
          } else {
            elementOverrides.set(elementId, {
              duration: baseDuration,
              delay,
              easing,
            });
          }
        }
      }

      interpolated = interpolateElements(
        fromState.elements,
        toState.elements,
        progress,
        easing,
        elementOverrides,
        baseDuration
      );
    }

    interpolatedElementsRef.current = interpolated;

    // Sync to store if playback is active
    if (isPlaybackActive) {
      const elementsRecord: Record<string, AnimationStateElement> = {};
      interpolated.forEach((el, id) => {
        elementsRecord[id] = el;
      });
      setInterpolatedElements(elementsRecord);
    }
  }, [
    currentTransitionInfo,
    playback.isPlaying,
    playback.isPaused,
    setInterpolatedElements,
    clearInterpolatedElements,
  ]);

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      if (!playback.isPlaying || playback.isPaused) {
        animationFrameRef.current = null;
        return;
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimeRef.current) * playback.playbackSpeed;
      lastTimeRef.current = timestamp;

      const newTime = playback.currentTime + deltaTime;

      if (newTime >= totalDuration) {
        if (playback.loop) {
          // Loop back to start
          setPlaybackState({ currentTime: 0 });
        } else {
          // Stop at end
          setPlaybackState({ currentTime: totalDuration });
          stop();
        }
      } else {
        setPlaybackState({ currentTime: newTime });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [
      playback.isPlaying,
      playback.isPaused,
      playback.playbackSpeed,
      playback.currentTime,
      playback.loop,
      totalDuration,
      setPlaybackState,
      stop,
    ]
  );

  // Start/stop animation loop
  useEffect(() => {
    if (playback.isPlaying && !playback.isPaused) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playback.isPlaying, playback.isPaused, animate]);

  // Clear interpolated elements when playback is completely stopped
  useEffect(() => {
    if (!playback.isPlaying && !playback.isPaused) {
      clearInterpolatedElements();
    }
  }, [playback.isPlaying, playback.isPaused, clearInterpolatedElements]);

  // Get animated element value
  const getAnimatedElement = useCallback(
    (elementId: string): AnimationStateElement | null => {
      return interpolatedElementsRef.current.get(elementId) ?? null;
    },
    []
  );

  return {
    // Interpolated values
    getAnimatedElement,

    // Playback state
    isPlaying: playback.isPlaying,
    isPaused: playback.isPaused,
    currentTime: playback.currentTime,
    totalDuration,
    playbackSpeed: playback.playbackSpeed,
    isLooping: playback.loop,

    // Current transition info
    currentTransition: currentTransitionInfo.transition,
    currentFromState: currentTransitionInfo.fromState,
    currentToState: currentTransitionInfo.toState,
    progress: currentTransitionInfo.progress,

    // Timeline
    timeline,

    // Controls
    play,
    pause,
    stop,
    seekTo,
    setSpeed: setPlaybackSpeed,
    toggleLoop,
  };
}

/**
 * Hook to check if animation playback is currently active
 * Use this for conditional rendering logic
 */
export function useIsPlaybackActive(): boolean {
  const isPlaying = useAnimationStore((state) => state.playback.isPlaying);
  const isPaused = useAnimationStore((state) => state.playback.isPaused);
  return isPlaying || isPaused;
}
