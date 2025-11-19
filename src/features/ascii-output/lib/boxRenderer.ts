import type { Box } from "@/types/box";
import type { AsciiGrid, CharBounds } from "../types/ascii";
import { setCell, drawHorizontalLine, drawVerticalLine } from "./characterGrid";
import { getCornerChar, getEdgeChar } from "../constants/boxDrawing";

export function renderBoxBorder(
  grid: AsciiGrid,
  box: Box,
  bounds: CharBounds
): void {
  const { startRow, startCol, endRow, endCol } = bounds;
  const { borderStyle, zIndex, id } = box;

  if (bounds.width < 3 || bounds.height < 3) {
    return;
  }

  const horizontal = getEdgeChar("horizontal", borderStyle);
  const vertical = getEdgeChar("vertical", borderStyle);
  const topLeft = getCornerChar("top-left", borderStyle);
  const topRight = getCornerChar("top-right", borderStyle);
  const bottomLeft = getCornerChar("bottom-left", borderStyle);
  const bottomRight = getCornerChar("bottom-right", borderStyle);

  setCell(
    grid,
    startRow,
    startCol,
    topLeft,
    zIndex,
    id,
    borderStyle,
    true,
    false
  );
  setCell(
    grid,
    startRow,
    endCol,
    topRight,
    zIndex,
    id,
    borderStyle,
    true,
    false
  );
  setCell(
    grid,
    endRow,
    startCol,
    bottomLeft,
    zIndex,
    id,
    borderStyle,
    true,
    false
  );
  setCell(
    grid,
    endRow,
    endCol,
    bottomRight,
    zIndex,
    id,
    borderStyle,
    true,
    false
  );

  if (endCol - startCol > 1) {
    drawHorizontalLine(
      grid,
      startRow,
      startCol + 1,
      endCol - 1,
      horizontal,
      zIndex,
      id,
      borderStyle
    );
    drawHorizontalLine(
      grid,
      endRow,
      startCol + 1,
      endCol - 1,
      horizontal,
      zIndex,
      id,
      borderStyle
    );
  }

  if (endRow - startRow > 1) {
    drawVerticalLine(
      grid,
      startCol,
      startRow + 1,
      endRow - 1,
      vertical,
      zIndex,
      id,
      borderStyle
    );
    drawVerticalLine(
      grid,
      endCol,
      startRow + 1,
      endRow - 1,
      vertical,
      zIndex,
      id,
      borderStyle
    );
  }
}

export function renderBoxes(
  grid: AsciiGrid,
  boxes: Box[],
  getBounds: (box: Box) => CharBounds
): void {
  const sortedBoxes = [...boxes].sort((a, b) => a.zIndex - b.zIndex);

  for (const box of sortedBoxes) {
    const bounds = getBounds(box);
    renderBoxBorder(grid, box, bounds);
  }
}
