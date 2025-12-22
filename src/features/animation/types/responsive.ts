/**
 * Responsive Animation Types
 *
 * Defines types for responsive animations that adapt based on
 * window breakpoints. Users can define different animation states
 * and transitions for different screen sizes.
 */

/**
 * Standard breakpoint names
 */
export type BreakpointName = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/**
 * Breakpoint definition
 */
export interface Breakpoint {
  /** Unique name for this breakpoint */
  name: BreakpointName | string;
  /** Minimum width in pixels (inclusive) */
  minWidth: number;
  /** Maximum width in pixels (exclusive, undefined = no max) */
  maxWidth?: number;
  /** Display label for the UI */
  label: string;
}

/**
 * Standard breakpoints matching common CSS frameworks
 */
export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { name: "xs", minWidth: 0, maxWidth: 640, label: "Extra Small (< 640px)" },
  { name: "sm", minWidth: 640, maxWidth: 768, label: "Small (640px - 767px)" },
  { name: "md", minWidth: 768, maxWidth: 1024, label: "Medium (768px - 1023px)" },
  { name: "lg", minWidth: 1024, maxWidth: 1280, label: "Large (1024px - 1279px)" },
  { name: "xl", minWidth: 1280, maxWidth: 1536, label: "Extra Large (1280px - 1535px)" },
  { name: "2xl", minWidth: 1536, label: "2X Large (1536px+)" },
];

/**
 * Common mobile-first breakpoints
 */
export const MOBILE_FIRST_BREAKPOINTS: Breakpoint[] = [
  { name: "mobile", minWidth: 0, maxWidth: 768, label: "Mobile" },
  { name: "tablet", minWidth: 768, maxWidth: 1024, label: "Tablet" },
  { name: "desktop", minWidth: 1024, label: "Desktop" },
];

/**
 * Responsive state override
 * Allows overriding specific element properties at a breakpoint
 */
export interface ResponsiveStateOverride {
  /** Target breakpoint */
  breakpoint: BreakpointName | string;
  /** Element ID to override */
  elementId: string;
  /** Properties to override (partial element props) */
  overrides: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    opacity?: number;
    scale?: number;
    rotation?: number;
    visible?: boolean;
    translateX?: number;
    translateY?: number;
  };
}

/**
 * Responsive transition override
 * Allows different transition settings at different breakpoints
 */
export interface ResponsiveTransitionOverride {
  /** Target breakpoint */
  breakpoint: BreakpointName | string;
  /** Transition ID to override */
  transitionId: string;
  /** Duration override (ms) */
  duration?: number;
  /** Delay override (ms) */
  delay?: number;
  /** Whether cascade is enabled at this breakpoint */
  cascadeEnabled?: boolean;
}

/**
 * Responsive animation configuration for an artboard
 */
export interface ResponsiveAnimationConfig {
  /** Unique identifier */
  id: string;
  /** Artboard this config belongs to */
  artboardId: string;
  /** Whether responsive animations are enabled */
  enabled: boolean;
  /** Breakpoint set to use */
  breakpointSet: "default" | "mobile-first" | "custom";
  /** Custom breakpoints (if breakpointSet is 'custom') */
  customBreakpoints?: Breakpoint[];
  /** State overrides per breakpoint */
  stateOverrides: ResponsiveStateOverride[];
  /** Transition overrides per breakpoint */
  transitionOverrides: ResponsiveTransitionOverride[];
  /** When this config was created */
  createdAt: number;
  /** When this config was last updated */
  updatedAt: number;
}

/**
 * Default responsive animation config
 */
export const DEFAULT_RESPONSIVE_CONFIG: Omit<
  ResponsiveAnimationConfig,
  "id" | "artboardId" | "createdAt" | "updatedAt"
> = {
  enabled: false,
  breakpointSet: "default",
  stateOverrides: [],
  transitionOverrides: [],
};

/**
 * Create a new responsive animation config
 */
