/**
 * Tailwind Generator
 * Generates Tailwind CSS classes and React components with CSS transitions
 */

import type { AnimationState } from "../../types/animation";
import type { StateTransition } from "../../types/transition";
import { toCSS } from "../../utils/easingUtils";
import type { TailwindOutputOptions } from "../types/animationOutput";
import { DEFAULT_TAILWIND_OPTIONS } from "../types/animationOutput";
import { toVariableName, toVariantKey } from "../utils/elementNaming";
import {
  formatNumber,
  joinCodeBlocks,
  generateComment,
  msToSecondsNum,
} from "../utils/formatHelpers";

/**
 * Generate Tailwind code from states and transitions
 */
export function generateTailwind(
  states: AnimationState[],
  transitions: StateTransition[],
  options: Partial<TailwindOutputOptions> = {}
): string {
  const opts = { ...DEFAULT_TAILWIND_OPTIONS, ...options };
  const blocks: string[] = [];

  if (states.length === 0) {
    return opts.includeComments
      ? "// No animation states defined"
      : "";
  }

  // Generate imports
  blocks.push(generateImports(opts));

  // Generate custom CSS for stagger/cascade (if needed)
  if (opts.includeCustomCSS && transitions.some((t) => t.cascade?.enabled || t.stagger?.enabled)) {
    const customCSS = generateCustomCSS(states, transitions, opts);
    if (customCSS) {
      blocks.push(customCSS);
    }
  }

  // Generate state type
  if (opts.useTypeScript) {
    const stateType = generateStateType(states, opts);
    blocks.push(stateType);
  }

  // Generate component
  const component = generateComponent(states, transitions, opts);
  blocks.push(component);

  return joinCodeBlocks(blocks, 1);
}

/**
 * Generate import statements
 */
function generateImports(opts: TailwindOutputOptions): string {
  const lines: string[] = [];

  if (opts.useTypeScript) {
    lines.push(`import { useState } from "react";`);
  } else {
    lines.push(`import { useState } from "react";`);
  }

  return lines.join("\n");
}

/**
 * Generate custom CSS for stagger delays
 */
function generateCustomCSS(
  _states: AnimationState[],
  transitions: StateTransition[],
  opts: TailwindOutputOptions
): string {
  const lines: string[] = [];

  if (opts.includeComments) {
    lines.push(generateComment("Custom CSS for stagger/cascade delays", "css"));
    lines.push(generateComment("Add this to your global CSS or a <style> tag", "css"));
  }

  lines.push("const customCSS = `");
  lines.push(":root {");

  // Get first transition for default values
  const primaryTransition = transitions[0];
  if (primaryTransition) {
    lines.push(`  --transition-duration: ${msToSecondsNum(primaryTransition.duration)}s;`);
    lines.push(`  --transition-delay: ${msToSecondsNum(primaryTransition.delay)}s;`);
    lines.push(`  --transition-easing: ${toCSS(primaryTransition.easing)};`);

    if (primaryTransition.stagger?.enabled) {
      lines.push(`  --stagger-delay: ${msToSecondsNum(primaryTransition.stagger.delay)}s;`);
    }

    if (primaryTransition.cascade?.enabled) {
      lines.push(`  --cascade-delay-per-level: ${msToSecondsNum(primaryTransition.cascade.delayPerLevel)}s;`);
      lines.push(`  --cascade-stagger: ${msToSecondsNum(primaryTransition.cascade.stagger.amount)}s;`);
    }
  }

  lines.push("}");

  // Generate nth-child rules for stagger
  if (primaryTransition?.stagger?.enabled || primaryTransition?.cascade?.enabled) {
    lines.push("");
    lines.push("/* Stagger delay classes */");
    for (let i = 0; i < 10; i++) {
      lines.push(`.stagger-child:nth-child(${i + 1}) {`);
      lines.push(`  transition-delay: calc(var(--stagger-delay, 0.05s) * ${i});`);
      lines.push(`}`);
    }
  }

  lines.push("`;");

  return lines.join("\n");
}

