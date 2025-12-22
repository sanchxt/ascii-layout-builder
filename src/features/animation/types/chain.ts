/**
 * Animation Chain Types
 *
 * Defines types for animation chains - sequences of transitions
 * that play automatically in order.
 *
 * Example: State A → B → C → A (looping)
 */

import type { EasingCurve } from "./transition";

/**
 * A single step in an animation chain
 */
export interface ChainStep {
  /** Unique identifier for this step */
  id: string;
  /** Target state ID to transition to */
  stateId: string;
  /** Duration of the transition to this state (ms) */
  transitionDuration: number;
  /** Delay before starting this step (ms) */
  delay: number;
  /** Hold time at this state before moving to next step (ms) */
  holdTime: number;
  /** Optional easing override for this step */
  easing?: EasingCurve;
  /** Optional label for this step in the UI */
  label?: string;
}

/**
 * Chain playback mode
 */
export type ChainPlaybackMode =
  | "once"           // Play through once and stop
  | "loop"           // Loop back to start
  | "ping-pong"      // Play forward then backward
  | "infinite";      // Same as loop but explicit

/**
 * Chain state during playback
 */
export interface ChainPlaybackState {
  /** Currently playing chain ID */
  activeChainId: string | null;
  /** Current step index in the chain */
  currentStepIndex: number;
  /** Whether we're in the "pong" phase (reverse) for ping-pong mode */
  isReversing: boolean;
  /** Total elapsed time since chain started (ms) */
  elapsedTime: number;
  /** Number of completed iterations */
  iterations: number;
}

/**
 * Animation chain definition
 * Represents a complete sequence of transitions
 */
export interface AnimationChain {
  /** Unique identifier */
  id: string;
  /** Display name for the chain */
  name: string;
  /** Optional description */
  description?: string;
  /** Artboard this chain belongs to */
  artboardId: string;
  /** Starting state ID (where the chain begins) */
  startStateId: string;
  /** Ordered sequence of steps */
  steps: ChainStep[];
  /** Playback mode */
  playbackMode: ChainPlaybackMode;
  /** Maximum iterations (0 = unlimited, for loop/ping-pong modes) */
  maxIterations: number;
  /** Global playback speed multiplier */
  speedMultiplier: number;
  /** Whether this chain is the default for the artboard */
  isDefault: boolean;
  /** When this chain was created */
  createdAt: number;
  /** When this chain was last modified */
  updatedAt: number;
}

/**
 * Chain timing calculation result
 */
export interface ChainTiming {
  /** Total duration of one complete chain cycle (ms) */
  cycleDuration: number;
  /** Cumulative timing for each step */
  stepTimings: Array<{
    stepId: string;
    stateId: string;
    /** When the transition to this state starts */
    transitionStart: number;
    /** When the transition to this state ends */
    transitionEnd: number;
    /** When the hold period at this state ends */
    holdEnd: number;
  }>;
}

/**
 * Default values for new chain steps
 */
export const DEFAULT_CHAIN_STEP: Omit<ChainStep, "id" | "stateId"> = {
  transitionDuration: 300,
  delay: 0,
  holdTime: 500,
};

/**
 * Default values for new chains
 */
export const DEFAULT_CHAIN: Omit<AnimationChain, "id" | "artboardId" | "startStateId" | "steps" | "createdAt" | "updatedAt"> = {
  name: "New Animation Chain",
  playbackMode: "once",
  maxIterations: 0,
  speedMultiplier: 1,
  isDefault: false,
};

/**
 * Default playback state
 */
export const DEFAULT_CHAIN_PLAYBACK_STATE: ChainPlaybackState = {
  activeChainId: null,
  currentStepIndex: 0,
  isReversing: false,
  elapsedTime: 0,
  iterations: 0,
};

/**
 * Create a new chain step
 */
export function createChainStep(
  stateId: string,
  overrides: Partial<Omit<ChainStep, "id" | "stateId">> = {}
): ChainStep {
  return {
    id: crypto.randomUUID(),
    stateId,
    ...DEFAULT_CHAIN_STEP,
    ...overrides,
  };
}

