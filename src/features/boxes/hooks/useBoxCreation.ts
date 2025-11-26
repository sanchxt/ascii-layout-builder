import { useCallback } from "react";
import { useBoxStore } from "../store/boxStore";
import {
  createDefaultBox,
  clampBoxSizeWithAnchor,
  getMaxZIndex,
} from "../utils/boxHelpers";
import type { CanvasPosition } from "@/types/canvas";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { snapToGrid } from "@/features/alignment/utils/coordinateHelpers";
import { CANVAS_CONSTANTS } from "@/lib/constants";
import { canvasToArtboardRelative } from "@/features/artboards/utils/coordinateConversion";

export const useBoxCreation = () => {
  const boxes = useBoxStore((state) => state.boxes);
  const addBox = useBoxStore((state) => state.addBox);
  const setTempBox = useBoxStore((state) => state.setTempBox);
  const tempBox = useBoxStore((state) => state.tempBox);
  const setCreationMode = useBoxStore((state) => state.setCreationMode);
  const { viewport } = useCanvasStore();
  const activeArtboardId = useArtboardStore((state) => state.activeArtboardId);
  const artboards = useArtboardStore((state) => state.artboards);

  const startCreating = useCallback(
    (startPoint: CanvasPosition) => {
      setCreationMode("drawing");

      const newBox = createDefaultBox(startPoint.x, startPoint.y, 1, 1);
      newBox.zIndex = getMaxZIndex(boxes) + 1;

      setTempBox(newBox);
    },
    [setCreationMode, setTempBox, boxes]
  );

  const updateCreating = useCallback(
    (currentPoint: CanvasPosition) => {
      if (!tempBox) return;

      const startX = tempBox.x!;
      const startY = tempBox.y!;

      const width = Math.abs(currentPoint.x - startX);
      const height = Math.abs(currentPoint.y - startY);

      const x = currentPoint.x < startX ? currentPoint.x : startX;
      const y = currentPoint.y < startY ? currentPoint.y : startY;

      let updatedBox = clampBoxSizeWithAnchor(
        {
          ...tempBox,
          x,
          y,
          width,
          height,
        },
        startX,
        startY
      );

      if (
        viewport.snapToGrid &&
        updatedBox.x !== undefined &&
        updatedBox.y !== undefined &&
        updatedBox.width !== undefined &&
        updatedBox.height !== undefined
      ) {
        updatedBox = {
          ...updatedBox,
          x: snapToGrid(updatedBox.x, CANVAS_CONSTANTS.GRID_SIZE),
          y: snapToGrid(updatedBox.y, CANVAS_CONSTANTS.GRID_SIZE),
          width: snapToGrid(updatedBox.width, CANVAS_CONSTANTS.GRID_SIZE),
          height: snapToGrid(updatedBox.height, CANVAS_CONSTANTS.GRID_SIZE),
        };
      }

      setTempBox(updatedBox);
    },
    [tempBox, setTempBox]
  );

  const finishCreating = useCallback(() => {
    if (!tempBox || !tempBox.width || !tempBox.height) {
      setTempBox(null);
      setCreationMode("idle");
      return;
    }

    if (tempBox.width >= 50 && tempBox.height >= 40) {
      let finalBox = { ...tempBox };

      if (
        viewport.snapToGrid &&
        finalBox.x !== undefined &&
        finalBox.y !== undefined &&
        finalBox.width !== undefined &&
        finalBox.height !== undefined
      ) {
        finalBox = {
          ...finalBox,
          x: snapToGrid(finalBox.x, CANVAS_CONSTANTS.GRID_SIZE),
          y: snapToGrid(finalBox.y, CANVAS_CONSTANTS.GRID_SIZE),
          width: snapToGrid(finalBox.width, CANVAS_CONSTANTS.GRID_SIZE),
          height: snapToGrid(finalBox.height, CANVAS_CONSTANTS.GRID_SIZE),
        };
      }

      if (activeArtboardId) {
        const artboard = artboards.find((a) => a.id === activeArtboardId);
        if (artboard) {
          const relativePos = canvasToArtboardRelative(
            finalBox.x!,
            finalBox.y!,
            artboard
          );
          finalBox = {
            ...finalBox,
            artboardId: activeArtboardId,
            x: relativePos.x,
            y: relativePos.y,
          };
        }
      }

      addBox(finalBox as any);
    }

    setTempBox(null);
    setCreationMode("idle");
  }, [
    tempBox,
    addBox,
    setTempBox,
    setCreationMode,
    viewport.snapToGrid,
    activeArtboardId,
    artboards,
  ]);

  const cancelCreating = useCallback(() => {
    setTempBox(null);
    setCreationMode("idle");
  }, [setTempBox, setCreationMode]);

  const createBoxAtPoint = useCallback(
    (point: CanvasPosition) => {
      let x = point.x - 200;
      let y = point.y - 150;

      if (viewport.snapToGrid) {
        x = snapToGrid(x, CANVAS_CONSTANTS.GRID_SIZE);
        y = snapToGrid(y, CANVAS_CONSTANTS.GRID_SIZE);
      }

      const newBox = createDefaultBox(x, y);
      newBox.zIndex = getMaxZIndex(boxes) + 1;

      if (activeArtboardId) {
        const artboard = artboards.find((a) => a.id === activeArtboardId);
        if (artboard) {
          const relativePos = canvasToArtboardRelative(x, y, artboard);
          newBox.artboardId = activeArtboardId;
          newBox.x = relativePos.x;
          newBox.y = relativePos.y;
        }
      }

      addBox(newBox);
    },
    [addBox, boxes, viewport.snapToGrid, activeArtboardId, artboards]
  );

  return {
    startCreating,
    updateCreating,
    finishCreating,
    cancelCreating,
    createBoxAtPoint,
    tempBox,
  };
};
