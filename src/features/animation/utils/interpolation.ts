/**
 * Interpolation Utilities for Animation System Phase 3
 *
 * Provides cubic bezier evaluation and value interpolation
 * for smooth animation playback.
 *
 * Phase 2: Added cascade-aware interpolation with hierarchy support.
 */

import type { EasingCurve } from "../types/transition";
import type { AnimationStateElement } from "../types/animation";
import type {
  CascadeConfig,
  AnimationInheritanceMode,
  LayoutSnapshot,
} from "../types/cascade";
import { getEasingControlPoints } from "./easingUtils";
import {
  buildHierarchyTree,
  flattenDepthFirst,
  calculateCascadeTimings,
  calculateElementProgress,
} from "./cascadeTiming";

/**
 * Solve cubic bezier for t (time) to get the eased progress value
 *
 * A cubic bezier curve is defined by:
 *   P(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
 *
 * For CSS timing functions:
 *   P0 = (0, 0), P3 = (1, 1)
 *   P1 = (x1, y1), P2 = (x2, y2)
 *
 * We need to find the Y value for a given X (time progress)
 */

// Sample the bezier curve at a given t value for X coordinate
function sampleCurveX(
  t: number,
  x1: number,
  x2: number
): number {
  // Calculate X at parameter t using bezier formula
  // P0.x = 0, P3.x = 1
  return (
    3 * (1 - t) * (1 - t) * t * x1 +
    3 * (1 - t) * t * t * x2 +
    t * t * t
  );
}

// Sample the bezier curve at a given t value for Y coordinate
function sampleCurveY(
  t: number,
  y1: number,
  y2: number
): number {
  // Calculate Y at parameter t using bezier formula
  // P0.y = 0, P3.y = 1
  return (
    3 * (1 - t) * (1 - t) * t * y1 +
    3 * (1 - t) * t * t * y2 +
    t * t * t
  );
}

// Derivative of X with respect to t
function sampleCurveDerivativeX(
  t: number,
  x1: number,
  x2: number
): number {
  return (
    3 * (1 - t) * (1 - t) * x1 +
    6 * (1 - t) * t * (x2 - x1) +
    3 * t * t * (1 - x2)
  );
}

/**
 * Use Newton-Raphson iteration to find t for a given x value
 */
function solveCurveX(
  x: number,
  x1: number,
  x2: number,
  epsilon: number = 1e-6
): number {
  // Initial guess
  let t = x;

  // Newton-Raphson iteration
  for (let i = 0; i < 8; i++) {
    const currentX = sampleCurveX(t, x1, x2) - x;
    if (Math.abs(currentX) < epsilon) {
      return t;
    }
    const derivative = sampleCurveDerivativeX(t, x1, x2);
    if (Math.abs(derivative) < epsilon) {
      break;
    }
    t -= currentX / derivative;
  }

  // Fall back to bisection if Newton-Raphson doesn't converge
  let t0 = 0;
  let t1 = 1;
  t = x;

  while (t0 < t1) {
    const currentX = sampleCurveX(t, x1, x2);
    if (Math.abs(currentX - x) < epsilon) {
      return t;
    }
    if (x > currentX) {
      t0 = t;
    } else {
      t1 = t;
    }
    t = (t0 + t1) / 2;
  }

  return t;
}

/**
 * Evaluate a cubic bezier curve at a given progress value (0-1)
 *
 * @param progress - The linear time progress (0-1)
 * @param x1 - Control point 1 X
 * @param y1 - Control point 1 Y
 * @param x2 - Control point 2 X
 * @param y2 - Control point 2 Y
 * @returns The eased progress value (0-1, can overshoot for spring/bounce)
 */
export function cubicBezier(
  progress: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  // Handle edge cases
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;

  // Special case: linear
  if (x1 === y1 && x2 === y2) {
    return progress;
  }

  // Find the t value for the given x (progress)
  const t = solveCurveX(progress, x1, x2);

  // Return the y value at that t
  return sampleCurveY(t, y1, y2);
}

/**
 * Apply easing to a progress value using an EasingCurve
 *
 * @param progress - Linear time progress (0-1)
 * @param easing - The easing curve to apply
 * @returns Eased progress value
 */
