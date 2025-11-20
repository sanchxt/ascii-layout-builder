import { useEffect } from "react";
import { useArtboardStore } from "../store/artboardStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { KEYBOARD_SHORTCUTS } from "@/lib/constants";

export const useArtboardShortcuts = () => {
  const {
    selectedArtboardIds,
    deleteArtboards,
    selectAll: selectAllArtboards,
  } = useArtboardStore();
  const { selectedBoxIds } = useBoxStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (
        (key === KEYBOARD_SHORTCUTS.DELETE.toLowerCase() ||
          key === KEYBOARD_SHORTCUTS.BACKSPACE.toLowerCase()) &&
        selectedArtboardIds.length > 0 &&
        selectedBoxIds.length === 0
      ) {
        e.preventDefault();
        deleteArtboards(selectedArtboardIds);
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        key === KEYBOARD_SHORTCUTS.SELECT_ALL &&
        selectedBoxIds.length === 0 &&
        selectedArtboardIds.length > 0
      ) {
        e.preventDefault();
        selectAllArtboards();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedArtboardIds,
    selectedBoxIds,
    deleteArtboards,
    selectAllArtboards,
  ]);
};
