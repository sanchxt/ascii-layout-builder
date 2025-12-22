/**
 * Orchestration Generator
 * Generates framework-agnostic state machine configuration for animations
 */

import type { AnimationState } from "../../types/animation";
import type { StateTransition } from "../../types/transition";
import { calculateCascadeTimings } from "../../utils/cascadeTiming";
import type { OrchestrationOutputOptions } from "../types/animationOutput";
import { DEFAULT_ORCHESTRATION_OPTIONS } from "../types/animationOutput";
import { toVariantKey } from "../utils/elementNaming";
import {
  formatNumber,
  joinCodeBlocks,
  generateMultiLineComment,
} from "../utils/formatHelpers";

/**
 * Generate orchestration code from states and transitions
 */
export function generateOrchestration(
  states: AnimationState[],
  transitions: StateTransition[],
  options: Partial<OrchestrationOutputOptions> = {}
): string {
  const opts = { ...DEFAULT_ORCHESTRATION_OPTIONS, ...options };
  const blocks: string[] = [];

  if (states.length === 0) {
    return opts.includeComments
      ? "// No animation states defined"
      : "";
  }

  // Generate header comment
  if (opts.includeComments) {
    blocks.push(
      generateMultiLineComment(
        [
          "Animation Orchestration Configuration",
          "Framework-agnostic state machine for coordinating animations",
          "",
          "Usage:",
          "  1. Import this configuration",
          "  2. Use transitionTo(stateName) to trigger transitions",
          "  3. Element timings are pre-calculated for cascade/stagger",
        ],
        "js"
      )
    );
  }

  // Generate types (if TypeScript)
  if (opts.useTypeScript) {
    const types = generateTypes(states, transitions, opts);
    blocks.push(types);
  }

  // Generate main configuration
  if (opts.exportFormat === "object") {
    const config = generateObjectConfig(states, transitions, opts);
    blocks.push(config);
  } else {
    const classConfig = generateClassConfig(states, transitions, opts);
    blocks.push(classConfig);
  }

  // Generate implementation hints
  if (opts.includeImplementationHints) {
    const hints = generateImplementationHints(opts);
    blocks.push(hints);
  }

  return joinCodeBlocks(blocks, 1);
}

/**
 * Generate TypeScript types
 */
function generateTypes(
  states: AnimationState[],
  _transitions: StateTransition[],
  _opts: OrchestrationOutputOptions
): string {
  const lines: string[] = [];

  // State names type
  const stateNames = states.map((s) => `"${toVariantKey(s.name)}"`).join(" | ");
  lines.push(`type AnimationStateName = ${stateNames};`);
  lines.push("");

  // Element timing type
  lines.push(`interface ElementTiming {`);
  lines.push(`  delay: number;`);
  lines.push(`  duration: number;`);
  lines.push(`  easing: string;`);
  lines.push(`}`);
  lines.push("");

  // Transition config type
  lines.push(`interface TransitionConfig {`);
  lines.push(`  from: AnimationStateName;`);
  lines.push(`  to: AnimationStateName;`);
  lines.push(`  duration: number;`);
  lines.push(`  delay: number;`);
  lines.push(`  easing: string;`);
  lines.push(`  cascade?: {`);
  lines.push(`    enabled: boolean;`);
  lines.push(`    delayPerLevel: number;`);
  lines.push(`    staggerAmount: number;`);
  lines.push(`    direction: "normal" | "reverse" | "center-out" | "edges-in";`);
  lines.push(`  };`);
  lines.push(`  elementTimings: Map<string, ElementTiming>;`);
  lines.push(`}`);
  lines.push("");

  // State config type
  lines.push(`interface StateConfig {`);
  lines.push(`  name: AnimationStateName;`);
  lines.push(`  elements: Map<string, {`);
  lines.push(`    x: number;`);
  lines.push(`    y: number;`);
  lines.push(`    opacity: number;`);
  lines.push(`    scale: number;`);
  lines.push(`    rotation: number;`);
  lines.push(`    visible: boolean;`);
  lines.push(`  }>;`);
  lines.push(`}`);
  lines.push("");

  // Main config type
  lines.push(`interface AnimationOrchestration {`);
  lines.push(`  states: AnimationStateName[];`);
  lines.push(`  initialState: AnimationStateName;`);
  lines.push(`  stateConfigs: Map<AnimationStateName, StateConfig>;`);
  lines.push(`  transitions: TransitionConfig[];`);
  lines.push(`  getTransition: (from: AnimationStateName, to: AnimationStateName) => TransitionConfig | undefined;`);
  lines.push(`  getElementTiming: (transitionKey: string, elementId: string) => ElementTiming | undefined;`);
  lines.push(`}`);

  return lines.join("\n");
}

