import { useEffect, useCallback } from "react";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { ALIGNMENT_SHORTCUTS } from "@/lib/constants";
import type { AlignmentType } from "../types/alignment";

export const useAlignment = () => {
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const alignBoxes = useBoxStore((state) => state.alignBoxes);

  const handleAlign = useCallback(
    (alignment: AlignmentType) => {
      if (selectedBoxIds.length < 2) {
        console.warn("At least 2 boxes must be selected for alignment");
        return;
      }

      alignBoxes(selectedBoxIds, alignment);
    },
    [selectedBoxIds, alignBoxes]
  );

  const alignLeft = useCallback(() => handleAlign("left"), [handleAlign]);
  const alignCenterH = useCallback(
    () => handleAlign("center-h"),
    [handleAlign]
  );
  const alignRight = useCallback(() => handleAlign("right"), [handleAlign]);
  const alignTop = useCallback(() => handleAlign("top"), [handleAlign]);
  const alignMiddleV = useCallback(
    () => handleAlign("middle-v"),
    [handleAlign]
  );
  const alignBottom = useCallback(() => handleAlign("bottom"), [handleAlign]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        switch (e.key) {
          case ALIGNMENT_SHORTCUTS.ALIGN_LEFT:
            e.preventDefault();
            alignLeft();
            break;

          case ALIGNMENT_SHORTCUTS.ALIGN_CENTER_H:
            e.preventDefault();
            alignCenterH();
            break;

          case ALIGNMENT_SHORTCUTS.ALIGN_RIGHT:
            e.preventDefault();
            alignRight();
            break;

          case ALIGNMENT_SHORTCUTS.ALIGN_TOP:
            e.preventDefault();
            alignTop();
            break;

          case ALIGNMENT_SHORTCUTS.ALIGN_MIDDLE_V:
            e.preventDefault();
            alignMiddleV();
            break;

          case ALIGNMENT_SHORTCUTS.ALIGN_BOTTOM:
            e.preventDefault();
            alignBottom();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignMiddleV,
    alignBottom,
  ]);

  return {
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignMiddleV,
    alignBottom,
    align: handleAlign,
  };
};
