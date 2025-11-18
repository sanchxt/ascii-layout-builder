import { useEffect } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { KEYBOARD_SHORTCUTS } from "@/lib/constants";

export const useToolShortcuts = () => {
  const { setSelectedTool, interaction } = useCanvasStore();
  const { selectedBoxIds, deleteBoxes, duplicateBoxes } = useBoxStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === KEYBOARD_SHORTCUTS.TOOL_SELECT) {
        e.preventDefault();
        setSelectedTool("select");
      } else if (key === KEYBOARD_SHORTCUTS.TOOL_BOX) {
        e.preventDefault();
        setSelectedTool("box");
      } else if (key === KEYBOARD_SHORTCUTS.TOOL_TEXT) {
        e.preventDefault();
        setSelectedTool("text");
      } else if (
        key === KEYBOARD_SHORTCUTS.TOOL_ARTBOARD &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        setSelectedTool("artboard");
      }

      if (
        (key === KEYBOARD_SHORTCUTS.DELETE.toLowerCase() ||
          key === KEYBOARD_SHORTCUTS.BACKSPACE.toLowerCase()) &&
        selectedBoxIds.length > 0
      ) {
        e.preventDefault();
        deleteBoxes(selectedBoxIds);
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        key === KEYBOARD_SHORTCUTS.DUPLICATE &&
        selectedBoxIds.length > 0
      ) {
        e.preventDefault();
        duplicateBoxes(selectedBoxIds);
      }

      if (key === KEYBOARD_SHORTCUTS.ESCAPE.toLowerCase()) {
        e.preventDefault();
        if (interaction.selectedTool !== "select") {
          setSelectedTool("select");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    setSelectedTool,
    interaction.selectedTool,
    selectedBoxIds,
    deleteBoxes,
    duplicateBoxes,
  ]);
};
