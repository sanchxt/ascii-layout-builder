import { useEffect, useCallback } from "react";
import { useBoxStore } from "../store/boxStore";
import { KEYBOARD_SHORTCUTS } from "@/lib/constants";

export const useGrouping = () => {
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const boxes = useBoxStore((state) => state.boxes);
  const groupBoxes = useBoxStore((state) => state.groupBoxes);
  const ungroupBox = useBoxStore((state) => state.ungroupBox);

  const canGroup = useCallback((): {
    canGroup: boolean;
    reason?: string;
  } => {
    if (selectedBoxIds.length === 0) {
      return { canGroup: false, reason: "No boxes selected" };
    }

    if (selectedBoxIds.length === 1) {
      return {
        canGroup: false,
        reason: "Select at least 2 boxes to group",
      };
    }

    const selectedBoxes = boxes.filter((box) =>
      selectedBoxIds.includes(box.id)
    );

    for (const box of selectedBoxes) {
      if (box.parentId && selectedBoxIds.includes(box.parentId)) {
        return {
          canGroup: false,
          reason: "Cannot group parent and child together",
        };
      }

      const hasSelectedChild = box.children.some((childId) =>
        selectedBoxIds.includes(childId)
      );
      if (hasSelectedChild) {
        return {
          canGroup: false,
          reason: "Cannot group parent and child together",
        };
      }
    }

    return { canGroup: true };
  }, [selectedBoxIds, boxes]);

  const canUngroup = useCallback((): {
    canUngroup: boolean;
    reason?: string;
  } => {
    if (selectedBoxIds.length === 0) {
      return { canUngroup: false, reason: "No box selected" };
    }

    if (selectedBoxIds.length > 1) {
      return {
        canUngroup: false,
        reason: "Select only one box to ungroup",
      };
    }

    const selectedBox = boxes.find((box) => box.id === selectedBoxIds[0]);
    if (!selectedBox) {
      return { canUngroup: false, reason: "Selected box not found" };
    }

    if (selectedBox.children.length === 0) {
      return {
        canUngroup: false,
        reason: "Selected box has no children to ungroup",
      };
    }

    return { canUngroup: true };
  }, [selectedBoxIds, boxes]);

  const handleGroup = useCallback(() => {
    const validation = canGroup();
    if (!validation.canGroup) {
      console.warn(`Cannot group: ${validation.reason}`);
      return false;
    }

    groupBoxes(selectedBoxIds);
    return true;
  }, [selectedBoxIds, canGroup, groupBoxes]);

  const handleUngroup = useCallback(() => {
    const validation = canUngroup();
    if (!validation.canUngroup) {
      console.warn(`Cannot ungroup: ${validation.reason}`);
      return false;
    }

    ungroupBox(selectedBoxIds[0]);
    return true;
  }, [selectedBoxIds, canUngroup, ungroupBox]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMetaKey = e.metaKey || e.ctrlKey;

      if (!isMetaKey) return;

      if (e.key === KEYBOARD_SHORTCUTS.GROUP && !e.shiftKey) {
        e.preventDefault();
        handleGroup();
      }

      if (e.key === KEYBOARD_SHORTCUTS.UNGROUP && e.shiftKey) {
        e.preventDefault();
        handleUngroup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleGroup, handleUngroup]);

  return {
    canGroup: canGroup(),
    canUngroup: canUngroup(),
    group: handleGroup,
    ungroup: handleUngroup,
  };
};
