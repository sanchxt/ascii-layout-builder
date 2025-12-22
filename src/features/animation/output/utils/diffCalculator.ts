/**
 * Diff Calculator for Animation Output
 * Calculates property differences between animation states
 */

import type { AnimationState, AnimationStateElement } from "../../types/animation";
import type {
  ElementDiff,
  ElementSnapshot,
  PropertyDiff,
  StateDiff,
} from "../types/animationOutput";
import { formatNumber } from "./formatHelpers";

/**
 * Animatable properties to track
 */
const ANIMATABLE_PROPERTIES = [
  "x",
  "y",
  "width",
  "height",
  "opacity",
  "scale",
  "rotation",
  "visible",
  "translateX",
  "translateY",
  // Phase 3: Layout properties
  "gap",
  "columnGap",
  "rowGap",
] as const;

type AnimatableProperty = (typeof ANIMATABLE_PROPERTIES)[number];

/**
 * Convert AnimationStateElement to ElementSnapshot
 */
function toSnapshot(element: AnimationStateElement): ElementSnapshot {
  return {
    elementId: element.elementId,
    elementName: element.elementName,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    opacity: element.opacity,
    scale: element.scale,
    rotation: element.rotation,
    visible: element.visible,
    translateX: element.translateX,
    translateY: element.translateY,
    // Phase 3: Layout properties from layoutSnapshot
    layoutType: element.layoutSnapshot?.type,
    gap: element.layoutSnapshot?.gap,
    columnGap: element.layoutSnapshot?.columnGap,
    rowGap: element.layoutSnapshot?.rowGap,
  };
}

/**
 * Calculate the difference in a single property between two states
 */
function calculatePropertyDiff(
  property: AnimatableProperty,
  fromValue: number | boolean | undefined,
  toValue: number | boolean | undefined
): PropertyDiff {
  const defaultVal = getDefaultValue(property);
  const from = fromValue ?? defaultVal;
  const to = toValue ?? defaultVal;

  // Handle undefined/undefined comparison (no layout on either side)
  if (from === undefined && to === undefined) {
    return {
      property,
      fromValue: undefined,
      toValue: undefined,
      hasChanged: false,
    };
  }

  // Handle boolean comparison
  if (typeof from === "boolean" || typeof to === "boolean") {
    return {
      property,
      fromValue: from,
      toValue: to,
      hasChanged: from !== to,
    };
  }

  // Handle numeric comparison with tolerance (undefined treated as 0 for comparison)
  const numFrom = from !== undefined ? Number(from) : 0;
  const numTo = to !== undefined ? Number(to) : 0;

  // Also consider a change if one side has layout and the other doesn't
  const hasChanged =
    (fromValue === undefined && toValue !== undefined) ||
    (fromValue !== undefined && toValue === undefined) ||
    Math.abs(numTo - numFrom) > 0.001;

  return {
    property,
    fromValue: from !== undefined ? numFrom : undefined,
    toValue: to !== undefined ? numTo : undefined,
    hasChanged,
  };
}

/**
 * Get default value for a property
 */
function getDefaultValue(
  property: AnimatableProperty
): number | boolean | undefined {
  switch (property) {
    case "visible":
      return true;
    case "opacity":
    case "scale":
      return 1;
    case "rotation":
    case "translateX":
    case "translateY":
      return 0;
    // Phase 3: Layout properties have no default (undefined means no layout)
    case "gap":
    case "columnGap":
    case "rowGap":
      return undefined;
    default:
      return 0;
  }
}

/**
 * Get property value from element, handling layout properties from layoutSnapshot
 */
function getPropertyValue(
  element: AnimationStateElement | null,
  property: AnimatableProperty
): number | boolean | undefined {
  if (!element) return undefined;

  // Layout properties come from layoutSnapshot
  if (property === "gap") {
    return element.layoutSnapshot?.gap;
  }
  if (property === "columnGap") {
    return element.layoutSnapshot?.columnGap;
  }
  if (property === "rowGap") {
    return element.layoutSnapshot?.rowGap;
  }

  // Other properties come from the element directly
  return element[property as keyof AnimationStateElement] as
    | number
    | boolean
    | undefined;
}

