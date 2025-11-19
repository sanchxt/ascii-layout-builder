import type { Box } from "@/types/box";
import type { CharBounds, CharCoord } from "../types/ascii";
import { ASCII_CONSTANTS } from "@/lib/constants";
import { getAbsolutePosition } from "@/features/boxes/utils/boxHierarchy";

export function pixelToCharCol(
  px: number,
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO
): number {
  return Math.floor(px / charWidthRatio);
}

export function pixelToCharRow(
  py: number,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): number {
  return Math.floor(py / charHeightRatio);
}

export function pixelToChar(
  px: number,
  py: number,
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): CharCoord {
  return {
    col: pixelToCharCol(px, charWidthRatio),
    row: pixelToCharRow(py, charHeightRatio),
  };
}

export function charToPixelX(
  col: number,
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO
): number {
  return col * charWidthRatio;
}

export function charToPixelY(
  row: number,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): number {
  return row * charHeightRatio;
}

export function charToPixel(
  coord: CharCoord,
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): { x: number; y: number } {
  return {
    x: charToPixelX(coord.col, charWidthRatio),
    y: charToPixelY(coord.row, charHeightRatio),
  };
}

export function getBoxCharBounds(
  box: Box,
  allBoxes: Box[],
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): CharBounds {
  const absolutePos = getAbsolutePosition(box, allBoxes);

  const startCol = pixelToCharCol(absolutePos.x, charWidthRatio);
  const startRow = pixelToCharRow(absolutePos.y, charHeightRatio);
  const endCol = pixelToCharCol(absolutePos.x + box.width, charWidthRatio);
  const endRow = pixelToCharRow(absolutePos.y + box.height, charHeightRatio);

  return {
    startCol,
    startRow,
    endCol,
    endRow,
    width: endCol - startCol,
    height: endRow - startRow,
  };
}

export function calculateCanvasBounds(
  boxes: Box[],
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): { minCol: number; minRow: number; maxCol: number; maxRow: number } {
  if (boxes.length === 0) {
    return { minCol: 0, minRow: 0, maxCol: 0, maxRow: 0 };
  }

  let minCol = Infinity;
  let minRow = Infinity;
  let maxCol = -Infinity;
  let maxRow = -Infinity;

  for (const box of boxes) {
    const bounds = getBoxCharBounds(
      box,
      boxes,
      charWidthRatio,
      charHeightRatio
    );
    minCol = Math.min(minCol, bounds.startCol);
    minRow = Math.min(minRow, bounds.startRow);
    maxCol = Math.max(maxCol, bounds.endCol);
    maxRow = Math.max(maxRow, bounds.endRow);
  }

  return { minCol, minRow, maxCol, maxRow };
}

export function calculateGridDimensions(
  boxes: Box[],
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): { width: number; height: number; offsetCol: number; offsetRow: number } {
  if (boxes.length === 0) {
    return { width: 0, height: 0, offsetCol: 0, offsetRow: 0 };
  }

  const bounds = calculateCanvasBounds(boxes, charWidthRatio, charHeightRatio);

  const width = bounds.maxCol - bounds.minCol + 2;
  const height = bounds.maxRow - bounds.minRow + 2;

  return {
    width,
    height,
    offsetCol: bounds.minCol,
    offsetRow: bounds.minRow,
  };
}

export function meetsMinimumCharDimensions(
  box: Box,
  allBoxes: Box[],
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): boolean {
  const bounds = getBoxCharBounds(
    box,
    allBoxes,
    charWidthRatio,
    charHeightRatio
  );

  return (
    bounds.width >= ASCII_CONSTANTS.MIN_BOX_CHARS_WIDTH &&
    bounds.height >= ASCII_CONSTANTS.MIN_BOX_CHARS_HEIGHT
  );
}

export function getBoxContentBounds(
  box: Box,
  allBoxes: Box[],
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): CharBounds {
  const bounds = getBoxCharBounds(
    box,
    allBoxes,
    charWidthRatio,
    charHeightRatio
  );

  const padding = ASCII_CONSTANTS.TEXT_PADDING_CHARS;

  return {
    startCol: bounds.startCol + 1 + padding,
    startRow: bounds.startRow + 1 + padding,
    endCol: bounds.endCol - 1 - padding,
    endRow: bounds.endRow - 1 - padding,
    width: Math.max(0, bounds.width - 2 - padding * 2),
    height: Math.max(0, bounds.height - 2 - padding * 2),
  };
}
