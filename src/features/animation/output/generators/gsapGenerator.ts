/**
 * GSAP Generator
 * Generates GSAP timeline code from animation states
 */

import type { AnimationState } from "../../types/animation";
import type { StateTransition } from "../../types/transition";
import { toGSAPEase } from "../../utils/easingUtils";
import { calculateCascadeTimings } from "../../utils/cascadeTiming";
import type { GSAPOutputOptions } from "../types/animationOutput";
import { DEFAULT_GSAP_OPTIONS } from "../types/animationOutput";
import {
  calculateStateDiff,
  getChangedElements,
  elementToGSAPProps,
} from "../utils/diffCalculator";
import { getElementSelector, toGSAPLabel } from "../utils/elementNaming";
import {
  formatNumber,
  joinCodeBlocks,
  generateComment,
  msToSecondsNum,
  indent,
} from "../utils/formatHelpers";

/**
 * Generate GSAP code from states and transitions
 */
export function generateGSAP(
  states: AnimationState[],
  transitions: StateTransition[],
  options: Partial<GSAPOutputOptions> = {}
): string {
  const opts = { ...DEFAULT_GSAP_OPTIONS, ...options };
  const blocks: string[] = [];

  if (states.length === 0) {
    return opts.includeComments ? "// No animation states defined" : "";
  }

  // Generate imports if requested
  if (opts.includeImports) {
    blocks.push(generateImports());
  }

  // Generate timeline code
  if (opts.useTimeline) {
    const timelineCode = generateTimeline(states, transitions, opts);
    blocks.push(timelineCode);
  } else {
    const tweenCode = generateIndividualTweens(states, transitions, opts);
    blocks.push(tweenCode);
  }

  // Generate usage example
  if (opts.includeComments) {
    blocks.push(generateUsageExample(opts));
  }

  return joinCodeBlocks(blocks, 1);
}

/**
 * Generate GSAP import statements
 */
function generateImports(): string {
  return `import gsap from "gsap";`;
}

/**
 * Generate GSAP timeline code
 */