/**
 * Generate object-style configuration
 */
function generateObjectConfig(
  states: AnimationState[],
  transitions: StateTransition[],
  opts: OrchestrationOutputOptions
): string {
  const lines: string[] = [];

  // Find initial state
  const initialState = states.find((s) => s.trigger.type === "initial") || states[0];

  lines.push(`export const animationOrchestration${opts.useTypeScript ? ": AnimationOrchestration" : ""} = {`);

  // States array
  const stateNames = states.map((s) => `"${toVariantKey(s.name)}"`);
  lines.push(`  states: [${stateNames.join(", ")}],`);
  lines.push("");

  // Initial state
  lines.push(`  initialState: "${toVariantKey(initialState.name)}",`);
  lines.push("");

  // State configurations
  lines.push(`  stateConfigs: new Map([`);
  for (const state of states) {
    const variantKey = toVariantKey(state.name);
    lines.push(`    ["${variantKey}", {`);
    lines.push(`      name: "${variantKey}",`);
    lines.push(`      elements: new Map([`);

    for (const element of state.elements) {
      lines.push(`        ["${element.elementId}", {`);
      lines.push(`          x: ${formatNumber(element.x)},`);
      lines.push(`          y: ${formatNumber(element.y)},`);
      lines.push(`          opacity: ${formatNumber(element.opacity)},`);
      lines.push(`          scale: ${formatNumber(element.scale)},`);
      lines.push(`          rotation: ${formatNumber(element.rotation)},`);
      lines.push(`          visible: ${element.visible},`);
      lines.push(`        }],`);
    }

    lines.push(`      ]),`);
    lines.push(`    }],`);
  }
  lines.push(`  ]),`);
  lines.push("");

  // Transitions
  lines.push(`  transitions: [`);
  for (const transition of transitions) {
    const fromState = states.find((s) => s.id === transition.fromStateId);
    const toState = states.find((s) => s.id === transition.toStateId);

    if (!fromState || !toState) continue;

    const fromKey = toVariantKey(fromState.name);
    const toKey = toVariantKey(toState.name);

    // Calculate element timings
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

    lines.push(`    {`);
    lines.push(`      from: "${fromKey}",`);
    lines.push(`      to: "${toKey}",`);
    lines.push(`      duration: ${formatNumber(transition.duration)},`);
    lines.push(`      delay: ${formatNumber(transition.delay)},`);
    lines.push(`      easing: "${transition.easing.preset}",`);

    // Cascade config
    if (transition.cascade?.enabled) {
      lines.push(`      cascade: {`);
      lines.push(`        enabled: true,`);
      lines.push(`        delayPerLevel: ${formatNumber(transition.cascade.delayPerLevel)},`);
      lines.push(`        staggerAmount: ${formatNumber(transition.cascade.stagger.amount)},`);
      lines.push(`        direction: "${transition.cascade.stagger.direction}",`);
      lines.push(`      },`);
    }

    // Element timings
    lines.push(`      elementTimings: new Map([`);
    for (const element of fromState.elements) {
      const timing = cascadeTimings?.get(element.elementId);
      const delay = timing?.delay ?? transition.delay;
      const duration = timing?.duration ?? transition.duration;

      lines.push(`        ["${element.elementId}", {`);
      lines.push(`          delay: ${formatNumber(delay)},`);
      lines.push(`          duration: ${formatNumber(duration)},`);
      lines.push(`          easing: "${transition.easing.preset}",`);
      lines.push(`        }],`);
    }
    lines.push(`      ]),`);
    lines.push(`    },`);
  }
  lines.push(`  ],`);
  lines.push("");

  // Helper methods
  lines.push(`  getTransition(from${opts.useTypeScript ? ": AnimationStateName" : ""}, to${opts.useTypeScript ? ": AnimationStateName" : ""}) {`);
  lines.push(`    return this.transitions.find((t) => t.from === from && t.to === to);`);
  lines.push(`  },`);
  lines.push("");

  lines.push(`  getElementTiming(transitionKey${opts.useTypeScript ? ": string" : ""}, elementId${opts.useTypeScript ? ": string" : ""}) {`);
  lines.push(`    const [from, to] = transitionKey.split("->");`);
  lines.push(`    const transition = this.getTransition(from${opts.useTypeScript ? " as AnimationStateName" : ""}, to${opts.useTypeScript ? " as AnimationStateName" : ""});`);
  lines.push(`    return transition?.elementTimings.get(elementId);`);
  lines.push(`  },`);

  lines.push(`};`);

  return lines.join("\n");
}

