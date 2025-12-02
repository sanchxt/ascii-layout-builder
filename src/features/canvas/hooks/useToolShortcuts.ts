import { useEffect } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import {
  KEYBOARD_SHORTCUTS,
  CANVAS_CONSTANTS,
  BOX_CONSTANTS,
} from "@/lib/constants";
import { getAbsolutePosition } from "@/features/boxes/utils/boxHierarchy";

export const useToolShortcuts = () => {
  const {
    setSelectedTool,
    interaction,
    toggleSnapToGrid,
    toggleSmartGuides,
    viewport,
  } = useCanvasStore();
  const {
    selectedBoxIds,
    deleteBoxes,
    duplicateBoxes,
    selectAll,
    updateBoxPosition,
    getBox,
    copyBoxes,
    pasteBoxes,
    boxes,
    updateBox,
  } = useBoxStore();
  const artboards = useArtboardStore((state) => state.artboards);

  const {
    selectedLineIds,
    deleteLines,
    duplicateLines,
    selectAllLines,
    copyLines,
    pasteLines,
  } = useLineStore();

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
      } else if (
        key === KEYBOARD_SHORTCUTS.TOOL_LINE &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        setSelectedTool("line");
      }

      if (
        key === KEYBOARD_SHORTCUTS.DELETE.toLowerCase() ||
        key === KEYBOARD_SHORTCUTS.BACKSPACE.toLowerCase()
      ) {
        if (selectedBoxIds.length > 0) {
          e.preventDefault();
          deleteBoxes(selectedBoxIds);
        } else if (selectedLineIds.length > 0) {
          e.preventDefault();
          deleteLines(selectedLineIds);
        }
      }

      if ((e.ctrlKey || e.metaKey) && key === KEYBOARD_SHORTCUTS.DUPLICATE) {
        if (selectedBoxIds.length > 0) {
          e.preventDefault();
          duplicateBoxes(selectedBoxIds);
        } else if (selectedLineIds.length > 0) {
          e.preventDefault();
          duplicateLines(selectedLineIds);
        }
      }

      if ((e.ctrlKey || e.metaKey) && key === KEYBOARD_SHORTCUTS.SELECT_ALL) {
        e.preventDefault();
        selectAll();
      }

      if ((e.ctrlKey || e.metaKey) && key === KEYBOARD_SHORTCUTS.COPY) {
        if (selectedBoxIds.length > 0) {
          e.preventDefault();
          copyBoxes();
        } else if (selectedLineIds.length > 0) {
          e.preventDefault();
          copyLines();
        }
      }

      if ((e.ctrlKey || e.metaKey) && key === KEYBOARD_SHORTCUTS.PASTE) {
        e.preventDefault();
        pasteBoxes();
        pasteLines();
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        key === KEYBOARD_SHORTCUTS.TOGGLE_SNAP_TO_GRID.toLowerCase()
      ) {
        e.preventDefault();
        toggleSnapToGrid();
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        key === KEYBOARD_SHORTCUTS.TOGGLE_SMART_GUIDES.toLowerCase()
      ) {
        e.preventDefault();
        toggleSmartGuides();
      }

      if (
        selectedBoxIds.length > 0 &&
        interaction.selectedTool === "select" &&
        ["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)
      ) {
        e.preventDefault();
        const nudgeAmount = viewport.snapToGrid
          ? e.shiftKey
            ? CANVAS_CONSTANTS.GRID_SIZE * 2
            : CANVAS_CONSTANTS.GRID_SIZE
          : e.shiftKey
          ? 10
          : 1;

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

          if (!box.parentId && box.artboardId) {
            const artboard = artboards.find((a) => a.id === box.artboardId);
            console.log(
              "[Auto-detach] Checking box:",
              boxId,
              "artboardId:",
              box.artboardId,
              "artboard found:",
              !!artboard
            );
            if (artboard) {
              const centerX = newX + box.width / 2;
              const centerY = newY + box.height / 2;
              const threshold = BOX_CONSTANTS.AUTO_DETACH_THRESHOLD;

              const isOutside =
                centerX < -threshold ||
                centerX > artboard.width + threshold ||
                centerY < -threshold ||
                centerY > artboard.height + threshold;

              console.log(
                "[Auto-detach] centerX:",
                centerX,
                "centerY:",
                centerY,
                "threshold:",
                threshold,
                "isOutside:",
                isOutside
              );

              if (isOutside) {
                const absPos = getAbsolutePosition(
                  { ...box, x: newX, y: newY },
                  boxes
                );
                console.log("[Auto-detach] Detaching! absPos:", absPos);
                updateBox(boxId, {
                  artboardId: undefined,
                  x: absPos.x,
                  y: absPos.y,
                });
              }
            }
          } else {
            console.log(
              "[Auto-detach] Skipping box:",
              boxId,
              "parentId:",
              box.parentId,
              "artboardId:",
              box.artboardId
            );
          }
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
    toggleSnapToGrid,
    toggleSmartGuides,
    viewport.snapToGrid,
    artboards,
    boxes,
    updateBox,
    selectedLineIds,
    deleteLines,
    duplicateLines,
    selectAllLines,
    copyLines,
    pasteLines,
  ]);
};