/**
 * Calculate difference between two elements
 */
export function calculateElementDiff(
  fromElement: AnimationStateElement | null,
  toElement: AnimationStateElement | null
): ElementDiff {
  const elementId = fromElement?.elementId || toElement?.elementId || "";
  const elementName = fromElement?.elementName || toElement?.elementName || "";

  const changes: PropertyDiff[] = [];

  for (const property of ANIMATABLE_PROPERTIES) {
    const fromValue = getPropertyValue(fromElement, property);
    const toValue = getPropertyValue(toElement, property);

    const diff = calculatePropertyDiff(property, fromValue, toValue);
    changes.push(diff);
  }

  const hasAnimatableChanges = changes.some((c) => c.hasChanged);

  return {
    elementId,
    elementName,
    changes,
    hasAnimatableChanges,
    fromElement: fromElement ? toSnapshot(fromElement) : null,
    toElement: toElement ? toSnapshot(toElement) : null,
    existsInFrom: !!fromElement,
    existsInTo: !!toElement,
  };
}

/**
 * Calculate differences between two animation states
 */
export function calculateStateDiff(
  fromState: AnimationState,
  toState: AnimationState
): StateDiff {
  const elementDiffs: ElementDiff[] = [];

  // Create maps for quick lookup
  const fromElements = new Map(
    fromState.elements.map((el) => [el.elementId, el])
  );
  const toElements = new Map(
    toState.elements.map((el) => [el.elementId, el])
  );

  // Get all unique element IDs
  const allElementIds = new Set([
    ...fromElements.keys(),
    ...toElements.keys(),
  ]);

  // Calculate diff for each element
  for (const elementId of allElementIds) {
    const fromEl = fromElements.get(elementId) || null;
    const toEl = toElements.get(elementId) || null;
    const diff = calculateElementDiff(fromEl, toEl);
    elementDiffs.push(diff);
  }

  // Count elements with changes
  const changedElementCount = elementDiffs.filter(
    (d) => d.hasAnimatableChanges
  ).length;

  return {
    fromStateId: fromState.id,
    fromStateName: fromState.name,
    toStateId: toState.id,
    toStateName: toState.name,
    elementDiffs,
    changedElementCount,
  };
}

/**
 * Check if a diff has any animatable changes
 */
export function hasAnimatableChanges(diff: ElementDiff): boolean {
  return diff.hasAnimatableChanges;
}

/**
 * Build a CSS transform string from element properties
 */
export function buildTransformString(
  element: ElementSnapshot,
  includeDefaults: boolean = false
): string {
  const transforms: string[] = [];

  // translateX and translateY
  const tx = element.translateX ?? 0;
  const ty = element.translateY ?? 0;
  if (tx !== 0 || ty !== 0 || includeDefaults) {
    if (tx !== 0 && ty !== 0) {
      transforms.push(`translate(${formatNumber(tx)}px, ${formatNumber(ty)}px)`);
    } else if (tx !== 0) {
      transforms.push(`translateX(${formatNumber(tx)}px)`);
    } else if (ty !== 0) {
      transforms.push(`translateY(${formatNumber(ty)}px)`);
    }
  }

  // Scale
  if (element.scale !== 1 || includeDefaults) {
    transforms.push(`scale(${formatNumber(element.scale)})`);
  }

  // Rotation
  if (element.rotation !== 0 || includeDefaults) {
    transforms.push(`rotate(${formatNumber(element.rotation)}deg)`);
  }

  return transforms.join(" ");
}

/**
 * Get changed properties from an element diff
 */
export function getChangedProperties(diff: ElementDiff): PropertyDiff[] {
  return diff.changes.filter((c) => c.hasChanged);
}

/**
 * Get all elements that have changes in a state diff
 */
export function getChangedElements(stateDiff: StateDiff): ElementDiff[] {
  return stateDiff.elementDiffs.filter((d) => d.hasAnimatableChanges);
}

/**
 * Check if an element enters (appears) in the transition
 */
export function isEnteringElement(diff: ElementDiff): boolean {
  return !diff.existsInFrom && diff.existsInTo;
}

