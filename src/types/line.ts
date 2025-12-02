export type LineDirection = "horizontal" | "vertical";

export type ArrowHeadStyle = "none" | "simple" | "filled";

export type LineOutputMode = "ascii" | "svg" | "comment";

export type LineLabelPosition = "start" | "middle" | "end";

export type LineCreationMode = "idle" | "drawing";

export type LineEndpoint = "start" | "end";

export interface BoxConnectionPoint {
  boxId: string;
  side: "top" | "right" | "bottom" | "left";
  offset: number;
}

export interface LineLabel {
  text: string;
  position: LineLabelPosition;
}

export interface Line {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  direction: LineDirection;
  startArrow: ArrowHeadStyle;
  endArrow: ArrowHeadStyle;
  lineStyle: "solid" | "dashed" | "dotted";
  outputMode: LineOutputMode;
  label?: LineLabel;
  startConnection?: BoxConnectionPoint;
  endConnection?: BoxConnectionPoint;
  artboardId?: string;
  parentId?: string;
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
  name?: string;
}

export interface LineState {
  lines: Line[];
  selectedLineIds: string[];
  creationMode: LineCreationMode;
  tempLine: Partial<Line> | null;
  clipboardLineIds: string[];

  addLine: (line: Line) => void;
  addLines: (lines: Line[]) => void;
  updateLine: (id: string, updates: Partial<Line>) => void;
  deleteLine: (id: string) => void;
  deleteLines: (ids: string[]) => void;

  selectLine: (id: string, multi?: boolean, skipBoxClear?: boolean) => void;
  clearLineSelection: () => void;
  selectAllLines: () => void;

  setLineCreationMode: (mode: LineCreationMode) => void;
  setTempLine: (line: Partial<Line> | null) => void;

  copyLines: () => void;
  pasteLines: () => void;
  duplicateLines: (ids: string[]) => void;

  getLine: (id: string) => Line | undefined;
  getSelectedLines: () => Line[];
  getLinesInArtboard: (artboardId: string) => Line[];
  getLinesConnectedToBox: (boxId: string) => Line[];
  getLinesInBox: (boxId: string) => Line[];

  setParent: (lineId: string, parentId: string | undefined) => void;
  detachFromParent: (lineId: string) => void;

  moveLineToFront: (id: string) => void;
  moveLineToBack: (id: string) => void;
  moveLineForward: (id: string) => void;
  moveLineBackward: (id: string) => void;

  toggleLineLock: (id: string) => void;

  resetLines: () => void;
}

export interface LineConstants {
  MIN_LENGTH: number;
  CONNECTION_SNAP_DISTANCE: number;
  SELECTION_TOLERANCE: number;
  DEFAULT_THICKNESS: number;
  DEFAULT_ARROW_STYLE: ArrowHeadStyle;
  DEFAULT_LINE_STYLE: "solid" | "dashed" | "dotted";
  DEFAULT_OUTPUT_MODE: LineOutputMode;
  SELECTION_OUTLINE_COLOR: string;
  ENDPOINT_HANDLE_SIZE: number;
}
