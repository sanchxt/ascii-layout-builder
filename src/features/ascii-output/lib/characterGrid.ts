import type { AsciiGrid, CharCell } from "../types/ascii";
import type { BorderStyle } from "@/types/box";
import { ASCII_CONSTANTS } from "@/lib/constants";

export function createEmptyCell(): CharCell {
  return {
    char: " ",
    zIndex: -1,
    boxId: null,
    borderStyle: null,
    isBorder: false,
    isText: false,
  };
}

export function createGrid(width: number, height: number): AsciiGrid {
  const grid: AsciiGrid = [];

  for (let row = 0; row < height; row++) {
    const rowCells: CharCell[] = [];
    for (let col = 0; col < width; col++) {
      rowCells.push(createEmptyCell());
    }
    grid.push(rowCells);
  }

  return grid;
}

export function isInBounds(grid: AsciiGrid, row: number, col: number): boolean {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
}

export function getCell(
  grid: AsciiGrid,
  row: number,
  col: number
): CharCell | null {
  if (!isInBounds(grid, row, col)) {
    return null;
  }
  return grid[row][col];
}

export function setCell(
  grid: AsciiGrid,
  row: number,
  col: number,
  char: string,
  zIndex: number,
  boxId: string | null = null,
  borderStyle: BorderStyle | null = null,
  isBorder: boolean = false,
  isText: boolean = false
): boolean {
  if (!isInBounds(grid, row, col)) {
    return false;
  }

  const currentCell = grid[row][col];

  if (zIndex >= currentCell.zIndex) {
    grid[row][col] = {
      char,
      zIndex,
      boxId,
      borderStyle,
      isBorder,
      isText,
    };
    return true;
  }

  return false;
}

export function forceSetCell(
  grid: AsciiGrid,
  row: number,
  col: number,
  char: string,
  zIndex?: number,
  boxId?: string | null,
  borderStyle?: BorderStyle | null,
  isBorder?: boolean,
  isText?: boolean
): boolean {
  if (!isInBounds(grid, row, col)) {
    return false;
  }

  const currentCell = grid[row][col];

  grid[row][col] = {
    char,
    zIndex: zIndex ?? currentCell.zIndex,
    boxId: boxId ?? currentCell.boxId,
    borderStyle: borderStyle ?? currentCell.borderStyle,
    isBorder: isBorder ?? currentCell.isBorder,
    isText: isText ?? currentCell.isText,
  };

  return true;
}

export function fillRegion(
  grid: AsciiGrid,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  char: string,
  zIndex: number,
  boxId: string | null = null,
  borderStyle: BorderStyle | null = null,
  isBorder: boolean = false,
  isText: boolean = false
): void {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      setCell(
        grid,
        row,
        col,
        char,
        zIndex,
        boxId,
        borderStyle,
        isBorder,
        isText
      );
    }
  }
}

export function drawHorizontalLine(
  grid: AsciiGrid,
  row: number,
  startCol: number,
  endCol: number,
  char: string,
  zIndex: number,
  boxId: string | null = null,
  borderStyle: BorderStyle | null = null
): void {
  for (let col = startCol; col <= endCol; col++) {
    setCell(grid, row, col, char, zIndex, boxId, borderStyle, true, false);
  }
}

export function drawVerticalLine(
  grid: AsciiGrid,
  col: number,
  startRow: number,
  endRow: number,
  char: string,
  zIndex: number,
  boxId: string | null = null,
  borderStyle: BorderStyle | null = null
): void {
  for (let row = startRow; row <= endRow; row++) {
    setCell(grid, row, col, char, zIndex, boxId, borderStyle, true, false);
  }
}

export function gridToString(grid: AsciiGrid): string {
  const lines: string[] = [];

  for (const row of grid) {
    const line = row.map((cell) => cell.char).join("");
    lines.push(line.trimEnd());
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  return lines.join("\n");
}

export function getGridDimensions(grid: AsciiGrid): {
  width: number;
  height: number;
} {
  return {
    height: grid.length,
    width: grid.length > 0 ? grid[0].length : 0,
  };
}

export function countCharacters(grid: AsciiGrid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.char !== " ") {
        count++;
      }
    }
  }
  return count;
}

export function countLines(grid: AsciiGrid): number {
  let lastNonEmptyRow = -1;

  for (let i = grid.length - 1; i >= 0; i--) {
    const hasContent = grid[i].some((cell) => cell.char !== " ");
    if (hasContent) {
      lastNonEmptyRow = i;
      break;
    }
  }

  return lastNonEmptyRow + 1;
}

export function validateGridSize(grid: AsciiGrid): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const dimensions = getGridDimensions(grid);

  if (dimensions.height > ASCII_CONSTANTS.MAX_OUTPUT_LINES) {
    warnings.push(
      `Grid height (${dimensions.height}) exceeds maximum (${ASCII_CONSTANTS.MAX_OUTPUT_LINES})`
    );
  }

  if (dimensions.width > ASCII_CONSTANTS.MAX_LINE_LENGTH) {
    warnings.push(
      `Grid width (${dimensions.width}) exceeds maximum (${ASCII_CONSTANTS.MAX_LINE_LENGTH})`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
