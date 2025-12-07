import { useState } from "react";
import { useLineStore } from "../store/lineStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import {
  getLineAbsolutePosition,
  convertLineToParentRelative,
} from "../utils/lineHierarchy";
import { getNestingDepth } from "@/features/boxes/utils/boxHierarchy";
import { BOX_CONSTANTS } from "@/lib/constants";

export interface LineDragState {
  draggedLineId: string | null;
  dropTargetBoxId: string | null;
  isValidDropZone: boolean;
}

const initialDragState: LineDragState = {
  draggedLineId: null,
  dropTargetBoxId: null,
  isValidDropZone: false,
};

export function useLineLayerDragDrop() {
  const [dragState, setDragState] = useState<LineDragState>(initialDragState);

  const lines = useLineStore((state) => state.lines);
  const updateLine = useLineStore((state) => state.updateLine);
  const setParent = useLineStore((state) => state.setParent);
  const detachFromParent = useLineStore((state) => state.detachFromParent);
  const boxes = useBoxStore((state) => state.boxes);

  const handleLineDragStart = (lineId: string, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/line-id", lineId);
    setDragState({
      draggedLineId: lineId,
      dropTargetBoxId: null,
      isValidDropZone: false,
    });
  };

  const handleLineDragOverBox = (targetBoxId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { draggedLineId } = dragState;
    if (!draggedLineId) return;

    const targetBox = boxes.find((b) => b.id === targetBoxId);
    if (!targetBox) return;

    if (targetBox.locked || targetBox.visible === false) {
      setDragState((prev) => ({
        ...prev,
        dropTargetBoxId: targetBoxId,
        isValidDropZone: false,
      }));
      return;
    }

    const boxDepth = getNestingDepth(targetBoxId, boxes);
    if (boxDepth >= BOX_CONSTANTS.MAX_NESTING_DEPTH) {
      setDragState((prev) => ({
        ...prev,
        dropTargetBoxId: targetBoxId,
        isValidDropZone: false,
      }));
      return;
    }

    e.dataTransfer.dropEffect = "move";
    setDragState({
      draggedLineId,
      dropTargetBoxId: targetBoxId,
      isValidDropZone: true,
    });
  };

  const handleLineDropOnBox = (targetBoxId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { draggedLineId, isValidDropZone } = dragState;
    if (!draggedLineId || !isValidDropZone) {
      resetDragState();
      return;
    }

    const draggedLine = lines.find((l) => l.id === draggedLineId);
    const targetBox = boxes.find((b) => b.id === targetBoxId);

    if (!draggedLine || !targetBox) {
      resetDragState();
      return;
    }

    const absPos = draggedLine.parentId
      ? getLineAbsolutePosition(draggedLine, boxes)
      : {
          startX: draggedLine.startX,
          startY: draggedLine.startY,
          endX: draggedLine.endX,
          endY: draggedLine.endY,
        };

    const relativeCoords = convertLineToParentRelative(
      absPos,
      targetBox,
      boxes
    );

    updateLine(draggedLineId, {
      startX: relativeCoords.startX,
      startY: relativeCoords.startY,
      endX: relativeCoords.endX,
      endY: relativeCoords.endY,
    });
    setParent(draggedLineId, targetBoxId);

    resetDragState();
  };

  const handleLineDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { draggedLineId } = dragState;
    if (!draggedLineId) {
      resetDragState();
      return;
    }

    const draggedLine = lines.find((l) => l.id === draggedLineId);
    if (!draggedLine || !draggedLine.parentId) {
      resetDragState();
      return;
    }

    const absPos = getLineAbsolutePosition(draggedLine, boxes);

    updateLine(draggedLineId, {
      startX: absPos.startX,
      startY: absPos.startY,
      endX: absPos.endX,
      endY: absPos.endY,
    });
    detachFromParent(draggedLineId);

    resetDragState();
  };

  const handleLineDragEnd = () => {
    resetDragState();
  };

  const resetDragState = () => {
    setDragState(initialDragState);
  };

  return {
    lineDragState: dragState,
    handleLineDragStart,
    handleLineDragOverBox,
    handleLineDropOnBox,
    handleLineDropOnCanvas,
    handleLineDragEnd,
  };
}
