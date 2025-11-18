import type { CanvasConstants } from "@/types/canvas";
import type { BorderStyle } from "@/types/box";

export const CANVAS_CONSTANTS: CanvasConstants = {
  /** min zoom (10%) */
  MIN_ZOOM: 0.1,
  /** max zoom (500%) */
  MAX_ZOOM: 5,
  /** zoom increment/decrement */
  ZOOM_STEP: 0.1,
  /** default zoom (100%) */
  DEFAULT_ZOOM: 1,
  /** grid cell size */
  GRID_SIZE: 20,
  /** grid color */
  GRID_COLOR: "rgba(0, 0, 0, 0.1)",
  /** grid dot size */
  GRID_DOT_SIZE: 1,
  /** wheel pan sensitivity */
  WHEEL_PAN_SENSITIVITY: 1.0,
};

export const BOX_CONSTANTS = {
  /** default box width */
  DEFAULT_WIDTH: 400,
  /** default box height */
  DEFAULT_HEIGHT: 300,
  /** minimum box width */
  MIN_WIDTH: 100,
  /** minimum box height */
  MIN_HEIGHT: 60,
  /** default border style */
  DEFAULT_BORDER_STYLE: "single" as BorderStyle,
  /** default padding */
  DEFAULT_PADDING: 16,
  /** resize handle size */
  HANDLE_SIZE: 8,
  /** resize handle hit area */
  HANDLE_HIT_AREA: 16,
  /** selection outline width */
  SELECTION_OUTLINE_WIDTH: 2,
  /** selection outline color */
  SELECTION_OUTLINE_COLOR: "#3b82f6",

  /** maximum nesting depth */
  MAX_NESTING_DEPTH: 5,
  /** pixel threshold inside parent border for valid drop zone */
  NESTING_DROP_ZONE_THRESHOLD: 20,
  /** pixel threshold outside parent bounds to trigger detach */
  AUTO_DETACH_THRESHOLD: 20,
  /** color for valid drop zone highlight */
  NESTING_HIGHLIGHT_COLOR: "#10b981", // green
  /** padding around grouped boxes when creating parent */
  GROUP_PADDING: 40,
  /** opacity for drag preview */
  DRAG_PREVIEW_OPACITY: 0.5,
} as const;

export const TEXT_CONSTANTS = {
  /** default placeholder text */
  PLACEHOLDER: "Double-click to add text",
  /** placeholder examples */
  PLACEHOLDERS: ["[Logo]", "[Image]", "[Icon]", "[Button]", "[Video]"],
  /** highlight colors */
  HIGHLIGHT_COLORS: ["#3b82f6", "#ec4899", "#10b981", "#eab308"] as const,
  /** max text */
  MAX_LENGTH: 10000,
} as const;

export const STORAGE_KEYS = {
  CANVAS_STATE: "ascii-layout-builder:canvas-state",
  PROJECT_STATE: "ascii-layout-builder:project-state",
  BOX_STATE: "ascii-layout-builder:box-state",
} as const;

export const KEYBOARD_SHORTCUTS = {
  // navigation
  SPACEBAR: " ",
  DELETE: "Delete",
  BACKSPACE: "Backspace",
  ESCAPE: "Escape",

  // tools
  TOOL_SELECT: "v",
  TOOL_BOX: "b",
  TOOL_TEXT: "t",
  TOOL_ARTBOARD: "a",

  // actions
  DUPLICATE: "d",
  SELECT_ALL: "a",
  GROUP: "g",
  UNGROUP: "G",
  UNDO: "z",
  REDO: "Z",
  COPY: "c",
  PASTE: "v",

  // zoom
  ZOOM_IN: "=",
  ZOOM_OUT: "-",
  ZOOM_RESET: "0",

  // view
  TOGGLE_GRID: "'",
  TOGGLE_PREVIEW: "/",
} as const;
