import type { Box } from "@/types/box";
import type { AsciiGrid, CharBounds } from "../types/ascii";
import { setCell } from "./characterGrid";
import { formatTextContent, truncateLines } from "../utils/textFormatter";

export function renderTextContent(
  grid: AsciiGrid,
  box: Box,
  contentBounds: CharBounds
): void {
  const { text, zIndex, id } = box;

  if (!text || !text.value || text.value.trim() === "") {
    return;
  }

  if (contentBounds.width <= 0 || contentBounds.height <= 0) {
    return;
  }

  const formattedLines = formatTextContent(text, contentBounds.width);

  const linesToRender = truncateLines(formattedLines, contentBounds.height);

  for (let i = 0; i < linesToRender.length; i++) {
    const line = linesToRender[i];
    const row = contentBounds.startRow + i;

    if (row > contentBounds.endRow) {
      break;
    }

    for (let j = 0; j < line.length && j < contentBounds.width; j++) {
      const col = contentBounds.startCol + j;
      const char = line[j];

      setCell(grid, row, col, char, zIndex, id, null, false, true);
    }
  }
}

export function calculateVerticalCenterOffset(
  lineCount: number,
  availableHeight: number
): number {
  if (lineCount >= availableHeight) {
    return 0;
  }

  return Math.floor((availableHeight - lineCount) / 2);
}

export function renderTextContentCentered(
  grid: AsciiGrid,
  box: Box,
  contentBounds: CharBounds,
  verticallyCenter: boolean = false
): void {
  const { text, zIndex, id } = box;

  if (!text || !text.value || text.value.trim() === "") {
    return;
  }

  if (contentBounds.width <= 0 || contentBounds.height <= 0) {
    return;
  }

  const formattedLines = formatTextContent(text, contentBounds.width);
  const linesToRender = truncateLines(formattedLines, contentBounds.height);

  const verticalOffset = verticallyCenter
    ? calculateVerticalCenterOffset(linesToRender.length, contentBounds.height)
    : 0;

  for (let i = 0; i < linesToRender.length; i++) {
    const line = linesToRender[i];
    const row = contentBounds.startRow + verticalOffset + i;

    if (row > contentBounds.endRow) {
      break;
    }

    for (let j = 0; j < line.length && j < contentBounds.width; j++) {
      const col = contentBounds.startCol + j;
      const char = line[j];

      setCell(grid, row, col, char, zIndex, id, null, false, true);
    }
  }
}