export function applyEasing(progress: number, easing: EasingCurve): number {
  const [x1, y1, x2, y2] = getEasingControlPoints(easing);
  return cubicBezier(progress, x1, y1, x2, y2);
}

/**
 * Interpolate between two numeric values with easing
 *
 * @param from - Starting value
 * @param to - Ending value
 * @param progress - Linear time progress (0-1)
 * @param easing - Optional easing curve (defaults to linear)
 * @returns Interpolated value
 */
export function interpolateNumber(
  from: number,
  to: number,
  progress: number,
  easing?: EasingCurve
): number {
  const easedProgress = easing ? applyEasing(progress, easing) : progress;
  return from + (to - from) * easedProgress;
}

/**
 * Interpolate between two animation state elements
 *
 * @param from - Starting element state
 * @param to - Ending element state
 * @param progress - Linear time progress (0-1)
 * @param easing - Easing curve to apply
 * @returns Interpolated element state
 */
export function interpolateElement(
  from: AnimationStateElement,
  to: AnimationStateElement,
  progress: number,
  easing: EasingCurve
): AnimationStateElement {
  const easedProgress = applyEasing(progress, easing);

  return {
    elementId: from.elementId,
    elementName: from.elementName,
    x: interpolateProp(from.x, to.x, easedProgress),
    y: interpolateProp(from.y, to.y, easedProgress),
    width: interpolateProp(from.width, to.width, easedProgress),
    height: interpolateProp(from.height, to.height, easedProgress),
    opacity: interpolateProp(from.opacity, to.opacity, easedProgress),
    scale: interpolateProp(from.scale, to.scale, easedProgress),
    rotation: interpolateRotation(from.rotation, to.rotation, easedProgress),
    // Visibility: use source visibility until midpoint, then target
    visible: easedProgress < 0.5 ? from.visible : to.visible,
    // Phase 3: Layout snapshot interpolation (deferred to avoid circular dependency)
    // Layout interpolation is handled in interpolateLayoutSnapshotInternal
    layoutSnapshot: interpolateLayoutSnapshotInternal(
      from.layoutSnapshot,
      to.layoutSnapshot,
      easedProgress
    ),
  };
}

/**
 * Internal layout snapshot interpolation (inline to avoid forward reference issues)
 * Full version is exported as interpolateLayoutSnapshot
 */
function interpolateLayoutSnapshotInternal(
  from: LayoutSnapshot | undefined,
  to: LayoutSnapshot | undefined,
  progress: number
): LayoutSnapshot | undefined {
  if (!from && !to) return undefined;
  if (!from) return progress >= 0.5 ? to : undefined;
  if (!to) return progress < 0.5 ? from : undefined;
  if (from.type !== to.type) return progress < 0.5 ? from : to;

  const interpolateGapInternal = (
    fromGap: number | undefined,
    toGap: number | undefined
  ): number | undefined => {
    if (fromGap === undefined && toGap === undefined) return undefined;
    return (fromGap ?? 0) + ((toGap ?? 0) - (fromGap ?? 0)) * progress;
  };

  if (from.type === "flex" && to.type === "flex") {
    return {
      type: "flex",
      direction: progress < 0.5 ? from.direction : to.direction,
      gap: interpolateGapInternal(from.gap, to.gap),
      alignItems: progress < 0.5 ? from.alignItems : to.alignItems,
      justifyContent: progress < 0.5 ? from.justifyContent : to.justifyContent,
      wrap: progress < 0.5 ? from.wrap : to.wrap,
      childPositions: undefined,
    };
  }

  if (from.type === "grid" && to.type === "grid") {
    return {
      type: "grid",
      gap: interpolateGapInternal(from.gap, to.gap),
      alignItems: progress < 0.5 ? from.alignItems : to.alignItems,
      columns: progress < 0.5 ? from.columns : to.columns,
      rows: progress < 0.5 ? from.rows : to.rows,
      columnGap: interpolateGapInternal(from.columnGap, to.columnGap),
      rowGap: interpolateGapInternal(from.rowGap, to.rowGap),
      childPositions: undefined,
    };
  }

  return progress < 0.5 ? from : to;
}

/**
 * Simple linear interpolation helper (when easing is already applied)
 */