/**
 * Generate TypeScript state type
 */
function generateStateType(
  states: AnimationState[],
  _opts: TailwindOutputOptions
): string {
  const stateNames = states.map((s) => `"${toVariantKey(s.name)}"`).join(" | ");
  return `type AnimationState = ${stateNames};`;
}

/**
 * Generate main component
 */
function generateComponent(
  states: AnimationState[],
  transitions: StateTransition[],
  opts: TailwindOutputOptions
): string {
  const lines: string[] = [];
  const componentName = opts.componentName;

  // Find initial state
  const initialState = states.find((s) => s.trigger.type === "initial") || states[0];
  const initialVariant = toVariantKey(initialState.name);

  // Collect unique elements
  const elementNames = new Set<string>();
  for (const state of states) {
    for (const element of state.elements) {
      elementNames.add(element.elementName);
    }
  }

  // Generate props interface
  if (opts.useTypeScript) {
    lines.push(`interface ${componentName}Props {`);
    lines.push(`  className?: string;`);
    lines.push(`}`);
    lines.push("");
  }

  // Component definition
  const propsType = opts.useTypeScript
    ? `{ className }: ${componentName}Props`
    : `{ className }`;

  lines.push(`export function ${componentName}(${propsType}) {`);
  lines.push(`  const [state, setState] = useState${opts.useTypeScript ? "<AnimationState>" : ""}("${initialVariant}");`);
  lines.push("");

  // Generate class name helper functions for each element
  if (opts.includeComments) {
    lines.push("  // Get Tailwind classes based on current state");
  }

  for (const elementName of elementNames) {
    const funcName = `get${capitalize(toVariableName(elementName))}Classes`;
    lines.push(`  const ${funcName} = () => {`);
    lines.push(`    const baseClasses = "transition-all duration-300 ease-out";`);
    lines.push(`    switch (state) {`);

    for (const s of states) {
      const element = s.elements.find((e) => e.elementName === elementName);
      if (!element) continue;

      const variantKey = toVariantKey(s.name);
      const classes = buildTailwindClasses(element);

      lines.push(`      case "${variantKey}":`);
      lines.push(`        return \`\${baseClasses} ${classes}\`;`);
    }

    lines.push(`      default:`);
    lines.push(`        return baseClasses;`);
    lines.push(`    }`);
    lines.push(`  };`);
    lines.push("");
  }

  // Generate style helper for transforms
  if (opts.includeComments) {
    lines.push("  // Get inline styles for transforms");
  }

  for (const elementName of elementNames) {
    const funcName = `get${capitalize(toVariableName(elementName))}Styles`;
    lines.push(`  const ${funcName} = ()${opts.useTypeScript ? ": React.CSSProperties" : ""} => {`);
    lines.push(`    switch (state) {`);

    for (const s of states) {
      const element = s.elements.find((e) => e.elementName === elementName);
      if (!element) continue;

      const variantKey = toVariantKey(s.name);
      const styles = buildInlineStyles(element, transitions, s.id);

      lines.push(`      case "${variantKey}":`);
      lines.push(`        return ${styles};`);
    }

    lines.push(`      default:`);
    lines.push(`        return {};`);
    lines.push(`    }`);
    lines.push(`  };`);
    lines.push("");
  }

  // State control buttons
  lines.push("  return (");
  lines.push(`    <div className={\`\${className || ""}\`}>`);

  // State toggle buttons
  lines.push("      {/* State controls */}");
  lines.push(`      <div className="flex gap-2 mb-4">`);
  for (const s of states) {
    const variantKey = toVariantKey(s.name);
    lines.push(`        <button`);
    lines.push(`          onClick={() => setState("${variantKey}")}`);
    lines.push(`          className={\`px-3 py-1.5 text-sm rounded-md transition-colors \${`);
    lines.push(`            state === "${variantKey}"`);
    lines.push(`              ? "bg-blue-500 text-white"`);
    lines.push(`              : "bg-gray-200 text-gray-700 hover:bg-gray-300"`);
    lines.push(`          }\`}`);
    lines.push(`        >`);
    lines.push(`          ${s.name}`);
    lines.push(`        </button>`);
  }
  lines.push("      </div>");
  lines.push("");

  // Render elements
  lines.push("      {/* Animated elements */}");
  lines.push(`      <div className="relative">`);

  for (const elementName of elementNames) {
    const varName = toVariableName(elementName);
    const classesFunc = `get${capitalize(varName)}Classes`;
    const stylesFunc = `get${capitalize(varName)}Styles`;
    const className = elementName.toLowerCase().replace(/\s+/g, "-");

    lines.push(`        <div`);
    lines.push(`          className={\`${className} \${${classesFunc}()}\`}`);
    lines.push(`          style={${stylesFunc}()}`);
    lines.push(`        >`);
    lines.push(`          {/* ${elementName} content */}`);
    lines.push(`        </div>`);
  }

  lines.push("      </div>");
  lines.push("    </div>");
  lines.push("  );");
  lines.push("}");

  return lines.join("\n");
}

