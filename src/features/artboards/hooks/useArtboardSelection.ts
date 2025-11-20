import { useCallback } from "react";
import { useArtboardStore } from "../store/artboardStore";
import type { CanvasPosition } from "@/types/canvas";

const isPointInArtboard = (
  point: CanvasPosition,
  artboard: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    point.x >= artboard.x &&
    point.x <= artboard.x + artboard.width &&
    point.y >= artboard.y &&
    point.y <= artboard.y + artboard.height
  );
};

export const useArtboardSelection = () => {
  const artboards = useArtboardStore((state) => state.artboards);
  const selectedArtboardIds = useArtboardStore(
    (state) => state.selectedArtboardIds
  );
  const selectArtboard = useArtboardStore((state) => state.selectArtboard);
  const clearSelection = useArtboardStore((state) => state.clearSelection);

  const getArtboardAtPoint = useCallback(
    (point: CanvasPosition) => {
      const visibleArtboards = artboards.filter((ab) => ab.visible);

      const sorted = [...visibleArtboards].sort((a, b) => b.zIndex - a.zIndex);

      for (const artboard of sorted) {
        if (isPointInArtboard(point, artboard)) {
          return artboard;
        }
      }

      return null;
    },
    [artboards]
  );

  const handleCanvasClick = useCallback(
    (point: CanvasPosition, isShiftPressed: boolean) => {
      const clickedArtboard = getArtboardAtPoint(point);

      if (clickedArtboard) {
        selectArtboard(clickedArtboard.id, isShiftPressed);
      } else {
        if (!isShiftPressed) {
          clearSelection();
        }
      }
    },
    [getArtboardAtPoint, selectArtboard, clearSelection]
  );

  const isArtboardSelected = useCallback(
    (artboardId: string) => {
      return selectedArtboardIds.includes(artboardId);
    },
    [selectedArtboardIds]
  );

  const getSelectedCount = useCallback(() => {
    return selectedArtboardIds.length;
  }, [selectedArtboardIds]);

  const hasSelection = useCallback(() => {
    return selectedArtboardIds.length > 0;
  }, [selectedArtboardIds]);

  return {
    getArtboardAtPoint,
    handleCanvasClick,
    isArtboardSelected,
    getSelectedCount,
    hasSelection,
    selectedArtboardIds,
  };
};