function interpolateProp(from: number, to: number, easedProgress: number): number {
  return from + (to - from) * easedProgress;
}

/**
 * Interpolate rotation, handling wrap-around at ±180°
 * Takes the shortest path around the circle
 */
function interpolateRotation(
  from: number,
  to: number,
  easedProgress: number
): number {
  // Normalize angles to -180 to 180
  const normalizeAngle = (angle: number): number => {
    angle = angle % 360;
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    return angle;
  };

  const fromNorm = normalizeAngle(from);
  const toNorm = normalizeAngle(to);

  // Find the shortest path
  let delta = toNorm - fromNorm;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  return fromNorm + delta * easedProgress;
}

/**
 * Interpolate all elements between two states
 *
 * @param fromElements - Starting state elements
 * @param toElements - Ending state elements
 * @param progress - Linear time progress (0-1)
 * @param easing - Global easing curve
 * @param elementOverrides - Per-element timing overrides (optional)
 * @returns Map of elementId to interpolated element
 */
export function interpolateElements(
  fromElements: AnimationStateElement[],
  toElements: AnimationStateElement[],
  progress: number,
  easing: EasingCurve,
  elementOverrides?: Map<
    string,
    { duration: number; delay: number; easing: EasingCurve }
  >,
  totalDuration?: number
): Map<string, AnimationStateElement> {
  const result = new Map<string, AnimationStateElement>();

  // Create lookup maps for efficiency
  const fromMap = new Map(fromElements.map((el) => [el.elementId, el]));
  const toMap = new Map(toElements.map((el) => [el.elementId, el]));

  // Get all unique element IDs
  const allElementIds = new Set([
    ...fromElements.map((el) => el.elementId),
    ...toElements.map((el) => el.elementId),
  ]);

  for (const elementId of allElementIds) {
    const fromEl = fromMap.get(elementId);
    const toEl = toMap.get(elementId);

    // If element only exists in one state, use that state's values
    if (!fromEl && toEl) {
      // Element appears in toState - fade in with subtle scale (0.95 → target)
      // Using 0.95 instead of 0.5 for a more subtle, professional feel
      const fadeInEl: AnimationStateElement = {
        ...toEl,
        opacity: progress * toEl.opacity,
        scale: 0.95 + progress * (toEl.scale - 0.95),
      };
      result.set(elementId, fadeInEl);
      continue;
    }

    if (fromEl && !toEl) {
      // Element disappears in toState - fade out with subtle scale down
      // Scale down by only 5% max for subtle effect
      const fadeOutEl: AnimationStateElement = {
        ...fromEl,
        opacity: fromEl.opacity * (1 - progress),
        scale: fromEl.scale * (1 - progress * 0.05),
      };
      result.set(elementId, fadeOutEl);
      continue;
    }

    if (!fromEl || !toEl) continue;

    // Check for element-specific overrides
    const override = elementOverrides?.get(elementId);

    if (override && totalDuration) {
      // Calculate element-specific progress based on delay and duration
      const elementStartTime = override.delay;
      const elementEndTime = override.delay + override.duration;
      const currentTime = progress * totalDuration;

      let elementProgress: number;
      if (currentTime < elementStartTime) {
        elementProgress = 0;
      } else if (currentTime >= elementEndTime) {
        elementProgress = 1;
      } else {
        elementProgress =
          (currentTime - elementStartTime) / override.duration;
      }

      result.set(
        elementId,
        interpolateElement(fromEl, toEl, elementProgress, override.easing)
      );
    } else {
      // Use global easing
      result.set(elementId, interpolateElement(fromEl, toEl, progress, easing));
    }
  }

  return result;
}

/**
 * Calculate stagger delays for elements
 *
 * @param elementIds - Array of element IDs in order
 * @param staggerDelay - Delay between each element in ms
 * @param from - Direction to stagger from
 * @returns Map of elementId to delay in ms
 */
