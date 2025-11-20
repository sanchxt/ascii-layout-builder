import { useEffect } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { KEYBOARD_SHORTCUTS } from "@/lib/constants";

export const useToolShortcuts = () => {
  const { setSelectedTool, interaction } = useCanvasStore();
  const {
    selectedBoxIds,
    deleteBoxes,
    duplicateBoxes,
    selectAll,
    updateBoxPosition,
    getBox,
    copyBoxes,
    pasteBoxes,
  } = useBoxStore();

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

      if ((e.ctrlKey || e.metaKey) && key === KEYBOARD_SHORTCUTS.SELECT_ALL) {
        e.preventDefault();
        selectAll();
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        key === KEYBOARD_SHORTCUTS.COPY &&
        selectedBoxIds.length > 0
      ) {
        e.preventDefault();
        copyBoxes();
      }

      if ((e.ctrlKey || e.metaKey) && key === KEYBOARD_SHORTCUTS.PASTE) {
        e.preventDefault();
        pasteBoxes();
      }

      if (
        selectedBoxIds.length > 0 &&
        interaction.selectedTool === "select" &&
        ["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)
      ) {
        e.preventDefault();
        const nudgeAmount = e.shiftKey ? 10 : 1;

        selectedBoxIds.forEach((boxId) => {
          const box = getBox(boxId);
          if (!box) return;

          let newX = box.x;
          let newY = box.y;

          if (key === "arrowleft") {
            newX = box.x - nudgeAmount;
          } else if (key === "arrowright") {
            newX = box.x + nudgeAmount;
          } else if (key === "arrowup") {
            newY = box.y - nudgeAmount;
          } else if (key === "arrowdown") {
            newY = box.y + nudgeAmount;
          }

          updateBoxPosition(boxId, newX, newY);
        });
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
    selectAll,
    updateBoxPosition,
    getBox,
    copyBoxes,
    pasteBoxes,
  ]);
};
