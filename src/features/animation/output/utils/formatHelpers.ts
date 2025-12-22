/**
 * Format Helpers for Animation Output Generation
 * Utility functions for code formatting and string manipulation
 */

/**
 * Apply indentation to code
 * @param code - Code string to indent
 * @param level - Indentation level (number of times to apply indent)
 * @param indentStr - String to use for indentation (default: 2 spaces)
 */
export function indent(
  code: string,
  level: number = 1,
  indentStr: string = "  "
): string {
  if (level <= 0) return code;
  const prefix = indentStr.repeat(level);
  return code
    .split("\n")
    .map((line) => (line.trim() ? prefix + line : line))
    .join("\n");
}

/**
 * Format a number with specified decimal precision
 * Removes trailing zeros
 * @param value - Number to format
 * @param decimals - Maximum decimal places (default: 2)
 */
export function formatNumber(value: number, decimals: number = 2): string {
  const fixed = value.toFixed(decimals);
  // Remove trailing zeros after decimal point
  return parseFloat(fixed).toString();
}

/**
 * Convert milliseconds to seconds format string
 * @param ms - Duration in milliseconds
 * @returns String like "0.3s"
 */
export function msToSeconds(ms: number): string {
  const seconds = ms / 1000;
  return `${formatNumber(seconds, 3)}s`;
}

/**
 * Convert milliseconds to seconds as a number
 * @param ms - Duration in milliseconds
 * @returns Number in seconds
 */
export function msToSecondsNum(ms: number): number {
  return ms / 1000;
}

/**
 * Generate a comment block
 * @param text - Comment text
 * @param style - Comment style ("css" | "js" | "jsx")
 */
export function generateComment(
  text: string,
  style: "css" | "js" | "jsx"
): string {
  switch (style) {
    case "css":
      return `/* ${text} */`;
    case "js":
      return `// ${text}`;
    case "jsx":
      return `{/* ${text} */}`;
  }
}

/**
 * Generate a multi-line comment block
 * @param lines - Array of comment lines
 * @param style - Comment style
 */
export function generateMultiLineComment(
  lines: string[],
  style: "css" | "js"
): string {
  if (lines.length === 0) return "";

  switch (style) {
    case "css":
      if (lines.length === 1) {
        return `/* ${lines[0]} */`;
      }
      return [`/**`, ...lines.map((l) => ` * ${l}`), ` */`].join("\n");
    case "js":
      if (lines.length === 1) {
        return `// ${lines[0]}`;
      }
      return lines.map((l) => `// ${l}`).join("\n");
  }
}

/**
 * Join code blocks with blank lines
 * @param blocks - Array of code blocks
 * @param separator - Number of blank lines between blocks (default: 1)
 */
export function joinCodeBlocks(
  blocks: string[],
  separator: number = 1
): string {
  const filtered = blocks.filter((block) => block.trim());
  const sep = "\n".repeat(separator + 1);
  return filtered.join(sep);
}

/**
 * Wrap content in curly braces
 * @param content - Content to wrap
 * @param inline - Whether to keep on single line
 */
export function wrapInBraces(content: string, inline: boolean = false): string {
  if (inline) {
    return `{ ${content} }`;
  }
  return `{\n${indent(content)}\n}`;
}

/**
 * Format an object as JavaScript/TypeScript code
 * @param obj - Object to format
 * @param indentLevel - Starting indent level
 * @param indentStr - Indent string
 */
export function formatObject(
  obj: Record<string, unknown>,
  indentLevel: number = 0,
  indentStr: string = "  "
): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return "{}";

  const lines = entries.map(([key, value]) => {
    const formattedValue = formatValue(value, indentLevel + 1, indentStr);
    // Use shorthand if key and value are the same identifier
    return `${key}: ${formattedValue},`;
  });

  const content = lines.join("\n");
  const indented = indent(content, 1, indentStr);
  return `{\n${indented}\n${indentStr.repeat(indentLevel)}}`;
}

/**
 * Format a value for JavaScript output
 */
function formatValue(
  value: unknown,
  indentLevel: number,
  indentStr: string
): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => formatValue(v, indentLevel + 1, indentStr));
    return `[${items.join(", ")}]`;
  }
  if (typeof value === "object") {
    return formatObject(
      value as Record<string, unknown>,
      indentLevel,
      indentStr
    );
  }
  return String(value);
}

/**
 * Create a CSS property declaration
 * @param property - CSS property name
 * @param value - Property value
 */
export function cssProperty(property: string, value: string): string {
  return `${property}: ${value};`;
}

/**
 * Create a CSS rule block
 * @param selector - CSS selector
 * @param properties - Object of property: value pairs
 * @param indentStr - Indent string
 */
export function cssRule(
  selector: string,
  properties: Record<string, string>,
  indentStr: string = "  "
): string {
  const props = Object.entries(properties)
    .map(([prop, val]) => cssProperty(prop, val))
    .join("\n");
  return `${selector} {\n${indent(props, 1, indentStr)}\n}`;
}

/**
 * Sanitize a string for use as an identifier
 * @param str - String to sanitize
 */
export function sanitizeIdentifier(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/^[0-9-]/, "_$&")
    .replace(/-+/g, "-")
    .toLowerCase();
}

/**
 * Convert string to camelCase
 * @param str - String to convert
 */
export function toCamelCase(str: string): string {
  return sanitizeIdentifier(str)
    .split("-")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
}

/**
 * Convert string to PascalCase
 * @param str - String to convert
 */
export function toPascalCase(str: string): string {
  return sanitizeIdentifier(str)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}
