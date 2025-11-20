export type ToolType = "select" | "box" | "text" | "artboard";

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CanvasViewport {
  position: CanvasPosition;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  showSmartGuides: boolean;
}

export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface CanvasInteraction {
  isPanning: boolean;
  lastMousePosition: CanvasPosition | null;
  isSpacebarPressed: boolean;
  selectedTool: ToolType;
  editingBoxId: string | null;
  selectionRect: SelectionRect | null;
}

export interface CanvasState {
  viewport: CanvasViewport;
  interaction: CanvasInteraction;

  setPan: (position: CanvasPosition) => void;
  updatePan: (deltaX: number, deltaY: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleSmartGuides: () => void;
  setIsPanning: (isPanning: boolean) => void;
  setLastMousePosition: (position: CanvasPosition | null) => void;
  setIsSpacebarPressed: (isPressed: boolean) => void;
  setSelectedTool: (tool: ToolType) => void;
  enterEditMode: (boxId: string) => void;
  exitEditMode: () => void;
  startSelectionRect: (startX: number, startY: number) => void;
  updateSelectionRect: (endX: number, endY: number) => void;
  clearSelectionRect: () => void;
  resetCanvas: () => void;
}

export interface CanvasConstants {
  MIN_ZOOM: number;
  MAX_ZOOM: number;
  ZOOM_STEP: number;
  DEFAULT_ZOOM: number;
  GRID_SIZE: number;
  GRID_COLOR: string;
  GRID_DOT_SIZE: number;
  WHEEL_PAN_SENSITIVITY: number;
}
