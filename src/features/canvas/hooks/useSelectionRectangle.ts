import { useCanvasStore } from "../store/canvasStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import {
  getRootBoxes,
  getAbsolutePosition,
} from "@/features/boxes/utils/boxHierarchy";
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

    if (selectedBoxIds.length > 0) {
      if (shiftKey) {
        selectedBoxIds.forEach((id) => selectBox(id, true));
      } else {
        clearSelection();
        selectedBoxIds.forEach((id, index) => selectBox(id, index > 0));
      }
    } else if (!shiftKey) {
      clearSelection();
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
