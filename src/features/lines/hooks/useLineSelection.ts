import { useCallback } from "react";
import { useLineStore } from "../store/lineStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import type { Line } from "@/types/line";
import { isPointNearLine, lineIntersectsRect } from "../utils/lineGeometry";

export const useLineSelection = () => {
  const lines = useLineStore((state) => state.lines);
  const selectedLineIds = useLineStore((state) => state.selectedLineIds);
  const selectLine = useLineStore((state) => state.selectLine);
  const clearLineSelection = useLineStore((state) => state.clearLineSelection);
  const clearBoxSelection = useBoxStore((state) => state.clearSelection);

  const isLineSelected = useCallback(
    (lineId: string) => {
      return selectedLineIds.includes(lineId);
    },
    [selectedLineIds]
  );

  const getLineAtPoint = useCallback(
    (x: number, y: number): Line | undefined => {
      const sortedLines = [...lines].sort((a, b) => b.zIndex - a.zIndex);

      for (const line of sortedLines) {
        if (line.visible === false || line.locked) continue;

        if (isPointNearLine(x, y, line)) {
          return line;
        }
      }

      return undefined;
    },
    [lines]
  );

  const handleLineClick = useCallback(
    (x: number, y: number, shiftKey: boolean = false): boolean => {
      const clickedLine = getLineAtPoint(x, y);

      if (clickedLine) {
        clearBoxSelection();
        selectLine(clickedLine.id, shiftKey);
        return true;
      }

      return false;
    },
    [getLineAtPoint, selectLine, clearBoxSelection]
  );

  const selectLinesInRect = useCallback(
    (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      addToSelection: boolean = false
    ) => {
      const rectX = Math.min(startX, endX);
      const rectY = Math.min(startY, endY);
      const rectWidth = Math.abs(endX - startX);
      const rectHeight = Math.abs(endY - startY);

      const linesInRect = lines.filter((line) => {
        if (line.visible === false) return false;
        return lineIntersectsRect(line, rectX, rectY, rectWidth, rectHeight);
      });

      if (linesInRect.length > 0) {
        clearBoxSelection();

        if (addToSelection) {
          linesInRect.forEach((line) => {
            if (!selectedLineIds.includes(line.id)) {
              selectLine(line.id, true);
            }
          });
        } else {
          clearLineSelection();
          linesInRect.forEach((line, index) => {
            selectLine(line.id, index > 0);
          });
        }
      }

      return linesInRect.length;
    },
    [lines, selectedLineIds, selectLine, clearLineSelection, clearBoxSelection]
  );

  const getSelectedLines = useCallback(() => {
    return lines.filter((line) => selectedLineIds.includes(line.id));
  }, [lines, selectedLineIds]);

  return {
    isLineSelected,
    getLineAtPoint,
    handleLineClick,
    selectLinesInRect,
    getSelectedLines,
    selectedLineIds,
  };
};
