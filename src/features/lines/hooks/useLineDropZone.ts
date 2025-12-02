import { useState, useCallback, useEffect } from "react";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import {
  getAbsolutePosition,
  getNestingDepth,
} from "@/features/boxes/utils/boxHierarchy";
import { BOX_CONSTANTS } from "@/lib/constants";
import type { Box } from "@/types/box";

export interface LineDropZoneState {
  potentialParentId: string | null;
  isValidDropZone: boolean;
  validationMessage?: string;
}

export interface UseLineDropZoneOptions {
  draggedLineId: string | null;
  currentMousePos: { x: number; y: number };
  isDragging: boolean;
  linePreviewPosition?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null;
}

export const useLineDropZone = ({
  draggedLineId,
  currentMousePos,
  isDragging,
  linePreviewPosition,
}: UseLineDropZoneOptions) => {
  const boxes = useBoxStore((state) => state.boxes);

  const [dropZoneState, setDropZoneState] = useState<LineDropZoneState>({
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

  const canNestLineInBox = useCallback(
    (box: Box): { canNest: boolean; reason?: string } => {
      if (box.locked) {
        return { canNest: false, reason: "Box is locked" };
      }

      if (box.visible === false) {
        return { canNest: false, reason: "Box is hidden" };
      }

      const boxDepth = getNestingDepth(box.id, boxes);
      if (boxDepth >= BOX_CONSTANTS.MAX_NESTING_DEPTH) {
        return {
          canNest: false,
          reason: `Box is at maximum nesting depth (${BOX_CONSTANTS.MAX_NESTING_DEPTH})`,
        };
      }

      return { canNest: true };
    },
    [boxes]
  );

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

  const findPotentialParent = useCallback((): LineDropZoneState => {
    if (!isDragging || !draggedLineId) {
      return {
        potentialParentId: null,
        isValidDropZone: false,
      };
    }

    let checkPoint = currentMousePos;
    if (linePreviewPosition) {
      checkPoint = {
        x: (linePreviewPosition.startX + linePreviewPosition.endX) / 2,
        y: (linePreviewPosition.startY + linePreviewPosition.endY) / 2,
      };
    }

    const boxesUnderCursor = boxes.filter((box) => {
      return isPointInDropZone(checkPoint, box);
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

    const validation = canNestLineInBox(potentialParent);

    return {
      potentialParentId: potentialParent.id,
      isValidDropZone: validation.canNest,
      validationMessage: validation.reason,
    };
  }, [
    isDragging,
    draggedLineId,
    currentMousePos,
    linePreviewPosition,
    boxes,
    isPointInDropZone,
    getBoxDepth,
    canNestLineInBox,
  ]);

  useEffect(() => {
    const newState = findPotentialParent();
    setDropZoneState(newState);
  }, [findPotentialParent]);

  return {
    dropZoneState,
    potentialParentId: dropZoneState.potentialParentId,
    isValidDropZone: dropZoneState.isValidDropZone,
    validationMessage: dropZoneState.validationMessage,
  };
};
