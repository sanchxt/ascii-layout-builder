import type { CanvasConstants } from "@/types/canvas";
import type { BorderStyle } from "@/types/box";
import type {
  LineConstants,
  ArrowHeadStyle,
  LineOutputMode,
} from "@/types/line";

export const CANVAS_CONSTANTS: CanvasConstants = {
  /** min zoom (10%) */
  MIN_ZOOM: 0.1,
  /** max zoom (500%) */
  MAX_ZOOM: 5,
  /** zoom increment/decrement (5%) */
  ZOOM_STEP: 0.05,
  /** default zoom (100%) */
  DEFAULT_ZOOM: 1,
  /** grid cell size */
  GRID_SIZE: 20,
  /** grid color */
  GRID_COLOR: "var(--canvas-grid, rgba(0, 0, 0, 0.1))",
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
  SELECTION_OUTLINE_COLOR: "var(--canvas-selection, #3b82f6)",

  /** maximum nesting depth */
  MAX_NESTING_DEPTH: 5,
  /** pixel threshold inside parent border for valid drop zone */
  NESTING_DROP_ZONE_THRESHOLD: 20,
  /** pixel threshold outside parent bounds to trigger detach */
  AUTO_DETACH_THRESHOLD: 20,
  /** color for valid drop zone highlight */
  NESTING_HIGHLIGHT_COLOR: "var(--canvas-valid, #10b981)",
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

export const ARTBOARD_CONSTANTS = {
  SPACING: 100,
  /** artboard border color */
  BORDER_COLOR: "var(--border, #9ca3af)",
  /** artboard border thickness */
  BORDER_THICKNESS: 2,
  /** artboard border dash pattern */
  BORDER_DASH: "8 4",
  /** artboard label height */
  LABEL_HEIGHT: 40,
  /** artboard label bg color */
  LABEL_BG: "var(--muted, #f3f4f6)",
  /** selected artboard border color */
  SELECTED_BORDER_COLOR: "var(--canvas-selection, #3b82f6)",
  /** artboard label font size */
  LABEL_FONT_SIZE: 14,

  /** preset dimensions */
  PRESETS: {
    mobile: { width: 375, height: 667, name: "Mobile" },
    tablet: { width: 768, height: 1024, name: "Tablet" },
    desktop: { width: 1440, height: 900, name: "Desktop" },
  },

  /** default artboard */
  DEFAULT_PRESET: "desktop" as const,
  /** default artboard position */
  DEFAULT_X: 100,
  DEFAULT_Y: 100,
} as const;

export const LINE_CONSTANTS: LineConstants = {
  /** minimum line length in pixels */
  MIN_LENGTH: 20,
  /** snap distance to box edges for connections */
  CONNECTION_SNAP_DISTANCE: 10,
  /** click detection tolerance for thin lines */
  SELECTION_TOLERANCE: 5,
  /** default line thickness */
  DEFAULT_THICKNESS: 1,
  /** default arrow style */
  DEFAULT_ARROW_STYLE: "none" as ArrowHeadStyle,
  /** default line style */
  DEFAULT_LINE_STYLE: "solid" as const,
  /** default output mode */
  DEFAULT_OUTPUT_MODE: "ascii" as LineOutputMode,
  /** selection outline color */
  SELECTION_OUTLINE_COLOR: "var(--canvas-selection, #3b82f6)",
  /** endpoint handle size */
  ENDPOINT_HANDLE_SIZE: 8,
} as const;

export const STORAGE_KEYS = {
  CANVAS_STATE: "ascii-layout-builder:canvas-state",
  PROJECT_STATE: "ascii-layout-builder:project-state",
  BOX_STATE: "ascii-layout-builder:box-state",
  ARTBOARD_STATE: "ascii-layout-builder:artboard-state",
  LINE_STATE: "ascii-layout-builder:line-state",
  ANIMATION_STATE: "ascii-layout-builder:animation-state",
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
  TOOL_LINE: "l",

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
  TOGGLE_SNAP_TO_GRID: ";", // ctrl + shift + ;
  TOGGLE_SMART_GUIDES: "I", // ctrl + shift + i
} as const;

export const ASCII_CONSTANTS = {
  /** px per character width */
  CHAR_WIDTH_RATIO: 8,
  /** px per character height */
  CHAR_HEIGHT_RATIO: 12,
  /** min box width in chars */
  MIN_BOX_CHARS_WIDTH: 10,
  /** min box height in chars */
  MIN_BOX_CHARS_HEIGHT: 5,
  /** debounce delay in ms */
  GENERATION_DEBOUNCE: 300,
  /** max output lines */
  MAX_OUTPUT_LINES: 10000,
  /** max characters per line */
  MAX_LINE_LENGTH: 500,
  /** padding inside box */
  TEXT_PADDING_CHARS: 1,
} as const;

export const ALIGNMENT_CONSTANTS = {
  /** guide snap threshold in px */
  GUIDE_SNAP_THRESHOLD: 5,
  /** max distance to show spacing guides in px */
  SPACING_GUIDE_MAX_DISTANCE: 200,
  /** smart guide color */
  SMART_GUIDE_COLOR: "var(--canvas-guide-align, #a855f7)",
  /** smart guide thickness */
  SMART_GUIDE_THICKNESS: 1,
  /** smart guide dash pattern */
  SMART_GUIDE_DASH: "4 4",
  /** spacing guide color */
  SPACING_GUIDE_COLOR: "var(--canvas-guide-spacing, #6366f1)",
  /** spacing label background */
  SPACING_LABEL_BG: "var(--primary, #1f2937)",
  /** spacing label text color */
  SPACING_LABEL_COLOR: "var(--primary-foreground, #ffffff)",
} as const;

export const ALIGNMENT_SHORTCUTS = {
  // alignment
  ALIGN_LEFT: "L", // ctrl + shift + L
  ALIGN_CENTER_H: "H", // ctrl + shift + H
  ALIGN_RIGHT: "R", // ctrl + shift + R
  ALIGN_TOP: "T", // ctrl + shift + T
  ALIGN_MIDDLE_V: "M", // ctrl + shift + M
  ALIGN_BOTTOM: "B", // ctrl + shift + B

  // distribution
  DISTRIBUTE_H: "h", // ctrl + shift + alt + H
  DISTRIBUTE_V: "v", // ctrl + shift + alt + V
} as const;

export const LAYER_SHORTCUTS = {
  TOGGLE_VISIBILITY: "h", // ctrl + h
  TOGGLE_LOCK: "l", // ctrl + l

  BRING_FORWARD: "]", // ctrl + ]
  SEND_BACKWARD: "[", // ctrl + [
  BRING_TO_FRONT: "}", // ctrl + shift + ]
  SEND_TO_BACK: "{", // ctrl + shift + [

  EXPAND_ALL_LAYERS: "E", // ctrl + shift + E
  COLLAPSE_ALL_LAYERS: "C", // ctrl + shift + C
} as const;

export const ANIMATION_CONSTANTS = {
  /** Maximum states per artboard */
  MAX_STATES_PER_ARTBOARD: 20,
  /** Thumbnail dimensions */
  THUMBNAIL_WIDTH: 160,
  THUMBNAIL_HEIGHT: 100,
  /** Default state names */
  DEFAULT_FIRST_STATE_NAME: "default",
  /** Default animation duration in ms */
  DEFAULT_DURATION: 300,
  /** Default easing */
  DEFAULT_EASING: "ease-out",

  // Transition defaults
  /** Default transition duration in ms */
  DEFAULT_TRANSITION_DURATION: 300,
  /** Minimum transition duration in ms */
  MIN_TRANSITION_DURATION: 50,
  /** Maximum transition duration in ms */
  MAX_TRANSITION_DURATION: 5000,
  /** Default delay in ms */
  DEFAULT_DELAY: 0,
  /** Maximum delay in ms */
  MAX_DELAY: 2000,

  // Stagger
  /** Default stagger delay between elements in ms */
  DEFAULT_STAGGER_DELAY: 50,

  // Hold Time
  /** Default hold time for states in ms */
  DEFAULT_HOLD_TIME: 0,
  /** Minimum hold time in ms */
  MIN_HOLD_TIME: 0,
  /** Maximum hold time in ms */
  MAX_HOLD_TIME: 10000,

  // Auto Trigger
  /** Default auto-trigger delay in ms */
  DEFAULT_AUTO_TRIGGER_DELAY: 500,

  // Timeline
  /** Minimum timeline panel height in px */
  TIMELINE_MIN_HEIGHT: 120,
  /** Maximum timeline panel height in px */
  TIMELINE_MAX_HEIGHT: 300,
  /** Default timeline panel height in px */
  TIMELINE_DEFAULT_HEIGHT: 180,
  /** Timeline tick interval in ms */
  TIMELINE_TICK_INTERVAL: 100,
  /** Pixels per millisecond for timeline scale */
  TIMELINE_PX_PER_MS: 0.3,

  // Playback
  /** Available playback speeds */
  PLAYBACK_SPEEDS: [0.25, 0.5, 1, 1.5, 2] as const,
  /** Default playback speed */
  DEFAULT_PLAYBACK_SPEED: 1,
} as const;

export const ANIMATION_SHORTCUTS = {
  /** Toggle between layout/animation mode */
  TOGGLE_MODE: "m", // Ctrl/Cmd + M
  /** Play/pause animation */
  PLAY_PAUSE: " ", // Space
  /** Stop animation and reset to start */
  STOP: "Escape",
  /** Seek to start */
  SEEK_START: "Home",
  /** Seek to end */
  SEEK_END: "End",
  /** Toggle loop mode */
  TOGGLE_LOOP: "l", // In animation mode
  /** Enter preview mode */
  ENTER_PREVIEW: "p", // Ctrl/Cmd + P
  /** Toggle connection lines */
  TOGGLE_CONNECTIONS: "k", // Ctrl/Cmd + K
  /** Cycle through modes */
  CYCLE_MODES: "m", // Ctrl/Cmd + Shift + M
} as const;

/**
 * Trigger Visualization Constants
 * Colors, sizes, and configuration for the trigger visualization system
 */
/**
 * Responsive Breakpoints
 * Standardized breakpoints for consistent responsive behavior
 */
export const BREAKPOINTS = {
  /** Mobile: < 640px */
  MOBILE: 640,
  /** Tablet: 640px - 1023px */
  TABLET: 1024,
  /** Desktop: >= 1024px */
  DESKTOP: 1024,
  /** Large desktop: >= 1280px */
  LARGE: 1280,
} as const;

/**
 * Media Query Strings
 * Pre-built media query strings for use with useMediaQuery hook
 */
export const MEDIA_QUERIES = {
  /** Mobile: max-width 639px */
  MOBILE: "(max-width: 639px)",
  /** Tablet: 640px to 1023px */
  TABLET: "(min-width: 640px) and (max-width: 1023px)",
  /** Desktop: min-width 1024px */
  DESKTOP: "(min-width: 1024px)",
  /** Large desktop: min-width 1280px */
  LARGE: "(min-width: 1280px)",
} as const;

/**
 * Layout Constants
 * Dimensions and offsets for UI panels
 */
export const LAYOUT_CONSTANTS = {
  /** Toolbar height (h-12 = 48px) */
  TOOLBAR_HEIGHT: 48,
  /** Right sidebar width on desktop */
  RIGHT_SIDEBAR_WIDTH: 288,
  /** Right sidebar width on tablet */
  RIGHT_SIDEBAR_WIDTH_TABLET: 264,
  /** Output drawer width */
  OUTPUT_DRAWER_WIDTH: 300,
  /** Output drawer width on tablet (narrower to fit viewport) */
  OUTPUT_DRAWER_WIDTH_TABLET: 280,
  /** Layout panel width */
  LAYOUT_PANEL_WIDTH: 300,
  /** Layout panel width on tablet */
  LAYOUT_PANEL_WIDTH_TABLET: 280,
  /** Mobile timeline mini-bar height */
  TIMELINE_MINIBAR_HEIGHT: 40,
  /** Grab handle height for slide-over panels */
  PANEL_HANDLE_HEIGHT: 20,
} as const;

export const TRIGGER_VISUALIZATION = {
  /** Colors for each trigger type - background, text, border, and SVG stroke */
  COLORS: {
    initial: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/40",
      stroke: "#10b981",
      fill: "rgba(16, 185, 129, 0.15)",
    },
    hover: {
      bg: "bg-sky-500/15",
      text: "text-sky-600 dark:text-sky-400",
      border: "border-sky-500/40",
      stroke: "#0ea5e9",
      fill: "rgba(14, 165, 233, 0.15)",
    },
    click: {
      bg: "bg-orange-500/15",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-500/40",
      stroke: "#f97316",
      fill: "rgba(249, 115, 22, 0.15)",
    },
    focus: {
      bg: "bg-violet-500/15",
      text: "text-violet-600 dark:text-violet-400",
      border: "border-violet-500/40",
      stroke: "#8b5cf6",
      fill: "rgba(139, 92, 246, 0.15)",
    },
    scroll: {
      bg: "bg-cyan-500/15",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-cyan-500/40",
      stroke: "#06b6d4",
      fill: "rgba(6, 182, 212, 0.15)",
    },
    auto: {
      bg: "bg-amber-500/15",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/40",
      stroke: "#f59e0b",
      fill: "rgba(245, 158, 11, 0.15)",
    },
    custom: {
      bg: "bg-pink-500/15",
      text: "text-pink-600 dark:text-pink-400",
      border: "border-pink-500/40",
      stroke: "#ec4899",
      fill: "rgba(236, 72, 153, 0.15)",
    },
  },

  /** Connection line styling */
  CONNECTION_LINE: {
    WIDTH: 2,
    DASH: "6 4",
    ANIMATION_DURATION: "1.5s",
  },

  /** Badge sizing */
  BADGE: {
    SM: { size: 16, iconSize: 10 },
    MD: { size: 20, iconSize: 12 },
    LG: { size: 24, iconSize: 14 },
  },

  /** Preview mode settings */
  PREVIEW: {
    /** Auto-reset delay after click trigger (ms) */
    CLICK_RESET_DELAY: 2000,
    /** Overlay fade duration (ms) */
    OVERLAY_FADE_DURATION: 300,
    /** Overlay auto-dismiss delay (ms) */
    OVERLAY_DISMISS_DELAY: 3000,
    /** Glow animation duration */
    GLOW_DURATION: "0.3s",
  },

  /** Canvas badge positioning */
  CANVAS_BADGE: {
    /** Vertical offset from element top */
    OFFSET_Y: -28,
    /** Horizontal offset from element left */
    OFFSET_X: 0,
  },
} as const;
