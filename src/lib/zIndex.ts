/**
 * Semantic Z-Index System
 *
 * Layers are organized from bottom to top:
 * - Canvas layer (0-9): Canvas elements, grid, guides
 * - UI layer (10-19): Persistent UI elements (sidebars, controls)
 * - Panel layer (30-39): Slide-over panels, drawers
 * - Modal layer (45-55): Modals, command palette, backdrops
 * - Toast layer (60+): Notifications, tooltips
 */
export const Z_INDEX = {
  // Canvas layer (0-9)
  CANVAS_GRID: 0,
  CANVAS_ELEMENTS: 1,
  CANVAS_GUIDES: 5,
  CANVAS_SELECTION: 8,

  // UI layer (10-19) - persistent elements
  LEFT_SIDEBAR: 10,
  CANVAS_CONTROLS: 10,
  TOOLBAR: 15,
  RIGHT_SIDEBAR: 15,

  // Timeline layer (20-29) - timeline-specific elements
  TIMELINE_TRACK_LABEL: 20,
  TIMELINE_PLAYHEAD: 25,
  TIMELINE_TOOLTIP: 28,

  // Panel layer (30-39) - slide-over panels
  OUTPUT_DRAWER: 30,
  LAYOUT_PANEL: 32,
  PANEL_BACKDROP: 35,
  SIDEBAR_BACKDROP: 35,
  RIGHT_SIDEBAR_MOBILE: 36,
  STATE_EDITOR: 38,

  // Modal layer (45-55)
  MODAL_BACKDROP: 45,
  COMMAND_PALETTE: 50,
  INLINE_COMMAND: 50,
  MODAL: 50,

  // Toast layer (60+)
  TOOLTIP: 60,
  TOAST: 65,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
