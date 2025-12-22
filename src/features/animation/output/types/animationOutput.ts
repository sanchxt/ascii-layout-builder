/**
 * Animation Output Types
 * Phase 4: Types for output generation (CSS, Framer Motion, GSAP)
 */

/**
 * Supported output format types
 */
export type AnimationOutputFormat = "css" | "framer-motion" | "gsap" | "tailwind" | "orchestration";

/**
 * Strategy for naming elements in output code
 */
export type ElementNamingStrategy = "id" | "class" | "data-attr";

/**
 * Base options for all output generators
 */
export interface AnimationOutputOptions {
  /** How to name/select elements in generated code */
  namingStrategy: ElementNamingStrategy;
  /** Include comments in output */
  includeComments: boolean;
  /** Indent string (spaces or tabs) */
  indentString: string;
  /** Pretty print with newlines and indentation */
  prettyPrint: boolean;
}

/**
 * CSS-specific output options
 */
export interface CSSOutputOptions extends AnimationOutputOptions {
  /** Use CSS custom properties for values */
  useCustomProperties: boolean;
  /** Prefix for CSS custom properties */
  customPropertyPrefix: string;
  /** Use @keyframes vs CSS transitions */
  preferKeyframes: boolean;
  /** Include vendor prefixes */
  includeVendorPrefixes: boolean;
}

/**
 * Framer Motion-specific output options
 */
export interface FramerMotionOutputOptions extends AnimationOutputOptions {
  /** Generate full component or just variants */
  outputType: "variants-only" | "full-component";
  /** Use TypeScript types */
  useTypeScript: boolean;
  /** Component name (for full component output) */
  componentName: string;
}

/**
 * GSAP-specific output options
 */
export interface GSAPOutputOptions extends AnimationOutputOptions {
  /** Use GSAP timeline or individual tweens */
  useTimeline: boolean;
  /** Timeline variable name */
  timelineVarName: string;
  /** Include GSAP import statements */
  includeImports: boolean;
}

/**
 * Tailwind-specific output options
 */
export interface TailwindOutputOptions extends AnimationOutputOptions {
  /** Use Tailwind v3 or v4 syntax */
  tailwindVersion: 3 | 4;
  /** Use TypeScript for React component */
  useTypeScript: boolean;
  /** Include custom CSS for stagger delays */
  includeCustomCSS: boolean;
  /** Component name for React output */
  componentName: string;
}

/**
 * Orchestration-specific output options
 */
export interface OrchestrationOutputOptions extends AnimationOutputOptions {
  /** Use TypeScript types */
  useTypeScript: boolean;
  /** Include implementation hints */
  includeImplementationHints: boolean;
  /** Export format */
  exportFormat: "object" | "class";
}

/**
 * Property difference between two states for a single property
 */
export interface PropertyDiff {
  property: string;
  fromValue: number | string | boolean;
  toValue: number | string | boolean;
  /** Whether this property changed */
  hasChanged: boolean;
}

/**
 * Difference in element properties between two states
 */
export interface ElementDiff {
  /** Element identifier */
  elementId: string;
  /** Element display name */
  elementName: string;
  /** Property changes */
  changes: PropertyDiff[];
  /** Whether element has any animatable changes */
  hasAnimatableChanges: boolean;
  /** From state element data */
  fromElement: ElementSnapshot | null;
  /** To state element data */
  toElement: ElementSnapshot | null;
  /** Whether element exists in from state */
  existsInFrom: boolean;
  /** Whether element exists in to state */
  existsInTo: boolean;
}

/**
 * Snapshot of element properties (subset of AnimationStateElement)
 */
export interface ElementSnapshot {
  elementId: string;
  elementName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  scale: number;
  rotation: number;
  visible: boolean;
  translateX?: number;
  translateY?: number;
  // Phase 3: Layout properties for gap animation
  layoutType?: "flex" | "grid" | "none";
  gap?: number;
  columnGap?: number;
  rowGap?: number;
}

/**
 * Complete diff between two animation states
 */
export interface StateDiff {
  fromStateId: string;
  fromStateName: string;
  toStateId: string;
  toStateName: string;
  elementDiffs: ElementDiff[];
  /** Total number of elements with changes */
  changedElementCount: number;
}

/**
 * Generated code for a single format
 */
export interface FormatOutput {
  format: AnimationOutputFormat;
  code: string;
  /** File extension for download */
  fileExtension: string;
  /** Language for syntax highlighting */
  language: string;
}

/**
 * Combined animation output for all formats
 */
export interface AnimationOutput {
  /** Generated CSS output */
  css: FormatOutput;
  /** Generated Framer Motion output */
  framerMotion: FormatOutput;
  /** Generated GSAP output */
  gsap: FormatOutput;
  /** Generated Tailwind output */
  tailwind: FormatOutput;
  /** Generated Orchestration output */
  orchestration: FormatOutput;
  /** Metadata about the animation */
  metadata: {
    statesCount: number;
    transitionsCount: number;
    elementsCount: number;
    artboardId?: string;
    artboardName?: string;
  };
}

/**
 * Default output options
 */
export const DEFAULT_OUTPUT_OPTIONS: AnimationOutputOptions = {
  namingStrategy: "class",
  includeComments: true,
  indentString: "  ",
  prettyPrint: true,
};

export const DEFAULT_CSS_OPTIONS: CSSOutputOptions = {
  ...DEFAULT_OUTPUT_OPTIONS,
  useCustomProperties: true,
  customPropertyPrefix: "anim",
  preferKeyframes: false,
  includeVendorPrefixes: false,
};

export const DEFAULT_FRAMER_MOTION_OPTIONS: FramerMotionOutputOptions = {
  ...DEFAULT_OUTPUT_OPTIONS,
  outputType: "full-component",
  useTypeScript: true,
  componentName: "AnimatedComponent",
};

export const DEFAULT_GSAP_OPTIONS: GSAPOutputOptions = {
  ...DEFAULT_OUTPUT_OPTIONS,
  useTimeline: true,
  timelineVarName: "tl",
  includeImports: true,
};

export const DEFAULT_TAILWIND_OPTIONS: TailwindOutputOptions = {
  ...DEFAULT_OUTPUT_OPTIONS,
  tailwindVersion: 3,
  useTypeScript: true,
  includeCustomCSS: true,
  componentName: "AnimatedComponent",
};

export const DEFAULT_ORCHESTRATION_OPTIONS: OrchestrationOutputOptions = {
  ...DEFAULT_OUTPUT_OPTIONS,
  useTypeScript: true,
  includeImplementationHints: true,
  exportFormat: "object",
};
