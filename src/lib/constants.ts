import type { CanvasConstants } from "@/types/canvas";

export const CANVAS_CONSTANTS: CanvasConstants = {
  /** min zoom (10%) */
  MIN_ZOOM: 0.1,
  /** max zoom (500%) */
  MAX_ZOOM: 5,
  /** zoom increment/decrement */
  ZOOM_STEP: 0.1,
  /** default zoom (100%) */
  DEFAULT_ZOOM: 1,
  /** grid cell size (px) */
  GRID_SIZE: 20,
  /** grid color */
  GRID_COLOR: "rgba(0, 0, 0, 0.1)",
  /** grid dot size (px) */
  GRID_DOT_SIZE: 1,
};

/**
 * localStorage keys
 */
export const STORAGE_KEYS = {
  CANVAS_STATE: "ascii-layout-builder:canvas-state",
  PROJECT_STATE: "ascii-layout-builder:project-state",
} as const;

/**
 * keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  SPACEBAR: " ",
  DELETE: "Delete",
  BACKSPACE: "Backspace",
  ESCAPE: "Escape",
} as const;
