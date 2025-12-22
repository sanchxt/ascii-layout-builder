/**
 * Animation Output Module
 * Phase 4: Output generation for CSS, Framer Motion, and GSAP
 */

// Types
export type {
  AnimationOutputFormat,
  AnimationOutputOptions,
  CSSOutputOptions,
  FramerMotionOutputOptions,
  GSAPOutputOptions,
  AnimationOutput,
  FormatOutput,
  ElementNamingStrategy,
  ElementDiff,
  PropertyDiff,
  StateDiff,
  ElementSnapshot,
} from "./types/animationOutput";

export {
  DEFAULT_OUTPUT_OPTIONS,
  DEFAULT_CSS_OPTIONS,
  DEFAULT_FRAMER_MOTION_OPTIONS,
  DEFAULT_GSAP_OPTIONS,
} from "./types/animationOutput";

// Generators
export {
  generateCSSAnimation,
  generateFramerMotion,
  generateGSAP,
} from "./generators";

// Hook
export { useAnimationOutput } from "./hooks/useAnimationOutput";

// Components
export { AnimationOutputPanel } from "./components/AnimationOutputPanel";
// Re-export from shared location for backwards compatibility
export { SyntaxHighlighter, InlineSyntaxHighlighter } from "@/components/ui/syntax-highlighter";

// Utilities
export {
  calculateStateDiff,
  calculateElementDiff,
  hasAnimatableChanges,
  buildTransformString,
  getChangedProperties,
  getChangedElements,
  isEnteringElement,
  isExitingElement,
} from "./utils/diffCalculator";

export {
  getElementSelector,
  toClassName,
  toVariableName,
  toComponentName,
  toStateClassName,
  toKeyframesName,
  toVariantKey,
  toGSAPLabel,
} from "./utils/elementNaming";

export {
  indent,
  formatNumber,
  msToSeconds,
  generateComment,
  joinCodeBlocks,
  cssRule,
  cssProperty,
  toCamelCase,
  toPascalCase,
} from "./utils/formatHelpers";
