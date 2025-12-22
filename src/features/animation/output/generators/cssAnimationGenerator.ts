/**
 * CSS Animation Generator
 * Generates CSS @keyframes and transitions from animation states
 */

import type { AnimationState } from "../../types/animation";
import type { StateTransition } from "../../types/transition";
import { toCSS } from "../../utils/easingUtils";
import { calculateCascadeTimings } from "../../utils/cascadeTiming";
import type { CSSOutputOptions, ElementDiff } from "../types/animationOutput";
import { DEFAULT_CSS_OPTIONS } from "../types/animationOutput";
import {
  calculateStateDiff,
  getChangedElements,
  buildTransformString,
} from "../utils/diffCalculator";
import {
  getElementSelector,
  toStateClassName,
  toKeyframesName,
} from "../utils/elementNaming";
import {
  cssRule,
  cssProperty,
  generateComment,
  joinCodeBlocks,
  msToSeconds,
  formatNumber,
  indent,
} from "../utils/formatHelpers";

/**
 * Generate CSS animation code from states and transitions
 */
export function generateCSSAnimation(
  states: AnimationState[],
  transitions: StateTransition[],
  options: Partial<CSSOutputOptions> = {}
): string {
  const opts = { ...DEFAULT_CSS_OPTIONS, ...options };
  const blocks: string[] = [];

  if (states.length === 0) {
    return opts.includeComments
      ? generateComment("No animation states defined", "css")
      : "";
  }

  // Add header comment
  if (opts.includeComments) {
    blocks.push(generateComment("Animation Styles", "css"));
  }

  // Generate CSS custom properties
  if (opts.useCustomProperties && transitions.length > 0) {
    const customProps = generateCustomProperties(transitions, opts);
    if (customProps) {
      blocks.push(customProps);
    }
  }

  // Generate base element styles (from initial state)
  const initialState = states.find((s) => s.trigger.type === "initial") || states[0];
  if (initialState) {
    const baseStyles = generateBaseStyles(initialState, opts);
    if (baseStyles) {
      blocks.push(baseStyles);
    }
  }

  // Generate transitions and state classes
  if (transitions.length > 0) {
    // Generate transition styles (CSS transitions or @keyframes)
    if (opts.preferKeyframes) {
      const keyframes = generateKeyframes(states, transitions, opts);
      if (keyframes) {
        blocks.push(keyframes);
      }
    } else {
      const transitionStyles = generateTransitionStyles(states, transitions, opts);
      if (transitionStyles) {
        blocks.push(transitionStyles);
      }
    }

    // Generate state classes
    const stateClasses = generateStateClasses(states, transitions, opts);
    if (stateClasses) {
      blocks.push(stateClasses);
    }
  }

  return joinCodeBlocks(blocks, 1);
}

/**
 * Generate CSS custom properties for animation values
 */
function generateCustomProperties(
  transitions: StateTransition[],
  opts: CSSOutputOptions
): string {
  const prefix = opts.customPropertyPrefix;
  const props: string[] = [];

  // Get representative transition for global values
  const primaryTransition = transitions[0];

  props.push(
    cssProperty(`--${prefix}-duration`, msToSeconds(primaryTransition.duration))
  );
  props.push(cssProperty(`--${prefix}-delay`, msToSeconds(primaryTransition.delay)));
  props.push(cssProperty(`--${prefix}-easing`, toCSS(primaryTransition.easing)));

  if (primaryTransition.stagger?.enabled) {
    props.push(
      cssProperty(
        `--${prefix}-stagger`,
        msToSeconds(primaryTransition.stagger.delay)
      )
    );
  }

  // Add cascade properties
  if (primaryTransition.cascade?.enabled) {
    props.push(
      cssProperty(
        `--${prefix}-cascade-delay-per-level`,
        msToSeconds(primaryTransition.cascade.delayPerLevel)
      )
    );
    props.push(
      cssProperty(
        `--${prefix}-cascade-stagger`,
        msToSeconds(primaryTransition.cascade.stagger.amount)
      )
    );
    props.push(
      cssProperty(
        `--${prefix}-cascade-duration-scale`,
        formatNumber(primaryTransition.cascade.durationScale)
      )
    );
  }

  const content = props.join("\n");
  return `:root {\n${indent(content, 1, opts.indentString)}\n}`;
}

/**
 * Generate base element styles from initial state
 */
