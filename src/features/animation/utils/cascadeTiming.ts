/**
 * Cascade Timing Utilities
 *
 * Utilities for building hierarchy trees, calculating cascade timings,
 * and ordering elements for hierarchical animations.
 */

import type { AnimationStateElement } from "../types/animation";
import type {
  CascadeConfig,
  CascadeStaggerDirection,
} from "../types/cascade";
import type { EasingCurve } from "../types/transition";
import { DEFAULT_EASING } from "../types/transition";
import { DEFAULT_CASCADE_CONFIG } from "../types/cascade";

/**
 * Represents a node in the element hierarchy tree
 */
export interface HierarchyNode {
  element: AnimationStateElement;
  children: HierarchyNode[];
  depth: number;
  siblingIndex: number;
  siblingCount: number;
}

/**
 * Calculated timing for a single element during cascade animation
 */
export interface ElementCascadeTiming {
  elementId: string;
  delay: number;
  duration: number;
  easing: EasingCurve;
  depth: number;
  siblingIndex: number;
}

/**
 * Build a hierarchy tree from a flat list of elements using parentId
 */
export function buildHierarchyTree(
  elements: AnimationStateElement[]
): HierarchyNode[] {
  // Create a map for quick element lookup
  const elementMap = new Map<string, AnimationStateElement>();
  elements.forEach((el) => elementMap.set(el.elementId, el));

  // Create a map to hold nodes
  const nodeMap = new Map<string, HierarchyNode>();

  // Create nodes for all elements
  elements.forEach((el) => {
    nodeMap.set(el.elementId, {
      element: el,
      children: [],
      depth: 0,
      siblingIndex: 0,
      siblingCount: 1,
    });
  });

  // Build parent-child relationships
  const rootNodes: HierarchyNode[] = [];

  elements.forEach((el) => {
    const node = nodeMap.get(el.elementId)!;

    if (el.parentId && nodeMap.has(el.parentId)) {
      const parentNode = nodeMap.get(el.parentId)!;
      parentNode.children.push(node);
    } else {
      // This is a root element
      rootNodes.push(node);
    }
  });

  // Calculate depths and sibling indices
  function calculateDepths(nodes: HierarchyNode[], depth: number): void {
    nodes.forEach((node, index) => {
      node.depth = depth;
      node.siblingIndex = index;
      node.siblingCount = nodes.length;
      calculateDepths(node.children, depth + 1);
    });
  }

  calculateDepths(rootNodes, 0);

  return rootNodes;
}

/**
 * Flatten hierarchy tree into an ordered list based on stagger direction
 */
export function flattenHierarchy(
  nodes: HierarchyNode[],
  direction: CascadeStaggerDirection = "normal"
): HierarchyNode[] {
  function collectAll(nodeList: HierarchyNode[]): HierarchyNode[] {
    const collected: HierarchyNode[] = [];
    for (const node of nodeList) {
      collected.push(node);
      collected.push(...collectAll(node.children));
    }
    return collected;
  }

  const allNodes = collectAll(nodes);

  switch (direction) {
    case "normal":
      return allNodes;

    case "reverse":
      return allNodes.reverse();

    case "center-out": {
      // Sort by distance from center
      const center = (allNodes.length - 1) / 2;
      return [...allNodes].sort((a, b) => {
        const aIndex = allNodes.indexOf(a);
        const bIndex = allNodes.indexOf(b);
        const aDistance = Math.abs(aIndex - center);
        const bDistance = Math.abs(bIndex - center);
        return aDistance - bDistance;
      });
    }

    case "edges-in": {
      // Sort by distance from edges (center last)
      const center = (allNodes.length - 1) / 2;
      return [...allNodes].sort((a, b) => {
        const aIndex = allNodes.indexOf(a);
        const bIndex = allNodes.indexOf(b);
        const aDistance = Math.abs(aIndex - center);
        const bDistance = Math.abs(bIndex - center);
        return bDistance - aDistance;
      });
    }

    default:
      return allNodes;
  }
}

