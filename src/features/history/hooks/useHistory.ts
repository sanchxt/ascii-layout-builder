import { useEffect } from "react";
import { useHistoryStore } from "../store/historyStore";
import { KEYBOARD_SHORTCUTS } from "@/lib/constants";

export const useHistory = () => {
  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // typing rn...ignore
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).contentEditable === "true"
      )
        return;

      const key = e.key.toLowerCase();

      // undo
      if (
        (e.ctrlKey || e.metaKey) &&
        key === KEYBOARD_SHORTCUTS.UNDO &&
        !e.shiftKey
      ) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }

      // redo
      if (
        (e.ctrlKey || e.metaKey) &&
        key === KEYBOARD_SHORTCUTS.REDO.toLowerCase() &&
        e.shiftKey
      ) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
};