function generateBaseStyles(
  initialState: AnimationState,
  opts: CSSOutputOptions
): string {
  const rules: string[] = [];

  if (opts.includeComments) {
    rules.push(generateComment("Base element styles (initial state)", "css"));
  }

  for (const element of initialState.elements) {
    const selector = getElementSelector(element, opts.namingStrategy);
    const properties: Record<string, string> = {};

    // Opacity
    if (element.opacity !== 1) {
      properties["opacity"] = formatNumber(element.opacity);
    }

    // Transform
    const transform = buildTransformString({
      ...element,
      translateX: element.translateX ?? 0,
      translateY: element.translateY ?? 0,
    });
    if (transform) {
      properties["transform"] = transform;
    }

    // Visibility
    if (!element.visible) {
      properties["visibility"] = "hidden";
    }

    // Add transition property if there will be animations
    if (Object.keys(properties).length > 0) {
      const prefix = opts.customPropertyPrefix;
      if (opts.useCustomProperties) {
        properties["transition"] = `all var(--${prefix}-duration) var(--${prefix}-easing) var(--${prefix}-delay)`;
      }
      rules.push(cssRule(selector, properties, opts.indentString));
    }
  }

  return rules.join("\n\n");
}

/**
 * Generate CSS transition styles for elements
 */
function generateTransitionStyles(
  states: AnimationState[],
  transitions: StateTransition[],
  opts: CSSOutputOptions
): string {
  const rules: string[] = [];

  if (opts.includeComments) {
    rules.push(generateComment("Transition timing for elements", "css"));
  }

  for (const transition of transitions) {
    const fromState = states.find((s) => s.id === transition.fromStateId);
    const toState = states.find((s) => s.id === transition.toStateId);

    if (!fromState || !toState) continue;

    const stateDiff = calculateStateDiff(fromState, toState);
    const changedElements = getChangedElements(stateDiff);

    // Calculate cascade timings if enabled
    let cascadeTimings: Map<string, { delay: number; duration: number }> | null = null;
    if (transition.cascade?.enabled) {
      cascadeTimings = calculateCascadeTimings(
        fromState.elements,
        transition.cascade,
        transition.duration,
        transition.delay,
        transition.easing
      );
    }

    // Generate element-specific transition overrides
    for (let i = 0; i < changedElements.length; i++) {
      const elementDiff = changedElements[i];
      const override = transition.elementOverrides.find(
        (o) => o.elementId === elementDiff.elementId
      );

      // Check for cascade timing first
      const cascadeTiming = cascadeTimings?.get(elementDiff.elementId);

      // Check for stagger delay (fallback if no cascade)
      let staggerDelay = 0;
      if (!cascadeTiming && transition.stagger?.enabled) {
        staggerDelay = calculateStaggerDelay(
          i,
          changedElements.length,
          transition.stagger
        );
      }

      // Determine if we need to output styles
      if (override || staggerDelay > 0 || cascadeTiming) {
        const selector = getElementSelector(
          { elementId: elementDiff.elementId, elementName: elementDiff.elementName },
          opts.namingStrategy
        );

        // Cascade timing takes precedence
        let duration = override?.duration ?? transition.duration;
        let delay = (override?.delay ?? transition.delay) + staggerDelay;
        const easing = override?.easing ?? transition.easing;

        if (cascadeTiming) {
          duration = cascadeTiming.duration;
          delay = cascadeTiming.delay;
        }

        const properties: Record<string, string> = {
          "transition-duration": msToSeconds(duration),
          "transition-timing-function": toCSS(easing),
          "transition-delay": msToSeconds(delay),
        };

        rules.push(cssRule(selector, properties, opts.indentString));
      }
    }
  }

  return rules.join("\n\n");
}

/**
 * Generate state classes for toggling states
 */
function generateStateClasses(
  states: AnimationState[],
  _transitions: StateTransition[],
  opts: CSSOutputOptions
): string {
  const rules: string[] = [];

  if (opts.includeComments) {
    rules.push(generateComment("State classes", "css"));
  }

  // Find initial state to diff against
  const initialState = states.find((s) => s.trigger.type === "initial") || states[0];

  for (const state of states) {
    if (state.id === initialState.id) continue;

    const stateClassName = toStateClassName(state.name);

    if (opts.includeComments) {
      rules.push(generateComment(`State: ${state.name}`, "css"));
    }

    const stateDiff = calculateStateDiff(initialState, state);

    for (const elementDiff of stateDiff.elementDiffs) {
      if (!elementDiff.hasAnimatableChanges || !elementDiff.toElement) continue;

      const baseSelector = getElementSelector(
        { elementId: elementDiff.elementId, elementName: elementDiff.elementName },
        opts.namingStrategy
      );
      const selector = `${baseSelector}.${stateClassName}`;

      const properties = buildStateProperties(elementDiff);
      if (Object.keys(properties).length > 0) {
        rules.push(cssRule(selector, properties, opts.indentString));
      }
    }
  }

  return rules.join("\n\n");
}

/**
 * Generate @keyframes animations
 */
