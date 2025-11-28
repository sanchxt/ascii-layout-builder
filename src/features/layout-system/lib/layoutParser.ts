import type {
  LayoutConfig,
  FlexLayout,
  GridLayout,
  FlexDirection,
} from "../types/layout";
import { DEFAULT_FLEX_LAYOUT, DEFAULT_GRID_LAYOUT } from "../types/layout";

export interface ParsedLayoutCommand {
  type: "flex" | "grid";
  direction?: FlexDirection;
  gap?: number;
  valid: boolean;
  error?: string;
}

export function parseLayoutCommand(input: string): ParsedLayoutCommand {
  const trimmed = input.trim().toLowerCase();

  const flexResult = parseFlexCommand(trimmed);
  if (flexResult.valid) return flexResult;

  const gridResult = parseGridCommand(trimmed);
  if (gridResult.valid) return gridResult;

  return {
    type: "flex",
    valid: false,
    error: `Unknown command format: "${input}". Try "flex row 3" or "grid 2x3"`,
  };
}

function parseFlexCommand(input: string): ParsedLayoutCommand {
  const flexPattern = /^flex\s+(row|col|column)\s+(\d+)(?:\s+gap=(\d+))?$/;
  const match = input.match(flexPattern);

  if (!match) {
    return { type: "flex", valid: false };
  }

  const direction: FlexDirection = match[1] === "row" ? "row" : "column";
  const count = parseInt(match[2], 10);
  const gap = match[3] ? parseInt(match[3], 10) : undefined;

  if (count < 1 || count > 20) {
    return {
      type: "flex",
      valid: false,
      error: "Count must be between 1 and 20",
    };
  }

  return {
    type: "flex",
    direction,
    count,
    gap,
    valid: true,
  };
}

function parseGridCommand(input: string): ParsedLayoutCommand {
  const gridPattern1 = /^grid\s+(\d+)x(\d+)(?:\s+gap=(\d+))?$/;
  const gridPattern2 = /^grid\s+\((\d+),\s*(\d+)\)(?:\s+gap=(\d+))?$/;

  let match = input.match(gridPattern1);
  if (!match) {
    match = input.match(gridPattern2);
  }

  if (!match) {
    return { type: "grid", valid: false };
  }

  const columns = parseInt(match[1], 10);
  const rows = parseInt(match[2], 10);
  const gap = match[3] ? parseInt(match[3], 10) : undefined;

  if (columns < 1 || columns > 12) {
    return {
      type: "grid",
      valid: false,
      error: "Columns must be between 1 and 12",
    };
  }
  if (rows < 1 || rows > 12) {
    return {
      type: "grid",
      valid: false,
      error: "Rows must be between 1 and 12",
    };
  }

  return {
    type: "grid",
    columns,
    rows,
    count: columns * rows,
    gap,
    valid: true,
  };
}

export function parsedCommandToConfig(
  parsed: ParsedLayoutCommand
): LayoutConfig | null {
  if (!parsed.valid) return null;

  if (parsed.type === "flex") {
    const config: FlexLayout = {
      ...DEFAULT_FLEX_LAYOUT,
      direction: parsed.direction || "row",
    };
    if (parsed.gap !== undefined) {
      config.gap = parsed.gap;
    }
    return config;
  }

  if (parsed.type === "grid") {
    const config: GridLayout = {
      ...DEFAULT_GRID_LAYOUT,
      columns: parsed.columns || 2,
      rows: parsed.rows || 2,
    };
    if (parsed.gap !== undefined) {
      config.gap = parsed.gap;
    }
    return config;
  }

  return null;
}

export function getChildCount(parsed: ParsedLayoutCommand): number {
  if (!parsed.valid) return 0;

  if (parsed.type === "flex") {
    return parsed.count || 0;
  }

  if (parsed.type === "grid") {
    return (parsed.columns || 1) * (parsed.rows || 1);
  }

  return 0;
}

export function getCommandSuggestions(input: string): string[] {
  const trimmed = input.trim().toLowerCase();
  const suggestions: string[] = [];

  if (trimmed === "" || "flex".startsWith(trimmed)) {
    suggestions.push("flex row 2", "flex row 3", "flex col 2", "flex col 3");
  }

  if (trimmed === "" || "grid".startsWith(trimmed)) {
    suggestions.push("grid 2x2", "grid 3x3", "grid 2x3", "grid 3x2");
  }

  if (trimmed.startsWith("flex ")) {
    const rest = trimmed.substring(5);
    if ("row".startsWith(rest)) {
      suggestions.push("flex row 2", "flex row 3", "flex row 4", "flex row 5");
    }
    if ("col".startsWith(rest) || "column".startsWith(rest)) {
      suggestions.push("flex col 2", "flex col 3", "flex col 4", "flex col 5");
    }
  }

  if (trimmed.startsWith("grid ")) {
    suggestions.push(
      "grid 2x2",
      "grid 2x3",
      "grid 3x2",
      "grid 3x3",
      "grid 4x2",
      "grid 2x4"
    );
  }

  return suggestions.filter((s) => s.startsWith(trimmed) || trimmed === "");
}

export function isValidLayoutCommand(input: string): boolean {
  const result = parseLayoutCommand(input);
  return result.valid;
}

export function getLayoutDescription(config: LayoutConfig): string {
  if (config.type === "none") {
    return "No layout";
  }

  if (config.type === "flex") {
    const dir = config.direction === "row" ? "horizontal" : "vertical";
    return `Flex ${dir} (gap: ${config.gap}px)`;
  }

  if (config.type === "grid") {
    return `Grid ${config.columns}x${config.rows} (gap: ${config.gap}px)`;
  }

  return "Unknown layout";
}

export function getLayoutBadgeLabel(config: LayoutConfig): string {
  if (config.type === "none") return "";

  if (config.type === "flex") {
    return config.direction === "row" ? "flex →" : "flex ↓";
  }

  if (config.type === "grid") {
    return `${config.columns}×${config.rows}`;
  }

  return "";
}
