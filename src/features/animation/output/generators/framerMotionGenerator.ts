/**
 * Framer Motion Generator
 * Generates Framer Motion variants and React components from animation states
 */

import type { AnimationState } from "../../types/animation";
import type { StateTransition } from "../../types/transition";
import { toFramerMotionSpring } from "../../utils/easingUtils";
import type { FramerMotionOutputOptions } from "../types/animationOutput";
import { DEFAULT_FRAMER_MOTION_OPTIONS } from "../types/animationOutput";
import { elementToFramerProps } from "../utils/diffCalculator";
import { toVariantKey, toVariableName } from "../utils/elementNaming";
import {
  formatNumber,
  joinCodeBlocks,
  generateMultiLineComment,
  msToSecondsNum,
  indent,
} from "../utils/formatHelpers";

/**
 * Generate Framer Motion code from states and transitions
 */
export function generateFramerMotion(
  states: AnimationState[],
  transitions: StateTransition[],
  options: Partial<FramerMotionOutputOptions> = {}
): string {
  const opts = { ...DEFAULT_FRAMER_MOTION_OPTIONS, ...options };
  const blocks: string[] = [];

  if (states.length === 0) {
    return opts.includeComments ? "// No animation states defined" : "";
  }

  // Generate imports
  const imports = generateImports(opts, transitions);
  blocks.push(imports);

  // Generate variants for each unique element
  const elementVariants = generateElementVariants(states, transitions, opts);
  blocks.push(elementVariants);

  // Generate full component if requested
  if (opts.outputType === "full-component") {
    const component = generateComponent(states, transitions, opts);
    blocks.push(component);
  }

  return joinCodeBlocks(blocks, 1);
}

/**
 * Generate import statements
 */
function generateImports(
  opts: FramerMotionOutputOptions,
  transitions: StateTransition[]
): string {
  const imports: string[] = ["motion"];

  // Add Variants type for TypeScript
  if (opts.useTypeScript) {
    imports.push("Variants");
  }

  // Check if we need AnimatePresence (for enter/exit)
  const hasEnterExit = transitions.some(() => {
    // Simplified check - if there's an initial state and other states, we might need AnimatePresence
    return true;
  });

  if (hasEnterExit && opts.outputType === "full-component") {
    imports.push("AnimatePresence");
  }

  return `import { ${imports.join(", ")} } from "framer-motion";`;
}

/**
 * Generate variants object for all elements
 */
function generateElementVariants(
  states: AnimationState[],
  transitions: StateTransition[],
  opts: FramerMotionOutputOptions
): string {
  const blocks: string[] = [];

  // Collect all unique elements across states
  const elementMap = new Map<string, Map<string, { props: Record<string, number | string>; stateName: string }>>();

  for (const state of states) {
    for (const element of state.elements) {
      if (!elementMap.has(element.elementId)) {
        elementMap.set(element.elementId, new Map());
      }
      const elementStates = elementMap.get(element.elementId)!;
      const props = elementToFramerProps({
        ...element,
        translateX: element.translateX ?? 0,
        translateY: element.translateY ?? 0,
      });
      elementStates.set(state.id, { props, stateName: state.name });
    }
  }

  // Generate variants for each element
  for (const [elementId, statePropsMap] of elementMap) {
    // Find element name from first state
    let elementName = elementId;
    for (const state of states) {
      const element = state.elements.find((e) => e.elementId === elementId);
      if (element) {
        elementName = element.elementName;
        break;
      }
    }

    const variantName = `${toVariableName(elementName)}Variants`;
    const variantsObj = buildVariantsObject(statePropsMap, transitions, states, opts);

    if (opts.includeComments) {
      blocks.push(`// Variants for ${elementName}`);
    }

    const typeAnnotation = opts.useTypeScript ? ": Variants" : "";
    blocks.push(`const ${variantName}${typeAnnotation} = ${variantsObj};`);
  }

  return blocks.join("\n\n");
}

/**
 * Build variants object for an element
 */
function buildVariantsObject(
  statePropsMap: Map<string, { props: Record<string, number | string>; stateName: string }>,
  transitions: StateTransition[],
  _states: AnimationState[],
  opts: FramerMotionOutputOptions
): string {
  const variants: Record<string, Record<string, unknown>> = {};

  for (const [stateId, { props, stateName }] of statePropsMap) {
    const variantKey = toVariantKey(stateName);
    const variant: Record<string, unknown> = { ...props };

    // Find transitions TO this state for timing
    const transitionsToState = transitions.filter((t) => t.toStateId === stateId);

    if (transitionsToState.length > 0) {
      const transition = transitionsToState[0];
      const transitionConfig: Record<string, unknown> = {
        duration: msToSecondsNum(transition.duration),
      };

      // Add delay if present
      if (transition.delay > 0) {
        transitionConfig.delay = msToSecondsNum(transition.delay);
      }

      // Handle easing
      const springConfig = toFramerMotionSpring(transition.easing);
      if (springConfig) {
        transitionConfig.type = "spring";
        transitionConfig.stiffness = springConfig.stiffness;
        transitionConfig.damping = springConfig.damping;
        transitionConfig.mass = springConfig.mass;
      } else {
        transitionConfig.ease = getFramerEaseArray(transition.easing);
      }

      // Handle stagger
      if (transition.stagger?.enabled) {
        transitionConfig.staggerChildren = msToSecondsNum(transition.stagger.delay);
        if (transition.stagger.from === "end") {
          transitionConfig.staggerDirection = -1;
        }
      }

      // Handle cascade configuration
      if (transition.cascade?.enabled) {
        // Cascade adds per-level delay and stagger
        transitionConfig.delayChildren = msToSecondsNum(transition.cascade.delayPerLevel);
        transitionConfig.staggerChildren = msToSecondsNum(transition.cascade.stagger.amount);

        // Direction mapping for cascade
        if (transition.cascade.stagger.direction === "reverse") {
          transitionConfig.staggerDirection = -1;
        }

        // Note: center-out and edges-in require custom orchestration
        // which is better handled in the orchestrationGenerator
      }

      variant.transition = transitionConfig;
    }

    variants[variantKey] = variant;
  }

  return formatVariantsObject(variants, opts.indentString);
}