/**
 * Flatten hierarchy in depth-first order (parents before children)
 */
export function flattenDepthFirst(nodes: HierarchyNode[]): HierarchyNode[] {
  const result: HierarchyNode[] = [];

  function traverse(nodeList: HierarchyNode[]): void {
    for (const node of nodeList) {
      result.push(node);
      traverse(node.children);
    }
  }

  traverse(nodes);
  return result;
}

/**
 * Calculate cascade timings for all elements
 */
export function calculateCascadeTimings(
  elements: AnimationStateElement[],
  cascade: CascadeConfig | undefined,
  baseDuration: number,
  baseDelay: number = 0,
  baseEasing: EasingCurve = DEFAULT_EASING
): Map<string, ElementCascadeTiming> {
  const timings = new Map<string, ElementCascadeTiming>();

  if (!cascade?.enabled || elements.length === 0) {
    // No cascade - all elements use base timing
    elements.forEach((el) => {
      timings.set(el.elementId, {
        elementId: el.elementId,
        delay: baseDelay,
        duration: baseDuration,
        easing: baseEasing,
        depth: 0,
        siblingIndex: 0,
      });
    });
    return timings;
  }

  // Build hierarchy tree
  const tree = buildHierarchyTree(elements);
  const flatNodes = flattenDepthFirst(tree);

  // Calculate stagger order
  const staggerOrder = getStaggerOrder(flatNodes, cascade.stagger);

  // Calculate timing for each element
  flatNodes.forEach((node) => {
    const { element, depth, siblingIndex } = node;
    const staggerPosition = staggerOrder.get(element.elementId) ?? 0;

    // Calculate delay: base + depth delay + stagger delay
    const depthDelay = depth * cascade.delayPerLevel;
    const staggerDelay = staggerPosition * cascade.stagger.amount;
    const totalDelay = baseDelay + depthDelay + staggerDelay;

    // Calculate duration: base * scale^depth
    const durationScale = Math.pow(cascade.durationScale, depth);
    const scaledDuration = Math.round(baseDuration * durationScale);

    // Get easing (inherit from parent or use base)
    const easing = cascade.easingInherit ? baseEasing : element.timing?.easing ?? baseEasing;

    timings.set(element.elementId, {
      elementId: element.elementId,
      delay: totalDelay,
      duration: scaledDuration,
      easing,
      depth,
      siblingIndex,
    });
  });

  return timings;
}

/**
 * Get stagger order map based on cascade stagger configuration
 */
function getStaggerOrder(
  nodes: HierarchyNode[],
  stagger: CascadeConfig["stagger"]
): Map<string, number> {
  const orderMap = new Map<string, number>();

  if (stagger.amount === 0) {
    // No stagger - all at position 0
    nodes.forEach((node) => {
      orderMap.set(node.element.elementId, 0);
    });
    return orderMap;
  }

  // Group nodes by depth for sibling-based stagger
  const nodesByDepth = new Map<number, HierarchyNode[]>();
  nodes.forEach((node) => {
    const depthNodes = nodesByDepth.get(node.depth) || [];
    depthNodes.push(node);
    nodesByDepth.set(node.depth, depthNodes);
  });

  // Calculate order based on stagger.from
  let globalPosition = 0;

  nodesByDepth.forEach((depthNodes, _depth) => {
    const orderedNodes = applyStaggerDirection(depthNodes, stagger);

    orderedNodes.forEach((node) => {
      if (typeof stagger.from === "number") {
        // Use sibling index for stagger starting point
        const distanceFromStart = Math.abs(node.siblingIndex - stagger.from);
        orderMap.set(node.element.elementId, distanceFromStart);
      } else {
        orderMap.set(node.element.elementId, globalPosition++);
      }
    });
  });

  return orderMap;
}

/**
 * Apply stagger direction to a list of nodes
 */
