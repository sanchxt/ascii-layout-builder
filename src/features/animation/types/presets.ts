/**
 * Animation Preset Types
 *
 * Defines the structure for animation presets that can be quickly
 * applied to elements during transitions.
 */

import type { EasingPreset } from "./transition";

/**
 * Properties that can be animated on an element
 * (subset of AnimationStateElement for transitions)
 */
export interface AnimationStateElementProperties {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  scale?: number;
  rotation?: number;
  visible?: boolean;
  translateX?: number;
  translateY?: number;
}

/**
 * Preset categories for organization
 */
export type PresetCategory = "fade" | "slide" | "scale" | "bounce";

/**
 * An animation preset defines the from/to properties for a common effect
 */
export interface AnimationPreset {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Category for grouping */
  category: PresetCategory;
  /** Brief description of the effect */
  description: string;
  /** Properties for the "from" state */
  fromProperties: Partial<AnimationStateElementProperties>;
  /** Properties for the "to" state */
  toProperties: Partial<AnimationStateElementProperties>;
  /** Suggested easing function */
  suggestedEasing?: EasingPreset;
  /** Suggested duration in ms */
  suggestedDuration?: number;
}
