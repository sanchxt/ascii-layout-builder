/**
 * Element Naming Utilities for Animation Output
 * Functions for generating CSS selectors and variable names
 */

import type { ElementNamingStrategy, ElementSnapshot } from "../types/animationOutput";
import { sanitizeIdentifier, toCamelCase, toPascalCase } from "./formatHelpers";

/**
 * Generate a CSS selector for an element based on naming strategy
 * @param element - Element snapshot with id and name
 * @param strategy - How to select the element
 */
export function getElementSelector(
  element: Pick<ElementSnapshot, "elementId" | "elementName">,
  strategy: ElementNamingStrategy
): string {
  switch (strategy) {
    case "id":
      return `#${sanitizeIdentifier(element.elementId)}`;
    case "class":
      return `.${toClassName(element.elementName)}`;
    case "data-attr":
      return `[data-element="${sanitizeIdentifier(element.elementId)}"]`;
    default:
      return `.${toClassName(element.elementName)}`;
  }
}

/**
 * Convert element name to a valid CSS class name
 * @param name - Element name
 */
export function toClassName(name: string): string {
  return sanitizeIdentifier(name);
}

/**
 * Convert element name to a valid JavaScript variable name
 * @param name - Element name
 */
export function toVariableName(name: string): string {
  return toCamelCase(name);
}

/**
 * Convert element name to a valid component name (PascalCase)
 * @param name - Element name
 */
export function toComponentName(name: string): string {
  return toPascalCase(name);
}

/**
 * Generate a CSS custom property name
 * @param elementName - Element name
 * @param propertyName - CSS property being animated
 * @param prefix - Custom property prefix
 */
export function toCustomPropertyName(
  elementName: string,
  propertyName: string,
  prefix: string = "anim"
): string {
  const sanitizedElement = sanitizeIdentifier(elementName);
  const sanitizedProp = sanitizeIdentifier(propertyName);
  return `--${prefix}-${sanitizedElement}-${sanitizedProp}`;
}

/**
 * Generate a state class name
 * @param stateName - Animation state name
 */
export function toStateClassName(stateName: string): string {
  return `state-${sanitizeIdentifier(stateName)}`;
}

/**
 * Generate a keyframes animation name
 * @param fromStateName - Source state name
 * @param toStateName - Target state name
 * @param elementName - Element being animated
 */
export function toKeyframesName(
  fromStateName: string,
  toStateName: string,
  elementName?: string
): string {
  const base = `${sanitizeIdentifier(fromStateName)}-to-${sanitizeIdentifier(toStateName)}`;
  if (elementName) {
    return `${base}-${sanitizeIdentifier(elementName)}`;
  }
  return base;
}

/**
 * Generate a Framer Motion variants key
 * @param stateName - Animation state name
 */
export function toVariantKey(stateName: string): string {
  return toCamelCase(stateName);
}

/**
 * Generate a GSAP label name
 * @param stateName - State name for the label
 */
export function toGSAPLabel(stateName: string): string {
  return sanitizeIdentifier(stateName);
}

/**
 * Get element display name (uses name if available, falls back to id)
 * @param element - Element snapshot
 */
export function getElementDisplayName(
  element: Pick<ElementSnapshot, "elementId" | "elementName">
): string {
  return element.elementName || element.elementId;
}

/**
 * Generate unique selectors for a collection of elements
 * Handles duplicates by adding numeric suffixes
 * @param elements - Array of element snapshots
 * @param strategy - Naming strategy
 */
export function getUniqueSelectors(
  elements: Pick<ElementSnapshot, "elementId" | "elementName">[],
  strategy: ElementNamingStrategy
): Map<string, string> {
  const selectorMap = new Map<string, string>();
  const usedSelectors = new Map<string, number>();

  for (const element of elements) {
    let selector = getElementSelector(element, strategy);

    // Check for duplicates
    const count = usedSelectors.get(selector) || 0;
    if (count > 0) {
      // Append number to make unique
      const baseSelector = selector;
      selector = strategy === "id"
        ? `${baseSelector}-${count}`
        : strategy === "class"
        ? `${baseSelector}-${count}`
        : `[data-element="${sanitizeIdentifier(element.elementId)}-${count}"]`;
    }

    usedSelectors.set(getElementSelector(element, strategy), count + 1);
    selectorMap.set(element.elementId, selector);
  }

  return selectorMap;
}