export function calculateStaggerDelays(
  elementIds: string[],
  staggerDelay: number,
  from: "start" | "end" | "center" | "random"
): Map<string, number> {
  const result = new Map<string, number>();
  const count = elementIds.length;

  if (count === 0) return result;

  let orderedIds: string[];

  switch (from) {
    case "start":
      orderedIds = [...elementIds];
      break;
    case "end":
      orderedIds = [...elementIds].reverse();
      break;
    case "center": {
      // Expand from center outward
      const centerIndex = Math.floor(count / 2);
      orderedIds = [];
      for (let i = 0; i <= centerIndex; i++) {
        if (centerIndex - i >= 0) {
          orderedIds.push(elementIds[centerIndex - i]);
        }
        if (i !== 0 && centerIndex + i < count) {
          orderedIds.push(elementIds[centerIndex + i]);
        }
      }
      break;
    }
    case "random": {
      // Shuffle array using Fisher-Yates
      orderedIds = [...elementIds];
      for (let i = orderedIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedIds[i], orderedIds[j]] = [orderedIds[j], orderedIds[i]];
      }
      break;
    }
  }

  orderedIds.forEach((id, index) => {
    result.set(id, index * staggerDelay);
  });

  return result;
}

// =====================================================
// Phase 2: Cascade-Aware Interpolation
// =====================================================

/**
 * Transform data that can be accumulated for inheritance
 */