export function createResponsiveConfig(
  artboardId: string,
  overrides?: Partial<Omit<ResponsiveAnimationConfig, "id" | "artboardId" | "createdAt" | "updatedAt">>
): ResponsiveAnimationConfig {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    artboardId,
    ...DEFAULT_RESPONSIVE_CONFIG,
    ...overrides,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get breakpoints for a config
 */
export function getBreakpointsForConfig(
  config: ResponsiveAnimationConfig
): Breakpoint[] {
  switch (config.breakpointSet) {
    case "mobile-first":
      return MOBILE_FIRST_BREAKPOINTS;
    case "custom":
      return config.customBreakpoints || DEFAULT_BREAKPOINTS;
    default:
      return DEFAULT_BREAKPOINTS;
  }
}

/**
 * Get the active breakpoint for a given width
 */
export function getActiveBreakpoint(
  width: number,
  breakpoints: Breakpoint[]
): Breakpoint | undefined {
  // Sort by minWidth descending to find the largest matching breakpoint
  const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);

  for (const bp of sorted) {
    if (width >= bp.minWidth) {
      if (bp.maxWidth === undefined || width < bp.maxWidth) {
        return bp;
      }
    }
  }

  return breakpoints[0]; // Fallback to smallest
}

/**
 * Get overrides for a specific breakpoint
 */
export function getOverridesForBreakpoint(
  config: ResponsiveAnimationConfig,
  breakpointName: string
): {
  stateOverrides: ResponsiveStateOverride[];
  transitionOverrides: ResponsiveTransitionOverride[];
} {
  return {
    stateOverrides: config.stateOverrides.filter(
      (o) => o.breakpoint === breakpointName
    ),
    transitionOverrides: config.transitionOverrides.filter(
      (o) => o.breakpoint === breakpointName
    ),
  };
}

/**
 * Check if a breakpoint has any overrides
 */
export function hasOverridesForBreakpoint(
  config: ResponsiveAnimationConfig,
  breakpointName: string
): boolean {
  return (
    config.stateOverrides.some((o) => o.breakpoint === breakpointName) ||
    config.transitionOverrides.some((o) => o.breakpoint === breakpointName)
  );
}

/**
 * Media query string for a breakpoint
 */
export function breakpointToMediaQuery(breakpoint: Breakpoint): string {
  const conditions: string[] = [];

  if (breakpoint.minWidth > 0) {
    conditions.push(`(min-width: ${breakpoint.minWidth}px)`);
  }

  if (breakpoint.maxWidth !== undefined) {
    conditions.push(`(max-width: ${breakpoint.maxWidth - 1}px)`);
  }

  return conditions.length > 0 ? conditions.join(" and ") : "all";
}

/**
 * Generate CSS media query blocks for responsive animations
 */
export function generateResponsiveCSS(
  config: ResponsiveAnimationConfig,
  elementSelector: (elementId: string) => string
): string {
  if (!config.enabled) return "";

  const breakpoints = getBreakpointsForConfig(config);
  const blocks: string[] = [];

  for (const bp of breakpoints) {
    const overrides = getOverridesForBreakpoint(config, bp.name);

    if (overrides.stateOverrides.length === 0) continue;

    const mediaQuery = breakpointToMediaQuery(bp);
    const rules: string[] = [];

    for (const override of overrides.stateOverrides) {
      const selector = elementSelector(override.elementId);
      const props: string[] = [];

      if (override.overrides.opacity !== undefined) {
        props.push(`  opacity: ${override.overrides.opacity};`);
      }
      if (override.overrides.visible !== undefined) {
        props.push(
          `  visibility: ${override.overrides.visible ? "visible" : "hidden"};`
        );
      }

      // Transform properties
      const transforms: string[] = [];
      if (override.overrides.translateX !== undefined) {
        transforms.push(`translateX(${override.overrides.translateX}px)`);
      }
      if (override.overrides.translateY !== undefined) {
        transforms.push(`translateY(${override.overrides.translateY}px)`);
      }
      if (override.overrides.scale !== undefined) {
        transforms.push(`scale(${override.overrides.scale})`);
      }
      if (override.overrides.rotation !== undefined) {
        transforms.push(`rotate(${override.overrides.rotation}deg)`);
      }
      if (transforms.length > 0) {
        props.push(`  transform: ${transforms.join(" ")};`);
      }

      if (props.length > 0) {
        rules.push(`${selector} {\n${props.join("\n")}\n}`);
      }
    }

    if (rules.length > 0) {
      blocks.push(`@media ${mediaQuery} {\n${rules.join("\n\n")}\n}`);
    }
  }

  return blocks.join("\n\n");
}
