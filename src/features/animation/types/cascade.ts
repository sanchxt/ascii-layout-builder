/**
 * Cascade Animation Types
 *
 * Types for parent-child animation control, cascade timing,
 * and hierarchical animation inheritance.
 */

import type { EasingCurve } from "./transition";

/**
 * Animation inheritance mode determines how child elements
 * relate to parent animations during playback.
 */
export type AnimationInheritanceMode =
  | "independent" // Element animates on its own (current behavior)
  | "inherit" // Element follows parent's transform additively
  | "relative"; // Element maintains relative offset from parent

/**
 * Per-element timing override for animation
 */
export interface ElementAnimationTiming {
  delay: number;
  duration: number;
  easing: EasingCurve;
}

/**
 * Cascade stagger direction options
 */
export type CascadeStaggerDirection =
  | "normal" // First to last in hierarchy
  | "reverse" // Last to first
  | "center-out" // From middle outward
  | "edges-in"; // From edges toward center

/**
 * Grid animation pattern for grid layouts
 */
export type GridAnimationPattern =
  | "row-by-row"
  | "column-by-column"
  | "diagonal"
  | null;

/**
 * Cascade stagger configuration
 */
export interface CascadeStaggerConfig {
  /** Delay amount in ms between elements */
  amount: number;
  /** Direction of stagger application */
  direction: CascadeStaggerDirection;
  /** Starting position for stagger */
  from: "start" | "end" | "center" | "random" | number;
}

/**
 * Full cascade configuration for transitions
 */
export interface CascadeConfig {
  /** Whether cascade timing is enabled */
  enabled: boolean;
  /** Delay in ms added per nesting level */
  delayPerLevel: number;
  /** Duration multiplier per level (e.g., 0.9 = 90% duration for each deeper level) */
  durationScale: number;
  /** Whether children inherit parent's easing curve */
  easingInherit: boolean;
  /** Stagger configuration for sibling elements */
  stagger: CascadeStaggerConfig;
  /** Grid-specific animation pattern */
  gridPattern: GridAnimationPattern;
}

/**
 * Layout animation configuration (stub for Phase 3)
 */
export interface LayoutAnimationConfig {
  /** How layout changes are animated */
  mode: "instant" | "smooth" | "flip";
  /** Whether children reflow during transition */
  childReflow: boolean;
}

/**
 * Computed child position within a layout
 */
export interface LayoutChildPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Layout snapshot for animation states
 * Captures layout configuration and computed child positions at a point in time
 */
export interface LayoutSnapshot {
  type: "flex" | "grid" | "none";
  direction?: "row" | "column";
  gap?: number;
  alignItems?: string;
  justifyContent?: string;
  wrap?: boolean;
  columns?: number;
  rows?: number;
  columnGap?: number;
  rowGap?: number;
  /** Computed child positions for smooth interpolation during animation */
  childPositions?: LayoutChildPosition[];
}

/**
 * Default layout animation configuration
 */
export const DEFAULT_LAYOUT_ANIMATION_CONFIG: LayoutAnimationConfig = {
  mode: "smooth",
  childReflow: true,
};

/**
 * Default cascade configuration
 */
export const DEFAULT_CASCADE_CONFIG: CascadeConfig = {
  enabled: false,
  delayPerLevel: 50,
  durationScale: 1.0,
  easingInherit: true,
  stagger: {
    amount: 50,
    direction: "normal",
    from: "start",
  },
  gridPattern: null,
};

/**
 * Default stagger configuration
 */
export const DEFAULT_STAGGER_CONFIG: CascadeStaggerConfig = {
  amount: 50,
  direction: "normal",
  from: "start",
};

/**
 * Cascade animation preset type
 */
export type CascadePresetType =
  | "waterfall" // Top-down with increasing delay
  | "ripple" // Center-out animation
  | "sequence" // One-by-one, depth-first
  | "parallel" // All children together
  | "reverse-cascade"; // Bottom-up

/**
 * Cascade animation preset definition
 */
export interface CascadePreset {
  id: CascadePresetType;
  name: string;
  description: string;
  config: Partial<CascadeConfig>;
}

/**
 * Predefined cascade animation presets
 */
export const CASCADE_PRESETS: CascadePreset[] = [
  {
    id: "waterfall",
    name: "Waterfall",
    description: "Top-down with increasing delay",
    config: {
      enabled: true,
      delayPerLevel: 75,
      durationScale: 1.0,
      easingInherit: true,
      stagger: {
        amount: 50,
        direction: "normal",
        from: "start",
      },
    },
  },
  {
    id: "ripple",
    name: "Ripple",
    description: "Center-out animation",
    config: {
      enabled: true,
      delayPerLevel: 60,
      durationScale: 0.95,
      easingInherit: true,
      stagger: {
        amount: 40,
        direction: "center-out",
        from: "center",
      },
    },
  },
  {
    id: "sequence",
    name: "Sequence",
    description: "One-by-one, depth-first",
    config: {
      enabled: true,
      delayPerLevel: 100,
      durationScale: 1.0,
      easingInherit: true,
      stagger: {
        amount: 100,
        direction: "normal",
        from: "start",
      },
    },
  },
  {
    id: "parallel",
    name: "Parallel",
    description: "All children together",
    config: {
      enabled: true,
      delayPerLevel: 0,
      durationScale: 1.0,
      easingInherit: true,
      stagger: {
        amount: 0,
        direction: "normal",
        from: "start",
      },
    },
  },
  {
    id: "reverse-cascade",
    name: "Reverse Cascade",
    description: "Bottom-up animation",
    config: {
      enabled: true,
      delayPerLevel: 75,
      durationScale: 1.0,
      easingInherit: true,
      stagger: {
        amount: 50,
        direction: "reverse",
        from: "end",
      },
    },
  },
];

/**
 * Get a cascade preset by ID
 */
export function getCascadePreset(
  presetId: CascadePresetType
): CascadePreset | undefined {
  return CASCADE_PRESETS.find((p) => p.id === presetId);
}

/**
 * Apply a preset to create a full cascade config
 */
export function applyCascadePreset(presetId: CascadePresetType): CascadeConfig {
  const preset = getCascadePreset(presetId);
  if (!preset) {
    return { ...DEFAULT_CASCADE_CONFIG };
  }
  return {
    ...DEFAULT_CASCADE_CONFIG,
    ...preset.config,
    stagger: {
      ...DEFAULT_CASCADE_CONFIG.stagger,
      ...preset.config.stagger,
    },
  };
}
