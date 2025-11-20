import { useEffect } from "react";
import { useBoxStore } from "../store/boxStore";
import { useLayersUIStore } from "../store/layersUIStore";
import { LAYER_SHORTCUTS } from "@/lib/constants";

export const useLayerKeyboardShortcuts = () => {
  const {
    selectedBoxIds,
    boxes,
    toggleBoxVisibility,
    toggleBoxLock,
    moveBoxForward,
    moveBoxBackward,
    moveBoxToFront,
    moveBoxToBack,
  } = useBoxStore();

  const { expandAll, collapseAll } = useLayersUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key;
      const hasSelection = selectedBoxIds.length > 0;

      if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        key.toLowerCase() === LAYER_SHORTCUTS.TOGGLE_VISIBILITY &&
        hasSelection
      ) {
        e.preventDefault();
        selectedBoxIds.forEach((id) => toggleBoxVisibility(id));
      } else if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        key.toLowerCase() === LAYER_SHORTCUTS.TOGGLE_LOCK &&
        hasSelection
      ) {
        e.preventDefault();
        selectedBoxIds.forEach((id) => toggleBoxLock(id));
      } else if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        key === LAYER_SHORTCUTS.BRING_FORWARD &&
        hasSelection
      ) {
        e.preventDefault();
        moveBoxForward(selectedBoxIds[0]);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        key === LAYER_SHORTCUTS.SEND_BACKWARD &&
        hasSelection
      ) {
        e.preventDefault();
        moveBoxBackward(selectedBoxIds[0]);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        key === LAYER_SHORTCUTS.BRING_TO_FRONT &&
        hasSelection
      ) {
        e.preventDefault();
        moveBoxToFront(selectedBoxIds[0]);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        key === LAYER_SHORTCUTS.SEND_TO_BACK &&
        hasSelection
      ) {
        e.preventDefault();
        moveBoxToBack(selectedBoxIds[0]);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        key === LAYER_SHORTCUTS.EXPAND_ALL_LAYERS
      ) {
        e.preventDefault();
        const allBoxIds = boxes
          .filter((box) => box.children.length > 0)
          .map((box) => box.id);
        expandAll(allBoxIds);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        key === LAYER_SHORTCUTS.COLLAPSE_ALL_LAYERS
      ) {
        e.preventDefault();
        collapseAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedBoxIds, boxes]);
};
