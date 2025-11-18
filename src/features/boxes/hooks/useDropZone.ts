import { useState, useCallback, useEffect } from "react";
import { useBoxStore } from "../store/boxStore";
import {
  canNestBox,
  getAbsolutePosition,
  isDescendantOf,
} from "../utils/boxHierarchy";
import { BOX_CONSTANTS } from "@/lib/constants";
import type { Box } from "@/types/box";

export interface DropZoneState {
  potentialParentId: string | null;
  isValidDropZone: boolean;
  validationMessage?: string;
}

export interface UseDropZoneOptions {
  draggedBoxIds: string[];
  currentMousePos: { x: number; y: number };
  isDragging: boolean;
}

export const useDropZone = ({
  draggedBoxIds,
  currentMousePos,
  isDragging,
}: UseDropZoneOptions) => {
  const boxes = useBoxStore((state) => state.boxes);

  const [dropZoneState, setDropZoneState] = useState<DropZoneState>({
    potentialParentId: null,
    isValidDropZone: false,
  });

  const isPointInDropZone = useCallback(
    (point: { x: number; y: number }, box: Box): boolean => {
      const threshold = BOX_CONSTANTS.NESTING_DROP_ZONE_THRESHOLD;
      const absPos = getAbsolutePosition(box, boxes);

      return (
        point.x >= absPos.x + threshold &&
        point.x <= absPos.x + box.width - threshold &&
        point.y >= absPos.y + threshold &&
        point.y <= absPos.y + box.height - threshold
      );
    },
    [boxes]
  );

  const findPotentialParent = useCallback((): DropZoneState => {
    if (!isDragging || draggedBoxIds.length === 0) {
      return {
        potentialParentId: null,
        isValidDropZone: false,
      };
    }

    const boxesUnderCursor = boxes.filter((box) => {
      if (draggedBoxIds.includes(box.id)) return false;

      for (const draggedId of draggedBoxIds) {
        if (isDescendantOf(box.id, draggedId, boxes)) {
          return false;
        }
      }

      return isPointInDropZone(currentMousePos, box);
    });

    if (boxesUnderCursor.length === 0) {
      return {
        potentialParentId: null,
        isValidDropZone: false,
      };
    }

    const potentialParent = boxesUnderCursor.reduce((deepest, current) => {
      const deepestDepth = getBoxDepth(deepest.id);
      const currentDepth = getBoxDepth(current.id);
      return currentDepth > deepestDepth ? current : deepest;
    });

    const primaryDraggedId = draggedBoxIds[0];
    const validation = canNestBox(primaryDraggedId, potentialParent.id, boxes);

    return {
      potentialParentId: potentialParent.id,
      isValidDropZone: validation.canNest,
      validationMessage: validation.reason,
    };
  }, [isDragging, draggedBoxIds, boxes, currentMousePos, isPointInDropZone]);

  const getBoxDepth = useCallback(
    (boxId: string): number => {
      let depth = 0;
      let currentBox = boxes.find((b) => b.id === boxId);

      while (currentBox?.parentId) {
        depth++;
        currentBox = boxes.find((b) => b.id === currentBox?.parentId);
      }

      return depth;
    },
    [boxes]
  );

  useEffect(() => {
    const newState = findPotentialParent();
    setDropZoneState(newState);
  }, [findPotentialParent]);

  const applyNesting = useCallback(() => {
    if (!dropZoneState.isValidDropZone || !dropZoneState.potentialParentId) {
      return false;
    }

    return true;
  }, [dropZoneState]);

  return {
    dropZoneState,
    potentialParentId: dropZoneState.potentialParentId,
    isValidDropZone: dropZoneState.isValidDropZone,
    validationMessage: dropZoneState.validationMessage,
    applyNesting,
  };
};