interface ParentTransform {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

/**
 * Apply inheritance transform to an element based on its inheritance mode
 *
 * @param element - The current interpolated element
 * @param parentTransform - The transform delta from the parent element
 * @param mode - The inheritance mode to apply
 * @returns Element with inheritance applied
 */
export function applyInheritance(
  element: AnimationStateElement,
  parentTransform: ParentTransform | null,
  mode: AnimationInheritanceMode
): AnimationStateElement {
  if (!parentTransform || mode === "independent") {
    return element;
  }

  switch (mode) {
    case "inherit":
      // Additive transforms: child adds parent's delta to its own transform
      return {
        ...element,
        x: element.x + parentTransform.x,
        y: element.y + parentTransform.y,
        rotation: element.rotation + parentTransform.rotation,
        scale: element.scale * parentTransform.scale,
      };

    case "relative":
      // Relative positioning: maintain offset from parent's new position
      // Only apply position offset, not rotation/scale
      return {
        ...element,
        x: element.x + parentTransform.x,
        y: element.y + parentTransform.y,
      };

    default:
      return element;
  }
}

/**
 * Calculate the transform delta between two element states
 */
function calculateTransformDelta(
  from: AnimationStateElement,
  to: AnimationStateElement,
  progress: number
): ParentTransform {
  return {
    x: (to.x - from.x) * progress,
    y: (to.y - from.y) * progress,
    rotation: (to.rotation - from.rotation) * progress,
    scale: 1 + ((to.scale / from.scale) - 1) * progress,
  };
}

/**
 * Interpolate all elements with cascade timing and hierarchy awareness
 *
 * This function handles:
 * 1. Cascade timing (per-element delays based on hierarchy)
 * 2. Inheritance modes (how children follow parent transforms)
 * 3. Per-element timing overrides
 *
 * @param fromElements - Starting state elements
 * @param toElements - Ending state elements
 * @param currentTime - Current time in milliseconds
 * @param easing - Global easing curve
 * @param cascade - Cascade configuration
 * @param baseDuration - Base transition duration in ms
 * @param baseDelay - Base transition delay in ms
 * @returns Map of elementId to interpolated element
 */
export function interpolateElementsWithCascade(
  fromElements: AnimationStateElement[],
  toElements: AnimationStateElement[],
  currentTime: number,
  easing: EasingCurve,
  cascade: CascadeConfig | undefined,
  baseDuration: number,
  baseDelay: number = 0
): Map<string, AnimationStateElement> {
  const result = new Map<string, AnimationStateElement>();

  // Create lookup maps
  const fromMap = new Map(fromElements.map((el) => [el.elementId, el]));
  const toMap = new Map(toElements.map((el) => [el.elementId, el]));

  // Calculate cascade timings
  const cascadeTimings = calculateCascadeTimings(
    toElements,
    cascade,
    baseDuration,
    baseDelay,
    easing
  );

  // Build hierarchy and get elements in depth-first order (parents first)
  const tree = buildHierarchyTree(toElements);
  const orderedNodes = flattenDepthFirst(tree);

  // Store parent transforms for inheritance
  const parentTransforms = new Map<string, ParentTransform>();

  // Process elements in hierarchy order
  for (const node of orderedNodes) {
    const elementId = node.element.elementId;
    const fromEl = fromMap.get(elementId);
    const toEl = toMap.get(elementId);

    // Handle enter/exit animations
    if (!fromEl && toEl) {
      // Element enters - fade in with cascade timing
      // Using 0.95 scale start for subtle, professional feel
      const timing = cascadeTimings.get(elementId);
      const progress = timing
        ? calculateElementProgress(currentTime, timing)
        : currentTime / baseDuration;

      const enterEl: AnimationStateElement = {
        ...toEl,
        opacity: progress * toEl.opacity,
        scale: 0.95 + progress * (toEl.scale - 0.95),
      };

      result.set(elementId, enterEl);
      continue;
    }

    if (fromEl && !toEl) {
      // Element exits - fade out with subtle scale down
      const progress = Math.min(1, currentTime / baseDuration);
      const exitEl: AnimationStateElement = {
        ...fromEl,
        opacity: fromEl.opacity * (1 - progress),
        scale: fromEl.scale * (1 - progress * 0.05),
      };

      result.set(elementId, exitEl);
      continue;
    }

    if (!fromEl || !toEl) continue;

    // Get cascade timing for this element
    const timing = cascadeTimings.get(elementId);
    const elementProgress = timing
      ? calculateElementProgress(currentTime, timing)
      : Math.min(1, Math.max(0, currentTime / baseDuration));

    // Get the easing for this element
    const elementEasing = timing?.easing ?? easing;

    // Interpolate the element
    let interpolated = interpolateElement(fromEl, toEl, elementProgress, elementEasing);

    // Preserve the new Phase 2 properties
    interpolated = {
      ...interpolated,
      parentId: toEl.parentId,
      inheritanceMode: toEl.inheritanceMode,
      timing: toEl.timing,
      layoutSnapshot: toEl.layoutSnapshot,
      enterExitType: toEl.enterExitType,
      translateX: toEl.translateX,
      translateY: toEl.translateY,
      shadowIntensity: toEl.shadowIntensity,
    };

    // Apply inheritance from parent if this element has a parent
    if (toEl.parentId) {
      const parentTransform = parentTransforms.get(toEl.parentId);
      const inheritanceMode = toEl.inheritanceMode ?? "relative";

      interpolated = applyInheritance(interpolated, parentTransform ?? null, inheritanceMode);
    }

    // Calculate and store transform delta for children
    const transformDelta = calculateTransformDelta(fromEl, interpolated, 1);
    parentTransforms.set(elementId, transformDelta);

    result.set(elementId, interpolated);
  }

  // Handle any elements that weren't in the ordered nodes
  // (shouldn't happen, but just in case)
  const processedIds = new Set(orderedNodes.map((n) => n.element.elementId));
  for (const toEl of toElements) {
    if (!processedIds.has(toEl.elementId) && !result.has(toEl.elementId)) {
      const fromEl = fromMap.get(toEl.elementId);
      if (fromEl) {
        const progress = Math.min(1, Math.max(0, currentTime / baseDuration));
        result.set(
          toEl.elementId,
          interpolateElement(fromEl, toEl, progress, easing)
        );
      } else {
        result.set(toEl.elementId, toEl);
      }
    }
  }

  return result;
}

/**
 * Calculate the total duration of a cascade animation
 * (accounts for all element delays + durations)
 */
export function calculateCascadeTotalDuration(
  elements: AnimationStateElement[],
  cascade: CascadeConfig | undefined,
  baseDuration: number,
  baseDelay: number = 0,
  easing: EasingCurve = { preset: "ease-out" }
): number {
  if (!cascade?.enabled || elements.length === 0) {
    return baseDelay + baseDuration;
  }

  const timings = calculateCascadeTimings(
    elements,
    cascade,
    baseDuration,
    baseDelay,
    easing
  );

  let maxEndTime = 0;
  timings.forEach((timing) => {
    const endTime = timing.delay + timing.duration;
    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }
  });

  return maxEndTime;
}

// =====================================================
// Phase 3: Layout Animation (Gap Interpolation)
// =====================================================

