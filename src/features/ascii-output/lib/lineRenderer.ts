import type { Line, ArrowHeadStyle, LineDirection } from "@/types/line";
import type { AsciiGrid } from "../types/ascii";
import { drawHorizontalLine, drawVerticalLine, setCell } from "./characterGrid";
import { ASCII_CONSTANTS } from "@/lib/constants";

export const LINE_ASCII_CHARS = {
  // horizontal lines
  horizontal: {
    solid: "─",
    dashed: "-",
    dotted: "·",
  },
  // vertical lines
  vertical: {
    solid: "│",
    dashed: "¦",
    dotted: ":",
  },
  // arrows
  arrows: {
    simple: {
      left: "←",
      right: "→",
      up: "↑",
      down: "↓",
    },
    filled: {
      left: "◀",
      right: "▶",
      up: "▲",
      down: "▼",
    },
  },
} as const;

function getLineChar(
  direction: LineDirection,
  style: "solid" | "dashed" | "dotted"
): string {
  return LINE_ASCII_CHARS[direction][style];
}

function getArrowChar(
  direction: "left" | "right" | "up" | "down",
  style: ArrowHeadStyle
): string | null {
  if (style === "none") return null;
  return LINE_ASCII_CHARS.arrows[style][direction];
}

function pixelToGrid(
  px: number,
  py: number,
  charWidthRatio: number,
  charHeightRatio: number,
  offsetCol: number,
  offsetRow: number
): { col: number; row: number } {
  const col = Math.round(px / charWidthRatio) - offsetCol;
  const row = Math.round(py / charHeightRatio) - offsetRow;
  return { col, row };
}

export function renderLine(
  grid: AsciiGrid,
  line: Line,
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO,
  offsetCol: number = 0,
  offsetRow: number = 0
): void {
  if (line.outputMode !== "ascii") return;
  if (line.visible === false) return;

  const start = pixelToGrid(
    line.startX,
    line.startY,
    charWidthRatio,
    charHeightRatio,
    offsetCol,
    offsetRow
  );
  const end = pixelToGrid(
    line.endX,
    line.endY,
    charWidthRatio,
    charHeightRatio,
    offsetCol,
    offsetRow
  );

  const lineChar = getLineChar(line.direction, line.lineStyle);

  if (line.direction === "horizontal") {
    const leftCol = Math.min(start.col, end.col);
    const rightCol = Math.max(start.col, end.col);
    const row = start.row;

    drawHorizontalLine(
      grid,
      row,
      leftCol,
      rightCol,
      lineChar,
      line.zIndex,
      line.id,
      null
    );

    const isStartLeft = start.col <= end.col;

    const startArrowDir = isStartLeft ? "left" : "right";
    const startArrowChar = getArrowChar(startArrowDir, line.startArrow);
    if (startArrowChar) {
      setCell(
        grid,
        row,
        start.col,
        startArrowChar,
        line.zIndex + 1,
        line.id,
        null,
        false,
        false
      );
    }

    const endArrowDir = isStartLeft ? "right" : "left";
    const endArrowChar = getArrowChar(endArrowDir, line.endArrow);
    if (endArrowChar) {
      setCell(
        grid,
        row,
        end.col,
        endArrowChar,
        line.zIndex + 1,
        line.id,
        null,
        false,
        false
      );
    }
  } else {
    const topRow = Math.min(start.row, end.row);
    const bottomRow = Math.max(start.row, end.row);
    const col = start.col;

    drawVerticalLine(
      grid,
      col,
      topRow,
      bottomRow,
      lineChar,
      line.zIndex,
      line.id,
      null
    );

    const isStartTop = start.row <= end.row;

    const startArrowDir = isStartTop ? "up" : "down";
    const startArrowChar = getArrowChar(startArrowDir, line.startArrow);
    if (startArrowChar) {
      setCell(
        grid,
        start.row,
        col,
        startArrowChar,
        line.zIndex + 1,
        line.id,
        null,
        false,
        false
      );
    }

    const endArrowDir = isStartTop ? "down" : "up";
    const endArrowChar = getArrowChar(endArrowDir, line.endArrow);
    if (endArrowChar) {
      setCell(
        grid,
        end.row,
        col,
        endArrowChar,
        line.zIndex + 1,
        line.id,
        null,
        false,
        false
      );
    }
  }

  if (line.label?.text) {
    renderLineLabel(grid, line, start, end, line.zIndex + 1);
  }
}

function renderLineLabel(
  grid: AsciiGrid,
  line: Line,
  start: { col: number; row: number },
  end: { col: number; row: number },
  zIndex: number
): void {
  if (!line.label?.text) return;

  const text = line.label.text;
  const position = line.label.position || "middle";

  let labelCol: number;
  let labelRow: number;

  if (line.direction === "horizontal") {
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    labelRow = start.row;

    switch (position) {
      case "start":
        labelCol = start.col + 1;
        break;
      case "end":
        labelCol = end.col - text.length;
        break;
      case "middle":
      default:
        labelCol = Math.floor((minCol + maxCol - text.length) / 2);
        break;
    }
  } else {
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    labelCol = start.col + 1;

    switch (position) {
      case "start":
        labelRow = start.row;
        break;
      case "end":
        labelRow = end.row;
        break;
      case "middle":
      default:
        labelRow = Math.floor((minRow + maxRow) / 2);
        break;
    }
  }

  for (let i = 0; i < text.length; i++) {
    setCell(
      grid,
      labelRow,
      labelCol + i,
      text[i],
      zIndex,
      line.id,
      null,
      false,
      true
    );
  }
}

export function renderAllLines(
  grid: AsciiGrid,
  lines: Line[],
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO,
  offsetCol: number = 0,
  offsetRow: number = 0
): void {
  const sortedLines = [...lines].sort((a, b) => a.zIndex - b.zIndex);

  for (const line of sortedLines) {
    renderLine(
      grid,
      line,
      charWidthRatio,
      charHeightRatio,
      offsetCol,
      offsetRow
    );
  }
}

export function getLinesBounds(
  lines: Line[],
  charWidthRatio: number = ASCII_CONSTANTS.CHAR_WIDTH_RATIO,
  charHeightRatio: number = ASCII_CONSTANTS.CHAR_HEIGHT_RATIO
): {
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
  width: number;
  height: number;
} {
  if (lines.length === 0) {
    return { minCol: 0, maxCol: 0, minRow: 0, maxRow: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const line of lines) {
    minX = Math.min(minX, line.startX, line.endX);
    maxX = Math.max(maxX, line.startX, line.endX);
    minY = Math.min(minY, line.startY, line.endY);
    maxY = Math.max(maxY, line.startY, line.endY);
  }

  const minCol = Math.floor(minX / charWidthRatio);
  const maxCol = Math.ceil(maxX / charWidthRatio);
  const minRow = Math.floor(minY / charHeightRatio);
  const maxRow = Math.ceil(maxY / charHeightRatio);

  return {
    minCol,
    maxCol,
    minRow,
    maxRow,
    width: maxCol - minCol + 1,
    height: maxRow - minRow + 1,
  };
}
