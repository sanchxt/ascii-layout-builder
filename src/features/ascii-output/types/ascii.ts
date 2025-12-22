import type { BorderStyle } from "@/types/box";

export interface CharCell {
  char: string;
  zIndex: number;
  boxId: string | null;
  borderStyle: BorderStyle | null;
  isBorder: boolean;
  isText: boolean;
}

export type AsciiGrid = CharCell[][];

export interface CharCoord {
  row: number;
  col: number;
}

export interface CharBounds {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  width: number;
  height: number;
}

export type JunctionType =
  | "none"
  | "horizontal"
  | "vertical"
  | "corner_top_left"
  | "corner_top_right"
  | "corner_bottom_left"
  | "corner_bottom_right"
  | "t_down"
  | "t_up"
  | "t_right"
  | "t_left"
  | "cross";

export const JunctionType = {
  NONE: "none" as const,
  HORIZONTAL: "horizontal" as const,
  VERTICAL: "vertical" as const,
  CORNER_TOP_LEFT: "corner_top_left" as const,
  CORNER_TOP_RIGHT: "corner_top_right" as const,
  CORNER_BOTTOM_LEFT: "corner_bottom_left" as const,
  CORNER_BOTTOM_RIGHT: "corner_bottom_right" as const,
  T_DOWN: "t_down" as const, // ┬
  T_UP: "t_up" as const, // ┴
  T_RIGHT: "t_right" as const, // ├
  T_LEFT: "t_left" as const, // ┤
  CROSS: "cross" as const, // ┼
};

export interface AsciiGenerationOptions {
  charWidthRatio?: number;
  charHeightRatio?: number;
  minBoxCharsWidth?: number;
  minBoxCharsHeight?: number;
  includeMetadata?: boolean;
  showOverlapWarnings?: boolean;
}

export interface AsciiOutput {
  content: string;
  characterCount: number;
  lineCount: number;
  dimensions: {
    width: number;
    height: number;
  };
  boxCount: number;
  warnings: string[];
  timestamp: Date;
}

export interface NeighborAnalysis {
  hasTop: boolean;
  hasBottom: boolean;
  hasLeft: boolean;
  hasRight: boolean;
  topStyle: BorderStyle | null;
  bottomStyle: BorderStyle | null;
  leftStyle: BorderStyle | null;
  rightStyle: BorderStyle | null;
}

// Minimap types for canvas overview visualization

export interface MinimapBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface MinimapElement {
  id: string;
  type: "box" | "line" | "artboard";
  x: number;
  y: number;
  width: number;
  height: number;
  // For lines
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  // Visual properties
  color: string;
  isSelected?: boolean;
  isNested?: boolean;
}

export interface MinimapViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MinimapData {
  elements: MinimapElement[];
  bounds: MinimapBounds;
  viewport: MinimapViewport;
  scale: number;
}
