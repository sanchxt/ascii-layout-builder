import { useCanvasStore } from "../store/canvasStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import {
  getRootBoxes,
  getAbsolutePosition,
} from "@/features/boxes/utils/boxHierarchy";
import { lineIntersectsRect } from "@/features/lines/utils/lineHierarchy";
import type { Box } from "@/types/box";

const rectanglesIntersect = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean => {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
};

export const useSelectionRectangle = () => {
  const {
    interaction,
    startSelectionRect,
    updateSelectionRect,
    clearSelectionRect,
  } = useCanvasStore();

  const boxes = useBoxStore((state) => state.boxes);
  const selectBox = useBoxStore((state) => state.selectBox);
  const clearSelection = useBoxStore((state) => state.clearSelection);

  const lines = useLineStore((state) => state.lines);
  const selectLine = useLineStore((state) => state.selectLine);
  const clearLineSelection = useLineStore((state) => state.clearLineSelection);

  const startSelection = (canvasX: number, canvasY: number) => {
    startSelectionRect(canvasX, canvasY);
  };

  const updateSelection = (canvasX: number, canvasY: number) => {
    if (!interaction.selectionRect) return;
    updateSelectionRect(canvasX, canvasY);
  };

  const finishSelection = (shiftKey: boolean) => {
    if (!interaction.selectionRect) return;

    const { startX, startY, endX, endY } = interaction.selectionRect;

    const selectionLeft = Math.min(startX, endX);
    const selectionTop = Math.min(startY, endY);
    const selectionWidth = Math.abs(endX - startX);
    const selectionHeight = Math.abs(endY - startY);

    const rootBoxes = getRootBoxes(boxes);
    const selectedBoxIds: string[] = [];

    const checkBoxIntersection = (box: Box) => {
      const absolutePos = getAbsolutePosition(box, boxes);

      const boxRect = {
        x: absolutePos.x,
        y: absolutePos.y,
        width: box.width,
        height: box.height,
      };

      const selectionRect = {
        x: selectionLeft,
        y: selectionTop,
        width: selectionWidth,
        height: selectionHeight,
      };

      if (rectanglesIntersect(boxRect, selectionRect)) {
        selectedBoxIds.push(box.id);
      }

      const children = boxes.filter((b) => b.parentId === box.id);
      children.forEach((child) => checkBoxIntersection(child));
    };

    rootBoxes.forEach((box) => checkBoxIntersection(box));

    const selectedLineIds: string[] = [];
    const visibleLines = lines.filter(
      (line) => line.visible !== false && !line.locked
    );

    visibleLines.forEach((line) => {
      if (
        lineIntersectsRect(
          line,
          boxes,
          selectionLeft,
          selectionTop,
          selectionWidth,
          selectionHeight
        )
      ) {
        selectedLineIds.push(line.id);
      }
    });

    const hasBoxSelection = selectedBoxIds.length > 0;
    const hasLineSelection = selectedLineIds.length > 0;
    const hasAnySelection = hasBoxSelection || hasLineSelection;

    if (hasAnySelection) {
      if (shiftKey) {
        selectedBoxIds.forEach((id) => selectBox(id, true));
        selectedLineIds.forEach((id) => selectLine(id, true, true));
      } else {
        clearSelection();
        clearLineSelection();
        selectedBoxIds.forEach((id, index) => selectBox(id, index > 0));
        selectedLineIds.forEach((id, index) => {
          const isMulti = hasBoxSelection || index > 0;
          selectLine(id, isMulti, hasBoxSelection);
        });
      }
    } else if (!shiftKey) {
      clearSelection();
      clearLineSelection();
    }

    clearSelectionRect();
  };

  const cancelSelection = () => {
    clearSelectionRect();
  };

  return {
    selectionRect: interaction.selectionRect,
    startSelection,
    updateSelection,
    finishSelection,
    cancelSelection,
  };
};
