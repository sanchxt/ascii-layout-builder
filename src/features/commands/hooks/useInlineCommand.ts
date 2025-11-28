import { useEffect, useCallback } from "react";
import { useCommandStore } from "../store/commandStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { getAbsolutePosition } from "@/features/boxes/utils/boxHierarchy";

export function useInlineCommand() {
  const { inline, inlineActions } = useCommandStore();
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const boxes = useBoxStore((state) => state.boxes);
  const getBox = useBoxStore((state) => state.getBox);
  const activeArtboardId = useArtboardStore((state) => state.activeArtboardId);
  const getArtboard = useArtboardStore((state) => state.getArtboard);
  const pan = useCanvasStore((state) => state.viewport.pan);
  const zoom = useCanvasStore((state) => state.viewport.zoom);
  const editingBoxId = useCanvasStore(
    (state) => state.interaction.editingBoxId
  );

  const activateForSelection = useCallback(() => {
    if (editingBoxId) return;

    if (selectedBoxIds.length === 1) {
      const box = getBox(selectedBoxIds[0]);
      if (box) {
        const absolutePos = getAbsolutePosition(box, boxes);
        const screenX = (absolutePos.x + box.width / 2) * zoom + pan.x - 140;
        const screenY = (absolutePos.y + 40) * zoom + pan.y;

        inlineActions.activate(box.id, "box", { x: screenX, y: screenY });
        return;
      }
    }

    if (activeArtboardId) {
      const artboard = getArtboard(activeArtboardId);
      if (artboard) {
        const screenX = (artboard.x + artboard.width / 2) * zoom + pan.x - 140;
        const screenY = (artboard.y + 60) * zoom + pan.y;

        inlineActions.activate(artboard.id, "artboard", {
          x: screenX,
          y: screenY,
        });
        return;
      }
    }
  }, [
    selectedBoxIds,
    activeArtboardId,
    boxes,
    getBox,
    getArtboard,
    pan,
    zoom,
    editingBoxId,
    inlineActions,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (useCommandStore.getState().isOpen) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        activateForSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activateForSelection]);

  return {
    isActive: inline.isActive,
    activate: activateForSelection,
    deactivate: inlineActions.deactivate,
  };
}
