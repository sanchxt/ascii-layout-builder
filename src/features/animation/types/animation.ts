/**
 * Animation System Types
 * Phase 1: Foundation types for animation states and element snapshots
 * Phase 2: Hierarchical animation with cascade and inheritance support
 */

import type {
  AnimationInheritanceMode,
  ElementAnimationTiming,
  LayoutSnapshot,
} from "./cascade";

/**
 * Editor mode determines what the user is doing
 * - layout: Editing box positions, sizes, and properties
 * - animation: Configuring animation states and transitions
 * - preview: Interactive testing of animation triggers
 */
export type EditorMode = "layout" | "animation" | "preview";

/**
 * Trigger types determine when an animation state becomes active
 */
export type AnimationTriggerType =
  | "initial" // Default state shown on load
  | "hover" // On mouse hover
  | "click" // On click/tap
  | "focus" // On input focus
  | "scroll" // On scroll into view (future)
  | "auto" // Automatically triggered after delay
  | "custom"; // Custom trigger name

/**
 * Time-based trigger configuration
 * Defines when a state auto-activates based on timing
 */
export interface TimeBasedTrigger {
  /** Delay in milliseconds before activation */
  delayMs: number;
  /** What the delay is relative to */
  relativeTo: "animationStart" | "previousStateEnd" | "previousTransitionEnd";
}

/**
 * Element-based trigger configuration
 * Defines which element's interaction triggers this state
 */
export interface ElementBasedTrigger {
  /** The element ID that triggers this state */
  targetElementId: string;
  /** Name of the target element (for display purposes) */
  targetElementName?: string;
}

/**
 * Trigger configuration for animation states
 */
export interface AnimationTrigger {
  type: AnimationTriggerType;
  /** For element-based triggers (hover/click/focus) - which element triggers this */
  element?: ElementBasedTrigger;
  /** For time-based auto triggers - delay and relative timing */
  timing?: TimeBasedTrigger;
  /** Custom trigger name for programmatic control */
  customName?: string;
}

/**
 * Enter/exit animation type for elements
 * - enter: Element enters the scene (mount animation)
 * - exit: Element exits the scene (unmount animation)
 * - none: Normal animation (no enter/exit behavior)
 */
export type EnterExitType = "enter" | "exit" | "none";

/**
 * Snapshot of a single element's properties within an animation state
 * This represents how an element appears in a specific state
 */
export interface AnimationStateElement {
  /** Reference to the original box/element ID */
  elementId: string;
  /** Element's name for linking across states */
  elementName: string;
  /** Parent element ID for nested boxes (preserves hierarchy) */
  parentId?: string;
  /** Position - parent-relative for nested boxes, artboard-relative for root boxes */
  x: number;
  y: number;
  /** Dimensions */
  width: number;
  height: number;
  /** Visual properties */
  opacity: number;
  scale: number;
  rotation: number;
  /** Whether element is visible in this state */
  visible: boolean;
  /** Transform properties for animation */
  translateX?: number;
  translateY?: number;
  /** Shadow intensity (for visual feedback) */
  shadowIntensity?: "none" | "sm" | "md" | "lg";
  /** Enter/exit animation type for AnimatePresence-like behavior */
  enterExitType?: EnterExitType;

  // Phase 2: Hierarchical Animation Properties

  /**
   * Animation inheritance mode - how this element relates to parent animations
   * - 'independent': Animates on its own (default for root elements)
   * - 'inherit': Follows parent's transform additively
   * - 'relative': Maintains relative offset from parent
   */
  inheritanceMode?: AnimationInheritanceMode;

  /**
   * Per-element timing override (null = use transition defaults)
   * Allows individual elements to have different timing than the transition
   */
  timing?: ElementAnimationTiming | null;

  /**
   * Layout snapshot for layout animations (Phase 3 preparation)
   * Captures the layout configuration at this state for animating layout changes
   */
  layoutSnapshot?: LayoutSnapshot;
}

/**
 * An animation state is a snapshot of all elements at a point in time
 * States belong to a specific artboard
 */
export interface AnimationState {
  id: string;
  /** Display name for the state */
  name: string;
  /** Parent artboard this state belongs to */
  artboardId: string;
  /** When this state becomes active */
  trigger: AnimationTrigger;
  /** Order in the state sequence (for timeline) */
  order: number;
  /** Snapshot of all elements in this state */
  elements: AnimationStateElement[];
  /** Thumbnail image data URL (for state card preview) */
  thumbnail?: string;
  /** How long to hold/stay in this state before transitioning (in ms) */
  holdTime: number;
  /** Timestamps */
  createdAt: number;
  updatedAt: number;
}

/**
 * Animation metadata for project-level configuration
 */
export interface AnimationMetadata {
  /** Animation name/title */
  name: string;
  /** Animation type categorization */
  type: "micro-interaction" | "page-transition" | "layout-transition" | "custom";
  /** Total calculated duration (future use) */
  totalDuration: number;
}
