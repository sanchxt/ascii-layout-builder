import type { Box } from "@/types/box";
import type { CharBounds, CharCoord } from "../types/ascii";
import { ASCII_CONSTANTS } from "@/lib/constants";
import { getAncestors } from "@/features/boxes/utils/boxHierarchy";

/**
 * ASCII border width in characters. ASCII borders are always 1 character wide
 * regardless of the pixel-based border style (single: 2px, double: 4px, dashed: 2px).
 */
const ASCII_BORDER_WIDTH_CHARS = 1;

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

/**
 * Calculate ASCII-specific absolute position for a box.
 *
 * Unlike getAbsolutePosition() which uses pixel-based border widths,
 * this function uses 1 character for each ancestor's border since
 * ASCII borders are always 1 character wide regardless of pixel style.
 *
 * This prevents nested boxes from appearing offset when converted to ASCII.
 */
function getAsciiAbsoluteCharPosition(
  box: Box,
  allBoxes: Box[],
  charWidthRatio: number,
  charHeightRatio: number
): { col: number; row: number } {
  // Convert box's own position to characters
  let col = pixelToCharCol(box.x, charWidthRatio);
  let row = pixelToCharRow(box.y, charHeightRatio);

  if (!box.parentId) {
    return { col, row };
  }

  // Walk up the parent chain
  const ancestors = getAncestors(box.id, allBoxes);

  for (const ancestor of ancestors.reverse()) {
    // Convert ancestor's position to characters
    const ancestorCol = pixelToCharCol(ancestor.x, charWidthRatio);
    const ancestorRow = pixelToCharRow(ancestor.y, charHeightRatio);

    // Convert ancestor's padding to characters
    const paddingCols = pixelToCharCol(ancestor.padding, charWidthRatio);
    const paddingRows = pixelToCharRow(ancestor.padding, charHeightRatio);

    // Add ancestor position + ASCII border (1 char) + padding in chars
    col += ancestorCol + ASCII_BORDER_WIDTH_CHARS + paddingCols;
    row += ancestorRow + ASCII_BORDER_WIDTH_CHARS + paddingRows;
  }

  return { col, row };
}

export function getBoxCharBounds(
  box: Box,
  allBoxes: Box[],
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): CharBounds {
  // Use ASCII-specific position calculation for nested boxes
  // This ensures border widths are 1 char (not pixel-based conversion)
  const absCharPos = getAsciiAbsoluteCharPosition(
    box,
    allBoxes,
    charWidthRatio,
    charHeightRatio
  );

  const widthChars = pixelToCharCol(box.width, charWidthRatio);
  const heightChars = pixelToCharRow(box.height, charHeightRatio);

  return {
    startCol: absCharPos.col,
    startRow: absCharPos.row,
    endCol: absCharPos.col + widthChars,
    endRow: absCharPos.row + heightChars,
    width: widthChars,
    height: heightChars,
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

/**
 * Minimum character dimensions for a box to render with borders.
 * A box needs at least 3x3 characters to show all 4 corners.
 */
const MIN_RENDERABLE_CHARS_WIDTH = 3;
const MIN_RENDERABLE_CHARS_HEIGHT = 3;

/**
 * Calculate adaptive character ratios that ensure all boxes can be rendered.
 * Returns ratios that make the smallest box at least 3x3 characters.
 */
export function calculateAdaptiveRatios(
  boxes: Box[],
  defaultWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  defaultHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): { charWidthRatio: number; charHeightRatio: number } {
  if (boxes.length === 0) {
    return {
      charWidthRatio: defaultWidthRatio,
      charHeightRatio: defaultHeightRatio,
    };
  }

  // Find the smallest box dimensions
  let minWidth = Infinity;
  let minHeight = Infinity;

  for (const box of boxes) {
    if (box.visible === false) continue;
    minWidth = Math.min(minWidth, box.width);
    minHeight = Math.min(minHeight, box.height);
  }

  // If no visible boxes, use defaults
  if (minWidth === Infinity) {
    return {
      charWidthRatio: defaultWidthRatio,
      charHeightRatio: defaultHeightRatio,
    };
  }

  // Calculate the ratio needed for the smallest box to be at least MIN_RENDERABLE_CHARS
  // ratio = pixels / chars, so smaller ratio = more chars per pixel
  const neededWidthRatio = minWidth / MIN_RENDERABLE_CHARS_WIDTH;
  const neededHeightRatio = minHeight / MIN_RENDERABLE_CHARS_HEIGHT;

  // Use the minimum of default and needed ratios
  // We never scale UP (larger ratio), only scale DOWN if needed
  // Also enforce a minimum ratio of 1 to prevent excessively large output
  const charWidthRatio = Math.max(1, Math.min(defaultWidthRatio, neededWidthRatio));
  const charHeightRatio = Math.max(1, Math.min(defaultHeightRatio, neededHeightRatio));

  return { charWidthRatio, charHeightRatio };
}

/**
 * Check if a box can render with borders (minimum 3x3 characters)
 */
export function canRenderWithBorders(
  box: Box,
  allBoxes: Box[],
  charWidthRatio: number,
  charHeightRatio: number
): boolean {
  const bounds = getBoxCharBounds(box, allBoxes, charWidthRatio, charHeightRatio);
  return bounds.width >= MIN_RENDERABLE_CHARS_WIDTH && bounds.height >= MIN_RENDERABLE_CHARS_HEIGHT;
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
