/**
 * Transition Types for Animation System Phase 3
 *
 * Defines types for state-to-state transitions, easing curves,
 * playback state, and element-specific transition overrides.
 *
 * Phase 2: Added cascade configuration for hierarchical animations
 */

import type { CascadeConfig, LayoutAnimationConfig } from "./cascade";

/**
 * Preset easing function names
 */
export type EasingPreset =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "spring"
  | "bounce";

/**
 * Easing curve definition
 * Can use a preset or custom cubic-bezier values
 */
export interface EasingCurve {
  preset: EasingPreset;
  /** Custom cubic-bezier control points [x1, y1, x2, y2] */
  cubicBezier?: [number, number, number, number];
  /** Spring physics config (for future spring animations) */
  springConfig?: {
    stiffness: number;
    damping: number;
    mass: number;
  };
}

/**
 * Properties that can be animated independently
 */
export type TransitionProperty =
  | "position" // x, y
  | "size" // width, height
  | "opacity"
  | "scale"
  | "rotation"
  | "all";

/**
 * Per-element transition configuration
 * Allows overriding the global transition settings for specific elements
 */
export interface ElementTransition {
  /** Reference to the element being animated */
  elementId: string;
  /** Duration in milliseconds */
  duration: number;
  /** Delay before this element starts animating (ms) */
  delay: number;
  /** Easing curve for this element */
  easing: EasingCurve;
  /** Which properties to animate (defaults to 'all') */
  properties: TransitionProperty[];
}

/**
 * Stagger configuration for animating multiple elements
 */
export interface StaggerConfig {
  /** Whether stagger is enabled */
  enabled: boolean;
  /** Delay between each element in ms */
  delay: number;
  /** Direction to stagger from */
  from: "start" | "end" | "center" | "random";
}

/**
 * State-to-state transition definition
 * Defines how elements animate from one state to another
 */
export interface StateTransition {
  /** Unique identifier */
  id: string;
  /** Source state ID */
  fromStateId: string;
  /** Target state ID */
  toStateId: string;
  /** Global duration in milliseconds */
  duration: number;
  /** Global delay before transition starts (ms) */
  delay: number;
  /** Global easing curve */
  easing: EasingCurve;
  /** Per-element overrides */
  elementOverrides: ElementTransition[];
  /** Stagger configuration (legacy - consider using cascade.stagger instead) */
  stagger?: StaggerConfig;

  // Phase 2: Hierarchical Animation Configuration

  /**
   * Cascade configuration for parent-child animations
   * Controls timing based on element hierarchy depth and siblings
   */
  cascade?: CascadeConfig;

  /**
   * Layout animation configuration (Phase 3 stub)
   * Controls how layout property changes are animated
   */
  layoutAnimation?: LayoutAnimationConfig;

  /** When this transition was created */
  createdAt: number;
  /** When this transition was last updated */
  updatedAt: number;
}

/**
 * Timeline playback state
 * Tracks the current state of animation playback
 */
export interface PlaybackState {
  /** Whether animation is currently playing */
  isPlaying: boolean;
  /** Whether animation is paused (vs stopped) */
  isPaused: boolean;
  /** Current time position in milliseconds */
  currentTime: number;
  /** Playback speed multiplier (0.25, 0.5, 1, 1.5, 2) */
  playbackSpeed: number;
  /** Whether to loop when reaching the end */
  loop: boolean;
  /** Currently active transition (during playback) */
  activeTransitionId: string | null;
}

/**
 * Timeline segment for visualization
 * Represents a time range in the timeline
 */
export interface TimelineSegment {
  /** Start time in ms */
  startTime: number;
  /** End time in ms */
  endTime: number;
  /** Type of segment */
  type: "state" | "transition";
  /** Reference ID (stateId or transitionId) */
  referenceId: string;
  /** Display label */
  label: string;
}

/**
 * Computed timeline data for an artboard
 */
export interface ComputedTimeline {
  /** Total duration in ms */
  totalDuration: number;
  /** Ordered segments */
  segments: TimelineSegment[];
  /** State order with timing */
  stateTimings: Array<{
    stateId: string;
    stateName: string;
    startTime: number;
    /** When the state's hold period ends (before transition starts) */
    holdEndTime: number;
    endTime: number;
    /** The hold duration for this state */
    holdTime: number;
  }>;
  /** Transition timings */
  transitionTimings: Array<{
    transitionId: string;
    startTime: number;
    endTime: number;
    fromStateId: string;
    toStateId: string;
  }>;
}

/**
 * Default easing curve
 */
export const DEFAULT_EASING: EasingCurve = {
  preset: "ease-out",
};

/**
 * Default playback state
 */
export const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  playbackSpeed: 1,
  loop: false,
  activeTransitionId: null,
};

/**
 * Create a new state transition with defaults
 */
export function createDefaultTransition(
  fromStateId: string,
  toStateId: string,
  duration: number = 300
): Omit<StateTransition, "id"> {
  const now = Date.now();
  return {
    fromStateId,
    toStateId,
    duration,
    delay: 0,
    easing: { ...DEFAULT_EASING },
    elementOverrides: [],
    stagger: undefined,
    createdAt: now,
    updatedAt: now,
  };
}
