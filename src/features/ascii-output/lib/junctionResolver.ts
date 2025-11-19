import type { AsciiGrid, NeighborAnalysis } from "../types/ascii";
import { JunctionType } from "../types/ascii";
import { getCell, forceSetCell } from "./characterGrid";
import {
  getJunctionChar,
  getDominantBorderStyle,
} from "../constants/boxDrawing";

function isBorderChar(char: string): boolean {
  const borderChars = [
    "─",
    "│",
    "┌",
    "┐",
    "└",
    "┘",
    "├",
    "┤",
    "┬",
    "┴",
    "┼",
    "═",
    "║",
    "╔",
    "╗",
    "╚",
    "╝",
    "╠",
    "╣",
    "╦",
    "╩",
    "╬",
    "┄",
    "┊",
  ];
  return borderChars.includes(char);
}

export function analyzeNeighbors(
  grid: AsciiGrid,
  row: number,
  col: number
): NeighborAnalysis {
  const top = getCell(grid, row - 1, col);
  const bottom = getCell(grid, row + 1, col);
  const left = getCell(grid, row, col - 1);
  const right = getCell(grid, row, col + 1);

  return {
    hasTop: top !== null && top.isBorder && isBorderChar(top.char),
    hasBottom: bottom !== null && bottom.isBorder && isBorderChar(bottom.char),
    hasLeft: left !== null && left.isBorder && isBorderChar(left.char),
    hasRight: right !== null && right.isBorder && isBorderChar(right.char),
    topStyle: top?.borderStyle ?? null,
    bottomStyle: bottom?.borderStyle ?? null,
    leftStyle: left?.borderStyle ?? null,
    rightStyle: right?.borderStyle ?? null,
  };
}

export function determineJunctionType(
  neighbors: NeighborAnalysis
): JunctionType {
  const { hasTop, hasBottom, hasLeft, hasRight } = neighbors;

  const connectionCount =
    (hasTop ? 1 : 0) +
    (hasBottom ? 1 : 0) +
    (hasLeft ? 1 : 0) +
    (hasRight ? 1 : 0);

  if (connectionCount <= 1) {
    return JunctionType.NONE;
  }

  if (hasTop && hasBottom && hasLeft && hasRight) {
    return JunctionType.CROSS;
  }

  if (hasTop && hasBottom && hasLeft && !hasRight) {
    return JunctionType.T_LEFT;
  }
  if (hasTop && hasBottom && !hasLeft && hasRight) {
    return JunctionType.T_RIGHT;
  }
  if (hasTop && !hasBottom && hasLeft && hasRight) {
    return JunctionType.T_UP;
  }
  if (!hasTop && hasBottom && hasLeft && hasRight) {
    return JunctionType.T_DOWN;
  }

  if (!hasTop && hasBottom && !hasLeft && hasRight) {
    return JunctionType.CORNER_TOP_LEFT;
  }
  if (!hasTop && hasBottom && hasLeft && !hasRight) {
    return JunctionType.CORNER_TOP_RIGHT;
  }
  if (hasTop && !hasBottom && !hasLeft && hasRight) {
    return JunctionType.CORNER_BOTTOM_LEFT;
  }
  if (hasTop && !hasBottom && hasLeft && !hasRight) {
    return JunctionType.CORNER_BOTTOM_RIGHT;
  }

  if (hasTop && hasBottom && !hasLeft && !hasRight) {
    return JunctionType.VERTICAL;
  }
  if (!hasTop && !hasBottom && hasLeft && hasRight) {
    return JunctionType.HORIZONTAL;
  }

  return JunctionType.NONE;
}

export function resolveJunction(
  grid: AsciiGrid,
  row: number,
  col: number
): void {
  const currentCell = getCell(grid, row, col);

  if (!currentCell || !currentCell.isBorder) {
    return;
  }

  const neighbors = analyzeNeighbors(grid, row, col);
  const junctionType = determineJunctionType(neighbors);

  if (junctionType === JunctionType.NONE) {
    return;
  }

  const styles = [
    neighbors.topStyle,
    neighbors.bottomStyle,
    neighbors.leftStyle,
    neighbors.rightStyle,
    currentCell.borderStyle,
  ];
  const dominantStyle = getDominantBorderStyle(styles);

  const junctionChar = getJunctionChar(junctionType, dominantStyle);

  forceSetCell(
    grid,
    row,
    col,
    junctionChar,
    currentCell.zIndex,
    currentCell.boxId,
    dominantStyle,
    true,
    false
  );
}

export function resolveAllJunctions(grid: AsciiGrid): void {
  const height = grid.length;
  const width = height > 0 ? grid[0].length : 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      resolveJunction(grid, row, col);
    }
  }
}

export function resolveJunctionsInRegion(
  grid: AsciiGrid,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): void {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      resolveJunction(grid, row, col);
    }
  }
}