/**
 * Format variants object as code string
 */
function formatVariantsObject(
  variants: Record<string, Record<string, unknown>>,
  indentStr: string
): string {
  const entries = Object.entries(variants);
  if (entries.length === 0) return "{}";

  const lines = entries.map(([key, value]) => {
    const formattedValue = formatVariantValue(value, 1, indentStr);
    return `${key}: ${formattedValue},`;
  });

  return `{\n${indent(lines.join("\n"), 1, indentStr)}\n}`;
}

/**
 * Format a single variant value
 */
function formatVariantValue(
  value: Record<string, unknown>,
  level: number,
  indentStr: string
): string {
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";

  const lines = entries.map(([key, val]) => {
    let formattedVal: string;

    if (key === "transition" && typeof val === "object" && val !== null) {
      formattedVal = formatTransitionConfig(val as Record<string, unknown>, indentStr);
    } else if (typeof val === "number") {
      formattedVal = formatNumber(val);
    } else if (typeof val === "string") {
      formattedVal = `"${val}"`;
    } else if (Array.isArray(val)) {
      formattedVal = `[${val.map((v) => formatNumber(v as number)).join(", ")}]`;
    } else {
      formattedVal = String(val);
    }

    return `${key}: ${formattedVal},`;
  });

  return `{\n${indent(lines.join("\n"), level + 1, indentStr)}\n${indentStr.repeat(level)}}`;
}

/**
 * Format transition config object
 */
function formatTransitionConfig(
  config: Record<string, unknown>,
  indentStr: string
): string {
  const entries = Object.entries(config);
  const parts = entries.map(([key, val]) => {
    if (typeof val === "number") {
      return `${key}: ${formatNumber(val)}`;
    } else if (typeof val === "string") {
      return `${key}: "${val}"`;
    } else if (Array.isArray(val)) {
      return `${key}: [${val.map((v) => formatNumber(v as number)).join(", ")}]`;
    }
    return `${key}: ${val}`;
  });

  if (parts.length <= 3) {
    return `{ ${parts.join(", ")} }`;
  }

  return `{\n${indent(parts.join(",\n"), 2, indentStr)}\n${indentStr}}`;
}

/**
 * Get Framer Motion ease array from easing curve
 */
function getFramerEaseArray(easing: { preset: string; cubicBezier?: [number, number, number, number] }): string | number[] {
  if (easing.cubicBezier) {
    return easing.cubicBezier;
  }

  // Map presets to Framer Motion ease strings or bezier arrays
  const easeMap: Record<string, string | number[]> = {
    linear: "linear",
    ease: "easeInOut",
    "ease-in": "easeIn",
    "ease-out": "easeOut",
    "ease-in-out": "easeInOut",
    spring: [0.5, 1.8, 0.5, 0.8],
    bounce: [0.6, 1.28, 0.68, 0.99],
  };

  return easeMap[easing.preset] || "easeOut";
}

/**
 * Generate React component using the variants
 */
function generateComponent(
  states: AnimationState[],
  _transitions: StateTransition[],
  opts: FramerMotionOutputOptions
): string {
  const blocks: string[] = [];

  if (opts.includeComments) {
    blocks.push(
      generateMultiLineComment(
        [
          `${opts.componentName} - Animated component`,
          "Use the animate prop to switch between states",
        ],
        "js"
      )
    );
  }

  // Collect unique elements
  const elementNames = new Set<string>();
  for (const state of states) {
    for (const element of state.elements) {
      elementNames.add(element.elementName);
    }
  }

  // Determine initial state name
  const initialState = states.find((s) => s.trigger.type === "initial") || states[0];
  const initialVariant = toVariantKey(initialState.name);

  // Generate state type if TypeScript
  let stateType = "";
  if (opts.useTypeScript && states.length > 0) {
    const stateNames = states.map((s) => `"${toVariantKey(s.name)}"`).join(" | ");
    stateType = `\ntype AnimationState = ${stateNames};\n`;
    blocks.push(stateType);
  }

  // Generate props interface
  if (opts.useTypeScript) {
    blocks.push(`interface ${opts.componentName}Props {
  state?: AnimationState;
  className?: string;
}`);
  }

  // Generate component
  const propsType = opts.useTypeScript
    ? `{ state = "${initialVariant}", className }: ${opts.componentName}Props`
    : `{ state = "${initialVariant}", className }`;

  const componentLines: string[] = [
    `export function ${opts.componentName}(${propsType}) {`,
    `  return (`,
    `    <div className={className}>`,
  ];

  // Add motion.div for each element
  for (const elementName of elementNames) {
    const variantName = `${toVariableName(elementName)}Variants`;
    const className = elementName.toLowerCase().replace(/\s+/g, "-");

    componentLines.push(
      `      <motion.div`,
      `        className="${className}"`,
      `        variants={${variantName}}`,
      `        initial="${initialVariant}"`,
      `        animate={state}`,
      `      />`
    );
  }

  componentLines.push(`    </div>`, `  );`, `}`);

  blocks.push(componentLines.join("\n"));

  return blocks.join("\n\n");
}
