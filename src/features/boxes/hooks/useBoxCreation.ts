import { useCallback } from "react";
import { useBoxStore } from "../store/boxStore";
import {
  createDefaultBox,
  clampBoxSizeWithAnchor,
  getMaxZIndex,
} from "../utils/boxHelpers";
import type { CanvasPosition } from "@/types/canvas";

export const useBoxCreation = () => {
  const { boxes, addBox, setTempBox, tempBox, setCreationMode } = useBoxStore();

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

      const updatedBox = clampBoxSizeWithAnchor(
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
      addBox(tempBox as any);
    }

    setTempBox(null);
    setCreationMode("idle");
  }, [tempBox, addBox, setTempBox, setCreationMode]);

  const cancelCreating = useCallback(() => {
    setTempBox(null);
    setCreationMode("idle");
  }, [setTempBox, setCreationMode]);

  const createBoxAtPoint = useCallback(
    (point: CanvasPosition) => {
      const newBox = createDefaultBox(point.x - 200, point.y - 150);
      newBox.zIndex = getMaxZIndex(boxes) + 1;
      addBox(newBox);
    },
    [addBox, boxes]
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
