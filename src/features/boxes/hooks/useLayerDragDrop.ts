import { useState } from "react";
import { useBoxStore } from "../store/boxStore";
import type { Box } from "@/types/box";

interface DragState {
  draggedBoxId: string | null;
  dropTargetBoxId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
}

export function useLayerDragDrop() {
  const [dragState, setDragState] = useState<DragState>({
    draggedBoxId: null,
    dropTargetBoxId: null,
    dropPosition: null,
  });

  const boxes = useBoxStore((state) => state.boxes);
  const updateBox = useBoxStore((state) => state.updateBox);
  const setParent = useBoxStore((state) => state.setParent);
  const detachFromParent = useBoxStore((state) => state.detachFromParent);

  const handleDragStart = (boxId: string, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", boxId);
    setDragState({
      draggedBoxId: boxId,
      dropTargetBoxId: null,
      dropPosition: null,
    });
  };

  const handleDragOver = (
    targetBoxId: string,
    e: React.DragEvent,
    position: "before" | "after" | "inside"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const { draggedBoxId } = dragState;
    if (!draggedBoxId || draggedBoxId === targetBoxId) {
      return;
    }

    if (
      position === "inside" &&
      isDescendant(targetBoxId, draggedBoxId, boxes)
    ) {
      return;
    }

    e.dataTransfer.dropEffect = "move";
    setDragState({
      draggedBoxId,
      dropTargetBoxId: targetBoxId,
      dropPosition: position,
    });
  };

  const handleDrop = (targetBoxId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { draggedBoxId, dropPosition } = dragState;
    if (!draggedBoxId || !dropPosition) {
      resetDragState();
      return;
    }

    const draggedBox = boxes.find((b) => b.id === draggedBoxId);
    const targetBox = boxes.find((b) => b.id === targetBoxId);

    if (!draggedBox || !targetBox) {
      resetDragState();
      return;
    }

    if (dropPosition === "inside") {
      if (draggedBox.parentId) {
        detachFromParent(draggedBoxId);
      }
      setParent(draggedBoxId, targetBoxId);
    } else {
      const targetParentId = targetBox.parentId;

      if (draggedBox.parentId !== targetParentId) {
        if (draggedBox.parentId) {
          detachFromParent(draggedBoxId);
        }

        if (targetParentId) {
          setParent(draggedBoxId, targetParentId);
        }
      }

      reorderSiblings(draggedBoxId, targetBoxId, dropPosition, targetParentId);
    }

    resetDragState();
  };

  const reorderSiblings = (
    draggedId: string,
    targetId: string,
    position: "before" | "after",
    parentId: string | undefined
  ) => {
    const siblings = boxes.filter((b) => b.parentId === parentId);
    const sortedSiblings = siblings.sort((a, b) => a.zIndex - b.zIndex);

    const draggedIndex = sortedSiblings.findIndex((b) => b.id === draggedId);
    const targetIndex = sortedSiblings.findIndex((b) => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    let newZIndex: number;

    if (position === "before") {
      const prevBox = targetIndex > 0 ? sortedSiblings[targetIndex - 1] : null;
      if (prevBox) {
        newZIndex = (prevBox.zIndex + sortedSiblings[targetIndex].zIndex) / 2;
      } else {
        newZIndex = sortedSiblings[targetIndex].zIndex - 1;
      }
    } else {
      const nextBox =
        targetIndex < sortedSiblings.length - 1
          ? sortedSiblings[targetIndex + 1]
          : null;
      if (nextBox) {
        newZIndex = (sortedSiblings[targetIndex].zIndex + nextBox.zIndex) / 2;
      } else {
        newZIndex = sortedSiblings[targetIndex].zIndex + 1;
      }
    }

    updateBox(draggedId, { zIndex: newZIndex });
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  const resetDragState = () => {
    setDragState({
      draggedBoxId: null,
      dropTargetBoxId: null,
      dropPosition: null,
    });
  };

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}

function isDescendant(
  boxId: string,
  potentialAncestorId: string,
  boxes: Box[]
): boolean {
  const box = boxes.find((b) => b.id === boxId);
  if (!box) return false;

  if (box.parentId === potentialAncestorId) return true;
  if (!box.parentId) return false;

  return isDescendant(box.parentId, potentialAncestorId, boxes);
}
