import { useCallback } from "react";
import { useBoxStore } from "../store/boxStore";
import { getBoxAtPoint } from "../utils/boxHelpers";
import type { CanvasPosition } from "@/types/canvas";

export const useBoxSelection = () => {
  const { boxes, selectedBoxIds, selectBox, clearSelection } = useBoxStore();

  const handleCanvasClick = useCallback(
    (point: CanvasPosition, isShiftPressed: boolean) => {
      const clickedBox = getBoxAtPoint(point, boxes);

      if (clickedBox) {
        selectBox(clickedBox.id, isShiftPressed);
      } else {
        if (!isShiftPressed) {
          clearSelection();
        }
      }
    },
    [boxes, selectBox, clearSelection]
  );

  const isBoxSelected = useCallback(
    (boxId: string) => {
      return selectedBoxIds.includes(boxId);
    },
    [selectedBoxIds]
  );

  const getSelectedCount = useCallback(() => {
    return selectedBoxIds.length;
  }, [selectedBoxIds]);

  const hasSelection = useCallback(() => {
    return selectedBoxIds.length > 0;
  }, [selectedBoxIds]);

  return {
    handleCanvasClick,
    isBoxSelected,
    getSelectedCount,
    hasSelection,
    selectedBoxIds,
  };
};
