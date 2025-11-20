import { useEffect, useCallback } from "react";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { ALIGNMENT_SHORTCUTS } from "@/lib/constants";
import type { DistributionType } from "../types/alignment";

export const useDistribution = () => {
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const distributeBoxes = useBoxStore((state) => state.distributeBoxes);

  const handleDistribute = useCallback(
    (distribution: DistributionType) => {
      if (selectedBoxIds.length < 3) {
        console.warn("At least 3 boxes must be selected for distribution");
        return;
      }

      distributeBoxes(selectedBoxIds, distribution);
    },
    [selectedBoxIds, distributeBoxes]
  );

  const distributeHorizontal = useCallback(
    () => handleDistribute("horizontal"),
    [handleDistribute]
  );

  const distributeVertical = useCallback(
    () => handleDistribute("vertical"),
    [handleDistribute]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.altKey) {
        switch (e.key) {
          case ALIGNMENT_SHORTCUTS.DISTRIBUTE_H:
            e.preventDefault();
            distributeHorizontal();
            break;

          case ALIGNMENT_SHORTCUTS.DISTRIBUTE_V:
            e.preventDefault();
            distributeVertical();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [distributeHorizontal, distributeVertical]);

  return {
    distributeHorizontal,
    distributeVertical,
    distribute: handleDistribute,
  };
};