function generateKeyframes(
  states: AnimationState[],
  transitions: StateTransition[],
  opts: CSSOutputOptions
): string {
  const rules: string[] = [];

  if (opts.includeComments) {
    rules.push(generateComment("@keyframes animations", "css"));
  }

  for (const transition of transitions) {
    const fromState = states.find((s) => s.id === transition.fromStateId);
    const toState = states.find((s) => s.id === transition.toStateId);

    if (!fromState || !toState) continue;

    const stateDiff = calculateStateDiff(fromState, toState);
    const changedElements = getChangedElements(stateDiff);

    for (const elementDiff of changedElements) {
      if (!elementDiff.fromElement || !elementDiff.toElement) continue;

      const animationName = toKeyframesName(
        fromState.name,
        toState.name,
        elementDiff.elementName
      );

      const fromProps = buildKeyframeProperties(elementDiff.fromElement);
      const toProps = buildKeyframeProperties(elementDiff.toElement);

      const keyframesContent = [
        `from {\n${indent(Object.entries(fromProps).map(([k, v]) => cssProperty(k, v)).join("\n"), 1, opts.indentString)}\n${opts.indentString}}`,
        `to {\n${indent(Object.entries(toProps).map(([k, v]) => cssProperty(k, v)).join("\n"), 1, opts.indentString)}\n${opts.indentString}}`,
      ].join("\n");

      rules.push(`@keyframes ${animationName} {\n${indent(keyframesContent, 1, opts.indentString)}\n}`);

      // Generate animation application rule
      const selector = getElementSelector(
        { elementId: elementDiff.elementId, elementName: elementDiff.elementName },
        opts.namingStrategy
      );
      const animatedSelector = `${selector}.animate`;
      const animationProps: Record<string, string> = {
        "animation-name": animationName,
        "animation-duration": msToSeconds(transition.duration),
        "animation-timing-function": toCSS(transition.easing),
        "animation-fill-mode": "forwards",
      };

      if (transition.delay > 0) {
        animationProps["animation-delay"] = msToSeconds(transition.delay);
      }

      rules.push(cssRule(animatedSelector, animationProps, opts.indentString));
    }
  }

  return rules.join("\n\n");
}

/**
 * Build CSS properties object for a state
 */
function buildStateProperties(diff: ElementDiff): Record<string, string> {
  const properties: Record<string, string> = {};

  if (!diff.toElement) return properties;

  const element = diff.toElement;

  // Check which properties changed
  for (const change of diff.changes) {
    if (!change.hasChanged) continue;

    switch (change.property) {
      case "opacity":
        properties["opacity"] = formatNumber(change.toValue as number);
        break;
      case "scale":
      case "rotation":
      case "translateX":
      case "translateY":
        // These all contribute to transform
        break;
      case "visible":
        properties["visibility"] = (change.toValue as boolean) ? "visible" : "hidden";
        break;
      // Phase 3: Layout properties
      case "gap":
        if (change.toValue !== undefined) {
          properties["gap"] = `${change.toValue}px`;
        }
        break;
      case "columnGap":
        if (change.toValue !== undefined) {
          properties["column-gap"] = `${change.toValue}px`;
        }
        break;
      case "rowGap":
        if (change.toValue !== undefined) {
          properties["row-gap"] = `${change.toValue}px`;
        }
        break;
    }
  }

  // Build transform string if any transform properties changed
  const hasTransformChanges = diff.changes.some(
    (c) =>
      c.hasChanged &&
      ["scale", "rotation", "translateX", "translateY"].includes(c.property)
  );

  if (hasTransformChanges) {
    const transform = buildTransformString(element);
    if (transform) {
      properties["transform"] = transform;
    } else {
      properties["transform"] = "none";
    }
  }

  return properties;
}

/**
 * Build keyframe properties from element snapshot
 */
function buildKeyframeProperties(
  element: {
    opacity: number;
    scale: number;
    rotation: number;
    visible: boolean;
    translateX?: number;
    translateY?: number;
    // Phase 3: Layout properties
    gap?: number;
    columnGap?: number;
    rowGap?: number;
  }
): Record<string, string> {
  const properties: Record<string, string> = {};

  properties["opacity"] = formatNumber(element.opacity);

  const transform = buildTransformString({
    ...element,
    elementId: "",
    elementName: "",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    translateX: element.translateX ?? 0,
    translateY: element.translateY ?? 0,
  });
  if (transform) {
    properties["transform"] = transform;
  }

  if (!element.visible) {
    properties["visibility"] = "hidden";
  }

  // Phase 3: Layout properties
  if (element.gap !== undefined) {
    properties["gap"] = `${element.gap}px`;
  }
  if (element.columnGap !== undefined) {
    properties["column-gap"] = `${element.columnGap}px`;
  }
  if (element.rowGap !== undefined) {
    properties["row-gap"] = `${element.rowGap}px`;
  }

  return properties;
}

/**
 * Calculate stagger delay for an element
 */
function calculateStaggerDelay(
  index: number,
  total: number,
  stagger: { delay: number; from: "start" | "end" | "center" | "random" }
): number {
  switch (stagger.from) {
    case "start":
      return index * stagger.delay;
    case "end":
      return (total - 1 - index) * stagger.delay;
    case "center": {
      const center = (total - 1) / 2;
      return Math.abs(index - center) * stagger.delay;
    }
    case "random":
      return Math.random() * stagger.delay * total;
    default:
      return index * stagger.delay;
  }
}