function applyStaggerDirection(
  nodes: HierarchyNode[],
  stagger: CascadeConfig["stagger"]
): HierarchyNode[] {
  const ordered = [...nodes];

  switch (stagger.from) {
    case "end":
      ordered.reverse();
      break;

    case "center": {
      const center = (ordered.length - 1) / 2;
      ordered.sort((a, b) => {
        const aDistance = Math.abs(a.siblingIndex - center);
        const bDistance = Math.abs(b.siblingIndex - center);
        return aDistance - bDistance;
      });
      break;
    }

    case "random":
      // Fisher-Yates shuffle
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
      break;

    case "start":
    default:
      // Already in order
      break;
  }

  return ordered;
}

/**
 * Get elements in cascade order (for code generation)
 */
export function getElementsInCascadeOrder(
  elements: AnimationStateElement[],
  cascade: CascadeConfig | undefined
): AnimationStateElement[] {
  if (!cascade?.enabled || elements.length === 0) {
    return elements;
  }

  const tree = buildHierarchyTree(elements);
  const orderedNodes = flattenHierarchy(tree, cascade.stagger.direction);
  return orderedNodes.map((node) => node.element);
}

/**
 * Calculate grid-specific cascade timings
 */
export function calculateGridCascadeTiming(
  elements: AnimationStateElement[],
  cascade: CascadeConfig | undefined,
  columns: number,
  rows: number,
  baseDuration: number,
  baseDelay: number = 0,
  baseEasing: EasingCurve = DEFAULT_EASING
): Map<string, ElementCascadeTiming> {
  const timings = new Map<string, ElementCascadeTiming>();

  if (!cascade?.enabled || !cascade.gridPattern || elements.length === 0) {
    // Fall back to standard cascade timing
    return calculateCascadeTimings(
      elements,
      cascade,
      baseDuration,
      baseDelay,
      baseEasing
    );
  }

  // For grid patterns, we assume elements are in row-major order
  elements.forEach((el, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    let position: number;

    switch (cascade.gridPattern) {
      case "row-by-row":
        position = row * columns + col;
        break;

      case "column-by-column":
        position = col * rows + row;
        break;

      case "diagonal":
        // Animate diagonally (top-left to bottom-right)
        position = row + col;
        break;

      default:
        position = index;
    }

    const delay = baseDelay + position * cascade.stagger.amount;

    timings.set(el.elementId, {
      elementId: el.elementId,
      delay,
      duration: baseDuration,
      easing: baseEasing,
      depth: 0,
      siblingIndex: index,
    });
  });

  return timings;
}

/**
 * Get the maximum delay in a set of cascade timings
 * (useful for calculating total animation duration)
 */
export function getMaxCascadeDelay(
  timings: Map<string, ElementCascadeTiming>
): number {
  let maxDelay = 0;
  timings.forEach((timing) => {
    const endTime = timing.delay + timing.duration;
    if (endTime > maxDelay) {
      maxDelay = endTime;
    }
  });
  return maxDelay;
}

/**
 * Calculate element progress based on cascade timing
 * Returns 0-1 progress for a specific element at a given global time
 */
export function calculateElementProgress(
  globalTime: number,
  timing: ElementCascadeTiming
): number {
  const { delay, duration } = timing;

  if (globalTime < delay) {
    return 0;
  }

  if (globalTime >= delay + duration) {
    return 1;
  }

  return (globalTime - delay) / duration;
}

/**
 * Check if cascade animation is complete
 */
export function isCascadeComplete(
  globalTime: number,
  timings: Map<string, ElementCascadeTiming>
): boolean {
  return globalTime >= getMaxCascadeDelay(timings);
}

/**
 * Get effective cascade config with defaults applied
 */
export function getEffectiveCascadeConfig(
  cascade: Partial<CascadeConfig> | undefined
): CascadeConfig {
  if (!cascade) {
    return { ...DEFAULT_CASCADE_CONFIG };
  }

  return {
    ...DEFAULT_CASCADE_CONFIG,
    ...cascade,
    stagger: {
      ...DEFAULT_CASCADE_CONFIG.stagger,
      ...cascade.stagger,
    },
  };
}