/**
 * Interpolate between two gap values
 *
 * @param fromGap - Starting gap value (undefined treated as 0)
 * @param toGap - Ending gap value (undefined treated as 0)
 * @param progress - Animation progress (0-1)
 * @returns Interpolated gap value or undefined if both are undefined
 */
export function interpolateGap(
  fromGap: number | undefined,
  toGap: number | undefined,
  progress: number
): number | undefined {
  // If both are undefined, return undefined
  if (fromGap === undefined && toGap === undefined) {
    return undefined;
  }

  // Treat undefined as 0
  const from = fromGap ?? 0;
  const to = toGap ?? 0;

  // Linear interpolation (easing should be applied before calling this)
  return from + (to - from) * progress;
}

/**
 * Interpolate between two layout snapshots
 * Primarily focuses on gap animation, other properties use discrete transitions
 *
 * @param from - Starting layout snapshot
 * @param to - Ending layout snapshot
 * @param progress - Animation progress (0-1, should be eased)
 * @returns Interpolated layout snapshot or undefined
 */
export function interpolateLayoutSnapshot(
  from: LayoutSnapshot | undefined,
  to: LayoutSnapshot | undefined,
  progress: number
): LayoutSnapshot | undefined {
  // If both are undefined, return undefined
  if (!from && !to) {
    return undefined;
  }

  // If only one exists, use discrete transition at midpoint
  if (!from) {
    return progress >= 0.5 ? to : undefined;
  }
  if (!to) {
    return progress < 0.5 ? from : undefined;
  }

  // If layout types differ, use discrete transition at midpoint
  if (from.type !== to.type) {
    return progress < 0.5 ? from : to;
  }

  // Interpolate gap values
  const interpolatedGap = interpolateGap(from.gap, to.gap, progress);
  const interpolatedColumnGap = interpolateGap(from.columnGap, to.columnGap, progress);
  const interpolatedRowGap = interpolateGap(from.rowGap, to.rowGap, progress);

  // For flex layout
  if (from.type === "flex" && to.type === "flex") {
    return {
      type: "flex",
      // Direction uses discrete transition
      direction: progress < 0.5 ? from.direction : to.direction,
      gap: interpolatedGap,
      alignItems: progress < 0.5 ? from.alignItems : to.alignItems,
      justifyContent: progress < 0.5 ? from.justifyContent : to.justifyContent,
      wrap: progress < 0.5 ? from.wrap : to.wrap,
      // Child positions are computed from gap, not interpolated directly
      childPositions: undefined,
    };
  }

  // For grid layout
  if (from.type === "grid" && to.type === "grid") {
    return {
      type: "grid",
      gap: interpolatedGap,
      alignItems: progress < 0.5 ? from.alignItems : to.alignItems,
      // Columns/rows use discrete transition
      columns: progress < 0.5 ? from.columns : to.columns,
      rows: progress < 0.5 ? from.rows : to.rows,
      columnGap: interpolatedColumnGap,
      rowGap: interpolatedRowGap,
      // Child positions are computed from gap, not interpolated directly
      childPositions: undefined,
    };
  }

  // Fallback: discrete transition
  return progress < 0.5 ? from : to;
}

/**
 * Check if two layout snapshots have a gap change
 * Useful for determining if layout animation is needed
 */
export function hasLayoutGapChange(
  from: LayoutSnapshot | undefined,
  to: LayoutSnapshot | undefined
): boolean {
  if (!from && !to) return false;
  if (!from || !to) return true;
  if (from.type !== to.type) return true;

  // Check gap values
  if (from.gap !== to.gap) return true;
  if (from.columnGap !== to.columnGap) return true;
  if (from.rowGap !== to.rowGap) return true;

  return false;
}

/**
 * Get all layout changes between two element arrays
 * Returns element IDs that have layout gap changes
 */
export function getLayoutChanges(
  fromElements: AnimationStateElement[],
  toElements: AnimationStateElement[]
): string[] {
  const fromMap = new Map(fromElements.map((el) => [el.elementId, el]));
  const changedIds: string[] = [];

  for (const toEl of toElements) {
    const fromEl = fromMap.get(toEl.elementId);
    if (hasLayoutGapChange(fromEl?.layoutSnapshot, toEl.layoutSnapshot)) {
      changedIds.push(toEl.elementId);
    }
  }

  return changedIds;
}