/**
 * Build Tailwind classes for element state
 */
function buildTailwindClasses(element: {
  opacity: number;
  visible: boolean;
}): string {
  const classes: string[] = [];

  // Opacity
  if (element.opacity !== 1) {
    const opacityPercent = Math.round(element.opacity * 100);
    // Map to Tailwind opacity classes
    const opacityClass = mapToTailwindOpacity(opacityPercent);
    if (opacityClass) {
      classes.push(opacityClass);
    }
  }

  // Visibility
  if (!element.visible) {
    classes.push("invisible");
  }

  return classes.join(" ");
}

/**
 * Map opacity percentage to Tailwind class
 */
function mapToTailwindOpacity(percent: number): string | null {
  const opacityMap: Record<number, string> = {
    0: "opacity-0",
    5: "opacity-5",
    10: "opacity-10",
    20: "opacity-20",
    25: "opacity-25",
    30: "opacity-30",
    40: "opacity-40",
    50: "opacity-50",
    60: "opacity-60",
    70: "opacity-70",
    75: "opacity-75",
    80: "opacity-80",
    90: "opacity-90",
    95: "opacity-95",
    100: "opacity-100",
  };

  // Find closest match
  const keys = Object.keys(opacityMap).map(Number);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - percent) < Math.abs(prev - percent) ? curr : prev
  );

  return opacityMap[closest];
}

/**
 * Build inline styles for transforms
 */
function buildInlineStyles(
  element: {
    opacity: number;
    scale: number;
    rotation: number;
    translateX?: number;
    translateY?: number;
  },
  transitions: StateTransition[],
  stateId: string
): string {
  const styles: Record<string, string> = {};

  // Build transform string
  const transforms: string[] = [];

  if (element.translateX || element.translateY) {
    const x = element.translateX ?? 0;
    const y = element.translateY ?? 0;
    if (x !== 0 || y !== 0) {
      transforms.push(`translate(${x}px, ${y}px)`);
    }
  }

  if (element.scale !== 1) {
    transforms.push(`scale(${formatNumber(element.scale)})`);
  }

  if (element.rotation !== 0) {
    transforms.push(`rotate(${formatNumber(element.rotation)}deg)`);
  }

  if (transforms.length > 0) {
    styles.transform = transforms.join(" ");
  }

  // Add transition timing from transitions TO this state
  const transitionsToState = transitions.filter((t) => t.toStateId === stateId);
  if (transitionsToState.length > 0) {
    const transition = transitionsToState[0];
    styles.transitionDuration = `${msToSecondsNum(transition.duration)}s`;
    styles.transitionTimingFunction = toCSS(transition.easing);

    if (transition.delay > 0) {
      styles.transitionDelay = `${msToSecondsNum(transition.delay)}s`;
    }
  }

  // Format as object literal
  if (Object.keys(styles).length === 0) {
    return "{}";
  }

  const entries = Object.entries(styles)
    .map(([key, value]) => `${key}: "${value}"`)
    .join(", ");

  return `{ ${entries} }`;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