/**
 * Create a new animation chain
 */
export function createChain(
  artboardId: string,
  startStateId: string,
  overrides: Partial<Omit<AnimationChain, "id" | "artboardId" | "startStateId" | "steps" | "createdAt" | "updatedAt">> = {}
): AnimationChain {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    artboardId,
    startStateId,
    steps: [],
    createdAt: now,
    updatedAt: now,
    ...DEFAULT_CHAIN,
    ...overrides,
  };
}

/**
 * Calculate timing information for a chain
 */
export function calculateChainTiming(chain: AnimationChain): ChainTiming {
  const stepTimings: ChainTiming["stepTimings"] = [];
  let currentTime = 0;

  for (const step of chain.steps) {
    const transitionStart = currentTime + step.delay;
    const transitionEnd = transitionStart + step.transitionDuration;
    const holdEnd = transitionEnd + step.holdTime;

    stepTimings.push({
      stepId: step.id,
      stateId: step.stateId,
      transitionStart,
      transitionEnd,
      holdEnd,
    });

    currentTime = holdEnd;
  }

  return {
    cycleDuration: currentTime,
    stepTimings,
  };
}

/**
 * Get the current step and progress based on elapsed time
 */
export function getChainProgress(
  chain: AnimationChain,
  timing: ChainTiming,
  elapsedTime: number,
  isReversing: boolean
): {
  stepIndex: number;
  stepProgress: number;
  phase: "transition" | "hold";
  isComplete: boolean;
} {
  const { cycleDuration, stepTimings } = timing;

  if (stepTimings.length === 0) {
    return { stepIndex: 0, stepProgress: 0, phase: "hold", isComplete: true };
  }

  // Handle ping-pong mode
  let adjustedTime = elapsedTime % cycleDuration;
  if (isReversing) {
    adjustedTime = cycleDuration - adjustedTime;
  }

  // Find current step
  for (let i = 0; i < stepTimings.length; i++) {
    const step = stepTimings[i];

    if (adjustedTime < step.transitionEnd) {
      // In transition phase
      const transitionDuration = step.transitionEnd - step.transitionStart;
      const progress = transitionDuration > 0
        ? (adjustedTime - step.transitionStart) / transitionDuration
        : 1;

      return {
        stepIndex: i,
        stepProgress: Math.max(0, Math.min(1, progress)),
        phase: "transition",
        isComplete: false,
      };
    }

    if (adjustedTime < step.holdEnd) {
      // In hold phase
      return {
        stepIndex: i,
        stepProgress: 1,
        phase: "hold",
        isComplete: false,
      };
    }
  }

  // Past the end
  return {
    stepIndex: stepTimings.length - 1,
    stepProgress: 1,
    phase: "hold",
    isComplete: chain.playbackMode === "once",
  };
}

/**
 * Validate a chain configuration
 */
export function validateChain(
  chain: AnimationChain,
  availableStateIds: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!chain.name.trim()) {
    errors.push("Chain name is required");
  }

  if (!availableStateIds.includes(chain.startStateId)) {
    errors.push("Start state is invalid or missing");
  }

  if (chain.steps.length === 0) {
    errors.push("Chain must have at least one step");
  }

  for (let i = 0; i < chain.steps.length; i++) {
    const step = chain.steps[i];

    if (!availableStateIds.includes(step.stateId)) {
      errors.push(`Step ${i + 1}: Target state is invalid`);
    }

    if (step.transitionDuration < 0) {
      errors.push(`Step ${i + 1}: Transition duration must be non-negative`);
    }

    if (step.delay < 0) {
      errors.push(`Step ${i + 1}: Delay must be non-negative`);
    }

    if (step.holdTime < 0) {
      errors.push(`Step ${i + 1}: Hold time must be non-negative`);
    }
  }

  if (chain.speedMultiplier <= 0) {
    errors.push("Speed multiplier must be positive");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
