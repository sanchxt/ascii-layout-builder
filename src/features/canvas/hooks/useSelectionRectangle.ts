import { useCanvasStore } from "../store/canvasStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
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

  const artboards = useArtboardStore((state) => state.artboards);
  const selectArtboard = useArtboardStore((state) => state.selectArtboard);
  const clearArtboardSelection = useArtboardStore(
    (state) => state.clearSelection
  );

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

    // Check artboard intersections
    const selectedArtboardIds: string[] = [];
    const visibleArtboards = artboards.filter((ab) => ab.visible && !ab.locked);

    visibleArtboards.forEach((artboard) => {
      const artboardRect = {
        x: artboard.x,
        y: artboard.y,
        width: artboard.width,
        height: artboard.height,
      };

      const selectionRect = {
        x: selectionLeft,
        y: selectionTop,
        width: selectionWidth,
        height: selectionHeight,
      };

      if (rectanglesIntersect(artboardRect, selectionRect)) {
        selectedArtboardIds.push(artboard.id);
      }
    });

    const hasBoxSelection = selectedBoxIds.length > 0;
    const hasLineSelection = selectedLineIds.length > 0;
    const hasArtboardSelection = selectedArtboardIds.length > 0;
    const hasAnySelection =
      hasBoxSelection || hasLineSelection || hasArtboardSelection;

    if (hasAnySelection) {
      if (shiftKey) {
        selectedBoxIds.forEach((id) => selectBox(id, true));
        selectedLineIds.forEach((id) => selectLine(id, true, true));
        selectedArtboardIds.forEach((id) => selectArtboard(id, true));
      } else {
        clearSelection();
        clearLineSelection();
        clearArtboardSelection();
        selectedBoxIds.forEach((id, index) => selectBox(id, index > 0));
        selectedLineIds.forEach((id, index) => {
          const isMulti = hasBoxSelection || index > 0;
          selectLine(id, isMulti, hasBoxSelection);
        });
        selectedArtboardIds.forEach((id, index) => {
          const isMulti = hasBoxSelection || hasLineSelection || index > 0;
          selectArtboard(id, isMulti);
        });
      }
    } else if (!shiftKey) {
      clearSelection();
      clearLineSelection();
      clearArtboardSelection();
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