/**
 * Generate class-style configuration
 */
function generateClassConfig(
  states: AnimationState[],
  _transitions: StateTransition[],
  opts: OrchestrationOutputOptions
): string {
  const lines: string[] = [];

  // Find initial state
  const initialState = states.find((s) => s.trigger.type === "initial") || states[0];

  lines.push(`export class AnimationOrchestrator {`);

  // Properties
  lines.push(`  private currentState${opts.useTypeScript ? ": AnimationStateName" : ""};`);
  lines.push(`  private listeners${opts.useTypeScript ? ": Set<(state: AnimationStateName) => void>" : ""} = new Set();`);
  lines.push("");

  // Constructor
  lines.push(`  constructor() {`);
  lines.push(`    this.currentState = "${toVariantKey(initialState.name)}";`);
  lines.push(`  }`);
  lines.push("");

  // Get states
  const stateNames = states.map((s) => `"${toVariantKey(s.name)}"`);
  lines.push(`  get states()${opts.useTypeScript ? ": AnimationStateName[]" : ""} {`);
  lines.push(`    return [${stateNames.join(", ")}];`);
  lines.push(`  }`);
  lines.push("");

  // Get current state
  lines.push(`  get state()${opts.useTypeScript ? ": AnimationStateName" : ""} {`);
  lines.push(`    return this.currentState;`);
  lines.push(`  }`);
  lines.push("");

  // Transition to state
  lines.push(`  transitionTo(state${opts.useTypeScript ? ": AnimationStateName" : ""})${opts.useTypeScript ? ": TransitionConfig | undefined" : ""} {`);
  lines.push(`    const transition = this.getTransition(this.currentState, state);`);
  lines.push(`    if (transition) {`);
  lines.push(`      this.currentState = state;`);
  lines.push(`      this.notifyListeners();`);
  lines.push(`    }`);
  lines.push(`    return transition;`);
  lines.push(`  }`);
  lines.push("");

  // Get transition
  lines.push(`  getTransition(from${opts.useTypeScript ? ": AnimationStateName" : ""}, to${opts.useTypeScript ? ": AnimationStateName" : ""})${opts.useTypeScript ? ": TransitionConfig | undefined" : ""} {`);
  lines.push(`    return animationOrchestration.getTransition(from, to);`);
  lines.push(`  }`);
  lines.push("");

  // Subscribe to state changes
  lines.push(`  subscribe(listener${opts.useTypeScript ? ": (state: AnimationStateName) => void" : ""}) {`);
  lines.push(`    this.listeners.add(listener);`);
  lines.push(`    return () => this.listeners.delete(listener);`);
  lines.push(`  }`);
  lines.push("");

  // Notify listeners
  lines.push(`  private notifyListeners() {`);
  lines.push(`    this.listeners.forEach((listener) => listener(this.currentState));`);
  lines.push(`  }`);
  lines.push(`}`);

  return lines.join("\n");
}

/**
 * Generate implementation hints
 */
function generateImplementationHints(_opts: OrchestrationOutputOptions): string {
  const lines: string[] = [];

  lines.push(
    generateMultiLineComment(
      [
        "Implementation Examples:",
        "",
        "React with Framer Motion:",
        "  const { state, transitionTo } = useAnimationOrchestration();",
        "  const transition = animationOrchestration.getTransition(prevState, state);",
        "  const timing = transition?.elementTimings.get(elementId);",
        "",
        "  <motion.div",
        "    animate={state}",
        "    transition={{ delay: timing?.delay / 1000, duration: timing?.duration / 1000 }}",
        "  />",
        "",
        "Vanilla JS:",
        "  const transition = animationOrchestration.getTransition('initial', 'hover');",
        "  transition?.elementTimings.forEach((timing, elementId) => {",
        "    const el = document.getElementById(elementId);",
        "    el.style.transitionDelay = `${timing.delay}ms`;",
        "    el.style.transitionDuration = `${timing.duration}ms`;",
        "  });",
        "",
        "GSAP:",
        "  const transition = animationOrchestration.getTransition('initial', 'active');",
        "  const tl = gsap.timeline();",
        "  transition?.elementTimings.forEach((timing, elementId) => {",
        "    tl.to(`#${elementId}`, { ...props, duration: timing.duration / 1000 }, timing.delay / 1000);",
        "  });",
      ],
      "js"
    )
  );

  return lines.join("\n");
}
