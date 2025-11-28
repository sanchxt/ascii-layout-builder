import type {
  LayoutConfig,
  BoxLayoutChildProps,
} from "@/features/layout-system/types/layout";

export type BorderStyle = "single" | "double" | "dashed";

export type BoxCreationMode = "idle" | "drawing" | "resizing";

export type ResizeHandle =
  | "top-left"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left";

export interface TextFormat {
  start: number;
  end: number;
  type: "bold" | "italic" | "code" | "color";
  value?: string;
}

export interface TextContent {
  value: string;
  alignment: "left" | "center" | "right";
  fontSize: "small" | "medium" | "large";
  formatting: TextFormat[];
}

export interface Box {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderStyle: BorderStyle;
  padding: number;
  text: TextContent;
  children: string[];
  parentId?: string;
  artboardId?: string;
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
  name?: string;
  layout?: LayoutConfig;
  layoutChildProps?: BoxLayoutChildProps;
}

export interface BoxState {
  boxes: Box[];
  selectedBoxIds: string[];
  activeBoxId: string | null;
  creationMode: BoxCreationMode;
  resizeHandle: ResizeHandle | null;
  tempBox: Partial<Box> | null;
  clipboardBoxIds: string[];

  addBox: (box: Box) => void;
  updateBox: (id: string, updates: Partial<Box>) => void;
  deleteBox: (id: string) => void;
  deleteBoxes: (ids: string[]) => void;
  selectBox: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setCreationMode: (mode: BoxCreationMode) => void;
  setResizeHandle: (handle: ResizeHandle | null) => void;
  setTempBox: (box: Partial<Box> | null) => void;
  duplicateBoxes: (ids: string[]) => void;
  copyBoxes: () => void;
  pasteBoxes: () => void;
  getBox: (id: string) => Box | undefined;
  getSelectedBoxes: () => Box[];
  resetBoxes: () => void;

  setParent: (childId: string, parentId: string) => void;
  detachFromParent: (childId: string) => void;
  groupBoxes: (boxIds: string[]) => void;
  ungroupBox: (parentId: string) => void;
  updateBoxPosition: (id: string, x: number, y: number) => void;

  alignBoxes: (
    boxIds: string[],
    alignment: import("@/features/alignment/types/alignment").AlignmentType
  ) => void;
  distributeBoxes: (
    boxIds: string[],
    distribution: import("@/features/alignment/types/alignment").DistributionType
  ) => void;

  toggleBoxVisibility: (id: string) => void;
  toggleBoxLock: (id: string) => void;
  updateBoxName: (id: string, name: string) => void;
  reorderBox: (id: string, newZIndex: number) => void;
  moveBoxToFront: (id: string) => void;
  moveBoxToBack: (id: string) => void;
  moveBoxForward: (id: string) => void;
  moveBoxBackward: (id: string) => void;
}

export interface ResizeHandlePosition {
  handle: ResizeHandle;
  x: number;
  y: number;
  cursor: string;
}