/**
 * Check if an element exits (disappears) in the transition
 */
export function isExitingElement(diff: ElementDiff): boolean {
  return diff.existsInFrom && !diff.existsInTo;
}

/**
 * Get CSS properties object from element snapshot
 */
export function elementToCSSProperties(
  element: ElementSnapshot
): Record<string, string> {
  const props: Record<string, string> = {};

  // Opacity
  if (element.opacity !== 1) {
    props["opacity"] = formatNumber(element.opacity);
  }

  // Transform
  const transform = buildTransformString(element);
  if (transform) {
    props["transform"] = transform;
  }

  // Visibility
  if (!element.visible) {
    props["visibility"] = "hidden";
  }

  return props;
}

/**
 * Get Framer Motion properties from element snapshot
 */
export function elementToFramerProps(
  element: ElementSnapshot
): Record<string, number | string> {
  const props: Record<string, number | string> = {};

  // Position (using x/y for Framer Motion)
  if (element.translateX !== undefined && element.translateX !== 0) {
    props["x"] = element.translateX;
  }
  if (element.translateY !== undefined && element.translateY !== 0) {
    props["y"] = element.translateY;
  }

  // Opacity
  props["opacity"] = element.opacity;

  // Scale
  if (element.scale !== 1) {
    props["scale"] = element.scale;
  }

  // Rotation
  if (element.rotation !== 0) {
    props["rotate"] = element.rotation;
  }

  // Phase 3: Layout properties (Framer Motion uses CSS-style gap)
  if (element.gap !== undefined) {
    props["gap"] = element.gap;
  }
  if (element.columnGap !== undefined) {
    props["columnGap"] = element.columnGap;
  }
  if (element.rowGap !== undefined) {
    props["rowGap"] = element.rowGap;
  }

  return props;
}

/**
 * Get GSAP properties from element snapshot
 */
export function elementToGSAPProps(
  element: ElementSnapshot
): Record<string, number | string> {
  const props: Record<string, number | string> = {};

  // Position
  if (element.translateX !== undefined && element.translateX !== 0) {
    props["x"] = element.translateX;
  }
  if (element.translateY !== undefined && element.translateY !== 0) {
    props["y"] = element.translateY;
  }

  // Opacity
  props["opacity"] = element.opacity;

  // Scale
  if (element.scale !== 1) {
    props["scale"] = element.scale;
  }

  // Rotation
  if (element.rotation !== 0) {
    props["rotation"] = element.rotation;
  }

  // Phase 3: Layout properties (GSAP uses CSS-style gap)
  if (element.gap !== undefined) {
    props["gap"] = element.gap;
  }
  if (element.columnGap !== undefined) {
    props["columnGap"] = element.columnGap;
  }
  if (element.rowGap !== undefined) {
    props["rowGap"] = element.rowGap;
  }

  return props;
}

// =====================================================
// Phase 3: Layout-specific diff helpers
// =====================================================

/**
 * Check if an element diff has layout gap changes
 */
export function hasLayoutGapChanges(diff: ElementDiff): boolean {
  return diff.changes.some(
    (c) =>
      (c.property === "gap" || c.property === "columnGap" || c.property === "rowGap") &&
      c.hasChanged
  );
}

/**
 * Get elements with layout gap changes from a state diff
 */
export function getElementsWithLayoutChanges(stateDiff: StateDiff): ElementDiff[] {
  return stateDiff.elementDiffs.filter((d) => hasLayoutGapChanges(d));
}

/**
 * Get layout-specific properties from an element snapshot
 */
export function elementToLayoutProps(
  element: ElementSnapshot
): Record<string, number> | null {
  if (!element.layoutType || element.layoutType === "none") {
    return null;
  }

  const props: Record<string, number> = {};

  if (element.gap !== undefined) {
    props["gap"] = element.gap;
  }
  if (element.columnGap !== undefined) {
    props["columnGap"] = element.columnGap;
  }
  if (element.rowGap !== undefined) {
    props["rowGap"] = element.rowGap;
  }

  return Object.keys(props).length > 0 ? props : null;
}
