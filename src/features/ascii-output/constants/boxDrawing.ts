import type { BorderStyle } from "@/types/box";
import { JunctionType } from "../types/ascii";

export const SINGLE_LINE = {
  HORIZONTAL: "─",
  VERTICAL: "│",
  CORNER_TOP_LEFT: "┌",
  CORNER_TOP_RIGHT: "┐",
  CORNER_BOTTOM_LEFT: "└",
  CORNER_BOTTOM_RIGHT: "┘",
  T_DOWN: "┬",
  T_UP: "┴",
  T_RIGHT: "├",
  T_LEFT: "┤",
  CROSS: "┼",
} as const;

export const DOUBLE_LINE = {
  HORIZONTAL: "═",
  VERTICAL: "║",
  CORNER_TOP_LEFT: "╔",
  CORNER_TOP_RIGHT: "╗",
  CORNER_BOTTOM_LEFT: "╚",
  CORNER_BOTTOM_RIGHT: "╝",
  T_DOWN: "╦",
  T_UP: "╩",
  T_RIGHT: "╠",
  T_LEFT: "╣",
  CROSS: "╬",
} as const;

export const DASHED_LINE = {
  HORIZONTAL: "┄",
  VERTICAL: "┊",
  CORNER_TOP_LEFT: "┌",
  CORNER_TOP_RIGHT: "┐",
  CORNER_BOTTOM_LEFT: "└",
  CORNER_BOTTOM_RIGHT: "┘",
  T_DOWN: "┬",
  T_UP: "┴",
  T_RIGHT: "├",
  T_LEFT: "┤",
  CROSS: "┼",
} as const;

export function getCharacterSet(borderStyle: BorderStyle) {
  switch (borderStyle) {
    case "single":
      return SINGLE_LINE;
    case "double":
      return DOUBLE_LINE;
    case "dashed":
      return DASHED_LINE;
    default:
      return SINGLE_LINE;
  }
}

export function getJunctionChar(
  junctionType: JunctionType,
  borderStyle: BorderStyle
): string {
  const charset = getCharacterSet(borderStyle);

  switch (junctionType) {
    case JunctionType.HORIZONTAL:
      return charset.HORIZONTAL;
    case JunctionType.VERTICAL:
      return charset.VERTICAL;
    case JunctionType.CORNER_TOP_LEFT:
      return charset.CORNER_TOP_LEFT;
    case JunctionType.CORNER_TOP_RIGHT:
      return charset.CORNER_TOP_RIGHT;
    case JunctionType.CORNER_BOTTOM_LEFT:
      return charset.CORNER_BOTTOM_LEFT;
    case JunctionType.CORNER_BOTTOM_RIGHT:
      return charset.CORNER_BOTTOM_RIGHT;
    case JunctionType.T_DOWN:
      return charset.T_DOWN;
    case JunctionType.T_UP:
      return charset.T_UP;
    case JunctionType.T_RIGHT:
      return charset.T_RIGHT;
    case JunctionType.T_LEFT:
      return charset.T_LEFT;
    case JunctionType.CROSS:
      return charset.CROSS;
    case JunctionType.NONE:
      return " ";
    default:
      return " ";
  }
}

export function getCornerChar(
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right",
  borderStyle: BorderStyle
): string {
  const charset = getCharacterSet(borderStyle);

  switch (position) {
    case "top-left":
      return charset.CORNER_TOP_LEFT;
    case "top-right":
      return charset.CORNER_TOP_RIGHT;
    case "bottom-left":
      return charset.CORNER_BOTTOM_LEFT;
    case "bottom-right":
      return charset.CORNER_BOTTOM_RIGHT;
  }
}

export function getEdgeChar(
  orientation: "horizontal" | "vertical",
  borderStyle: BorderStyle
): string {
  const charset = getCharacterSet(borderStyle);
  return orientation === "horizontal" ? charset.HORIZONTAL : charset.VERTICAL;
}

export const BORDER_STYLE_PRIORITY: Record<BorderStyle, number> = {
  double: 3,
  single: 2,
  dashed: 1,
};

export function getDominantBorderStyle(
  styles: (BorderStyle | null)[]
): BorderStyle {
  const validStyles = styles.filter((s): s is BorderStyle => s !== null);

  if (validStyles.length === 0) {
    return "single";
  }

  return validStyles.reduce((dominant, current) => {
    return BORDER_STYLE_PRIORITY[current] > BORDER_STYLE_PRIORITY[dominant]
      ? current
      : dominant;
  });
}
