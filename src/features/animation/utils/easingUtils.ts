/**
 * Easing Utilities for Animation System Phase 3
 *
 * Provides preset cubic-bezier curves and CSS easing string generation.
 */

import type { EasingPreset, EasingCurve } from "../types/transition";

/**
 * Cubic bezier control points for each easing preset
 * Format: [x1, y1, x2, y2]
 */
export const EASING_PRESETS: Record<
  EasingPreset,
  [number, number, number, number]
> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
  // Spring approximation (overshoots slightly)
  spring: [0.5, 1.8, 0.5, 0.8],
  // Bounce approximation
  bounce: [0.6, 1.28, 0.68, 0.99],
};

/**
 * Display names for easing presets
 */
export const EASING_PRESET_LABELS: Record<EasingPreset, string> = {
  linear: "Linear",
  ease: "Ease",
  "ease-in": "Ease In",
  "ease-out": "Ease Out",
  "ease-in-out": "Ease In Out",
  spring: "Spring",
  bounce: "Bounce",
};

/**
 * All available easing presets for UI selection
 */
export const EASING_PRESET_OPTIONS: EasingPreset[] = [
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "spring",
  "bounce",
];

/**
 * Get the cubic bezier control points for an easing curve
 */
export function getEasingControlPoints(
  easing: EasingCurve
): [number, number, number, number] {
  // Use custom cubic bezier if provided
  if (easing.cubicBezier) {
    return easing.cubicBezier;
  }

  // Otherwise use the preset
  return EASING_PRESETS[easing.preset];
}

/**
 * Convert easing curve to CSS string
 * Returns a value suitable for CSS transition-timing-function or animation-timing-function
 */
export function toCSS(easing: EasingCurve): string {
  // For built-in CSS keywords, use them directly for better compatibility
  const cssKeywords: Partial<Record<EasingPreset, string>> = {
    linear: "linear",
    ease: "ease",
    "ease-in": "ease-in",
    "ease-out": "ease-out",
    "ease-in-out": "ease-in-out",
  };

  // If custom bezier provided, always use cubic-bezier()
  if (easing.cubicBezier) {
    const [x1, y1, x2, y2] = easing.cubicBezier;
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
  }

  // Use CSS keyword if available
  if (cssKeywords[easing.preset]) {
    return cssKeywords[easing.preset]!;
  }

  // Otherwise use cubic-bezier()
  const [x1, y1, x2, y2] = EASING_PRESETS[easing.preset];
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}

/**
 * Convert easing curve to Framer Motion spring config
 * Only meaningful for spring easing
 */
export function toFramerMotionSpring(easing: EasingCurve): {
  stiffness: number;
  damping: number;
  mass: number;
} | null {
  if (easing.preset !== "spring") {
    return null;
  }

  // Use custom spring config if provided
  if (easing.springConfig) {
    return easing.springConfig;
  }

  // Default spring values that approximate the spring preset bezier
  return {
    stiffness: 300,
    damping: 30,
    mass: 1,
  };
}

/**
 * Convert easing curve to GSAP ease string
 */
export function toGSAPEase(easing: EasingCurve): string {
  const gsapMapping: Partial<Record<EasingPreset, string>> = {
    linear: "none",
    ease: "power1.inOut",
    "ease-in": "power2.in",
    "ease-out": "power2.out",
    "ease-in-out": "power2.inOut",
    spring: "back.out(1.7)",
    bounce: "bounce.out",
  };

  return gsapMapping[easing.preset] || "power1.out";
}

/**
 * Create an EasingCurve from a preset name
 */
export function createEasingCurve(preset: EasingPreset): EasingCurve {
  return { preset };
}

/**
 * Create an EasingCurve from custom cubic bezier values
 */
export function createCustomEasingCurve(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): EasingCurve {
  return {
    preset: "ease-out", // Default preset as fallback identifier
    cubicBezier: [x1, y1, x2, y2],
  };
}

/**
 * Check if two easing curves are equivalent
 */
export function easingCurvesEqual(a: EasingCurve, b: EasingCurve): boolean {
  // If both have custom beziers, compare them
  if (a.cubicBezier && b.cubicBezier) {
    return a.cubicBezier.every((val, i) => val === b.cubicBezier![i]);
  }

  // If only one has custom bezier, they're not equal
  if (a.cubicBezier !== b.cubicBezier) {
    return false;
  }

  // Compare presets
  return a.preset === b.preset;
}

/**
 * Detect if an EasingCurve matches a known preset
 * Returns the preset name if it matches, or 'custom' if not
 */
export function detectEasingPreset(
  easing: EasingCurve
): EasingPreset | "custom" {
  const [x1, y1, x2, y2] = getEasingControlPoints(easing);

  // Check against all presets with tolerance
  const tolerance = 0.01;
  for (const [preset, points] of Object.entries(EASING_PRESETS)) {
    if (
      Math.abs(x1 - points[0]) < tolerance &&
      Math.abs(y1 - points[1]) < tolerance &&
      Math.abs(x2 - points[2]) < tolerance &&
      Math.abs(y2 - points[3]) < tolerance
    ) {
      return preset as EasingPreset;
    }
  }

  return "custom";
}

/**
 * Clamp bezier control point X values to valid range [0, 1]
 * Y values can exceed this range for spring/bounce effects
 */
export function clampBezierControlPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): [number, number, number, number] {
  return [
    Math.max(0, Math.min(1, x1)),
    y1, // Allow any Y value for overshoot
    Math.max(0, Math.min(1, x2)),
    y2, // Allow any Y value for overshoot
  ];
}

/**
 * Round bezier control points to 2 decimal places
 */
export function roundBezierControlPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): [number, number, number, number] {
  return [
    Math.round(x1 * 100) / 100,
    Math.round(y1 * 100) / 100,
    Math.round(x2 * 100) / 100,
    Math.round(y2 * 100) / 100,
  ];
}
