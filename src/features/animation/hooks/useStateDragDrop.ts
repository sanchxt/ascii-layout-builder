/**
 * State Drag and Drop Hook
 *
 * Handles drag-and-drop reordering of animation states in the StateList.
 * Uses the native HTML5 drag-and-drop API.
 */

import { useState, useCallback } from "react";
import { useAnimationStore } from "../store/animationStore";
import type { AnimationState } from "../types/animation";

interface StateDragState {
  draggedStateId: string | null;
  dropTargetStateId: string | null;
  dropPosition: "before" | "after" | null;
}

interface UseStateDragDropOptions {
  /** States for the current artboard, sorted by order */
  states: AnimationState[];
}

export function useStateDragDrop({ states }: UseStateDragDropOptions) {
  const [dragState, setDragState] = useState<StateDragState>({
    draggedStateId: null,
    dropTargetStateId: null,
    dropPosition: null,
  });

  const reorderState = useAnimationStore((s) => s.reorderState);

  const handleDragStart = useCallback(
    (stateId: string, e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", stateId);

      // Set a custom drag image (optional, uses default)
      const target = e.currentTarget as HTMLElement;
      if (target) {
        e.dataTransfer.setDragImage(target, 0, 0);
      }

      setDragState({
        draggedStateId: stateId,
        dropTargetStateId: null,
        dropPosition: null,
      });
    },
    []
  );

  const handleDragOver = useCallback(
    (targetStateId: string, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const { draggedStateId } = dragState;
      if (!draggedStateId || draggedStateId === targetStateId) {
        return;
      }

      // Determine drop position based on mouse position within element
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position: "before" | "after" = e.clientY < midY ? "before" : "after";

      e.dataTransfer.dropEffect = "move";

      setDragState((prev) => ({
        ...prev,
        dropTargetStateId: targetStateId,
        dropPosition: position,
      }));
    },
    [dragState.draggedStateId]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the element entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    if (!currentTarget.contains(relatedTarget)) {
      setDragState((prev) => ({
        ...prev,
        dropTargetStateId: null,
        dropPosition: null,
      }));
    }
  }, []);

  const handleDrop = useCallback(
    (targetStateId: string, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const { draggedStateId, dropPosition } = dragState;
      if (!draggedStateId || !dropPosition || draggedStateId === targetStateId) {
        resetDragState();
        return;
      }

      const draggedState = states.find((s) => s.id === draggedStateId);
      const targetState = states.find((s) => s.id === targetStateId);

      if (!draggedState || !targetState) {
        resetDragState();
        return;
      }

      // Calculate new order based on drop position
      let newOrder: number;

      if (dropPosition === "before") {
        newOrder = targetState.order;
      } else {
        newOrder = targetState.order + 1;
      }

      // Adjust if dragging from before target
      if (draggedState.order < targetState.order && dropPosition === "before") {
        newOrder = targetState.order;
      } else if (draggedState.order > targetState.order && dropPosition === "after") {
        newOrder = targetState.order + 1;
      } else if (dropPosition === "before") {
        newOrder = targetState.order;
      } else {
        newOrder = targetState.order;
      }

      // Only reorder if position actually changed
      if (newOrder !== draggedState.order) {
        reorderState(draggedStateId, newOrder);
      }

      resetDragState();
    },
    [dragState, states, reorderState]
  );

  const handleDragEnd = useCallback(() => {
    resetDragState();
  }, []);

  const resetDragState = () => {
    setDragState({
      draggedStateId: null,
      dropTargetStateId: null,
      dropPosition: null,
    });
  };

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