function generateTimeline(
  states: AnimationState[],
  transitions: StateTransition[],
  opts: GSAPOutputOptions
): string {
  const lines: string[] = [];
  const tlVar = opts.timelineVarName;

  if (opts.includeComments) {
    lines.push(generateComment("Create animation timeline", "js"));
  }

  // Create timeline
  lines.push(`const ${tlVar} = gsap.timeline({ paused: true });`);
  lines.push("");

  // Process each transition
  for (const transition of transitions) {
    const fromState = states.find((s) => s.id === transition.fromStateId);
    const toState = states.find((s) => s.id === transition.toStateId);

    if (!fromState || !toState) continue;

    const stateDiff = calculateStateDiff(fromState, toState);
    const changedElements = getChangedElements(stateDiff);

    if (changedElements.length === 0) continue;

    if (opts.includeComments) {
      lines.push(generateComment(`Transition: ${fromState.name} -> ${toState.name}`, "js"));
    }

    // Add label for this transition
    const label = toGSAPLabel(toState.name);
    lines.push(`${tlVar}.addLabel("${label}");`);
    lines.push("");

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

    // Generate .to() calls for each changed element
    for (let i = 0; i < changedElements.length; i++) {
      const elementDiff = changedElements[i];

      if (!elementDiff.toElement) continue;

      const selector = getElementSelector(
        { elementId: elementDiff.elementId, elementName: elementDiff.elementName },
        opts.namingStrategy
      );

      // Get element-specific override if exists
      const override = transition.elementOverrides.find(
        (o) => o.elementId === elementDiff.elementId
      );

      // Check for cascade timing first
      const cascadeTiming = cascadeTimings?.get(elementDiff.elementId);

      let duration = override?.duration ?? transition.duration;
      let delay = override?.delay ?? transition.delay;
      const easing = override?.easing ?? transition.easing;

      // Calculate stagger delay (fallback if no cascade)
      let staggerDelay = 0;
      if (!cascadeTiming && transition.stagger?.enabled) {
        staggerDelay = calculateStaggerDelay(
          i,
          changedElements.length,
          transition.stagger
        );
      }

      // Cascade timing takes precedence
      if (cascadeTiming) {
        duration = cascadeTiming.duration;
        delay = cascadeTiming.delay;
      }

      // Build properties object
      const props = elementToGSAPProps(elementDiff.toElement);
      const propsWithTiming = {
        ...props,
        duration: msToSecondsNum(duration),
        ease: toGSAPEase(easing),
      };

      // Add delay if present
      const totalDelay = cascadeTiming ? delay : delay + staggerDelay;
      if (totalDelay > 0) {
        (propsWithTiming as Record<string, unknown>).delay = msToSecondsNum(totalDelay);
      }

      // Generate .to() call
      // For cascade, use "<" position for overlapping animations
      const propsStr = formatGSAPProps(propsWithTiming, opts.indentString);
      const position = cascadeTiming ? (i === 0 ? `"${label}"` : `"<"`) : (totalDelay > 0 ? "" : `"${label}"`);
      const positionArg = position ? `, ${position}` : "";

      lines.push(`${tlVar}.to("${selector}", ${propsStr}${positionArg});`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generate individual GSAP tweens (not using timeline)
 */
function generateIndividualTweens(
  states: AnimationState[],
  transitions: StateTransition[],
  opts: GSAPOutputOptions
): string {
  const lines: string[] = [];

  if (opts.includeComments) {
    lines.push(generateComment("Animation functions", "js"));
  }

  // Generate a function for each transition
  for (const transition of transitions) {
    const fromState = states.find((s) => s.id === transition.fromStateId);
    const toState = states.find((s) => s.id === transition.toStateId);

    if (!fromState || !toState) continue;

    const stateDiff = calculateStateDiff(fromState, toState);
    const changedElements = getChangedElements(stateDiff);

    if (changedElements.length === 0) continue;

    // Create function name
    const funcName = `animateTo${capitalize(toGSAPLabel(toState.name))}`;

    lines.push(`function ${funcName}() {`);

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

    // Generate gsap.to() for each element
    for (let i = 0; i < changedElements.length; i++) {
      const elementDiff = changedElements[i];

      if (!elementDiff.toElement) continue;

      const selector = getElementSelector(
        { elementId: elementDiff.elementId, elementName: elementDiff.elementName },
        opts.namingStrategy
      );

      const override = transition.elementOverrides.find(
        (o) => o.elementId === elementDiff.elementId
      );

      // Check for cascade timing first
      const cascadeTiming = cascadeTimings?.get(elementDiff.elementId);

      let duration = override?.duration ?? transition.duration;
      let delay = override?.delay ?? transition.delay;
      const easing = override?.easing ?? transition.easing;

      let staggerDelay = 0;
      if (!cascadeTiming && transition.stagger?.enabled) {
        staggerDelay = calculateStaggerDelay(
          i,
          changedElements.length,
          transition.stagger
        );
      }

      // Cascade timing takes precedence
      if (cascadeTiming) {
        duration = cascadeTiming.duration;
        delay = cascadeTiming.delay;
      }

      const props = elementToGSAPProps(elementDiff.toElement);
      const propsWithTiming = {
        ...props,
        duration: msToSecondsNum(duration),
        ease: toGSAPEase(easing),
      };

      const totalDelay = cascadeTiming ? delay : delay + staggerDelay;
      if (totalDelay > 0) {
        (propsWithTiming as Record<string, unknown>).delay = msToSecondsNum(totalDelay);
      }

      const propsStr = formatGSAPProps(propsWithTiming, opts.indentString);
      lines.push(`  gsap.to("${selector}", ${propsStr});`);
    }

    lines.push(`}`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generate usage example comment
 */
function generateUsageExample(opts: GSAPOutputOptions): string {
  const lines: string[] = [];

  if (opts.useTimeline) {
    lines.push("// Usage:");
    lines.push(`// ${opts.timelineVarName}.play();     // Play forward`);
    lines.push(`// ${opts.timelineVarName}.reverse();  // Play backward`);
    lines.push(`// ${opts.timelineVarName}.seek("labelName");  // Jump to label`);
    lines.push(`// ${opts.timelineVarName}.restart();  // Restart from beginning`);
  } else {
    lines.push("// Usage:");
    lines.push("// Call the function to trigger the animation");
    lines.push("// animateToStateName();");
  }

  return lines.join("\n");
}

/**
 * Format GSAP properties object as code string
 */
function formatGSAPProps(
  props: Record<string, unknown>,
  indentStr: string
): string {
  const entries = Object.entries(props);

  // For small objects, use single line
  if (entries.length <= 4) {
    const parts = entries.map(([key, val]) => {
      if (typeof val === "number") {
        return `${key}: ${formatNumber(val)}`;
      } else if (typeof val === "string") {
        return `${key}: "${val}"`;
      }
      return `${key}: ${val}`;
    });
    return `{ ${parts.join(", ")} }`;
  }

  // For larger objects, use multi-line
  const lines = entries.map(([key, val]) => {
    if (typeof val === "number") {
      return `${key}: ${formatNumber(val)},`;
    } else if (typeof val === "string") {
      return `${key}: "${val}",`;
    }
    return `${key}: ${val},`;
  });

  return `{\n${indent(lines.join("\n"), 1, indentStr)}\n}`;
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

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
