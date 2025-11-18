import { useState, useCallback, useEffect, useRef } from "react";
import { useBoxStore } from "../store/boxStore";
import { getAllDescendants } from "../utils/boxHierarchy";

export interface DragState {
  isDragging: boolean;
  draggedBoxIds: string[];
  initialPositions: Map<string, { x: number; y: number }>;
  startMousePos: { x: number; y: number };
  currentMousePos: { x: number; y: number };
}

export interface UseBoxDragOptions {
  onDragStart?: (boxIds: string[]) => void;
  onDragMove?: (boxIds: string[], delta: { x: number; y: number }) => void;
  onDragEnd?: (boxIds: string[], finalDelta: { x: number; y: number }) => void;
}

export const useBoxDrag = (options: UseBoxDragOptions = {}) => {
  const { onDragStart, onDragMove, onDragEnd } = options;

  const boxes = useBoxStore((state) => state.boxes);
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const updateBoxPosition = useBoxStore((state) => state.updateBoxPosition);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBoxIds: [],
    initialPositions: new Map(),
    startMousePos: { x: 0, y: 0 },
    currentMousePos: { x: 0, y: 0 },
  });

  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const getBoxesToDrag = useCallback(
    (boxIds: string[]): string[] => {
      const allIds = new Set<string>();

      boxIds.forEach((id) => {
        allIds.add(id);
        const descendants = getAllDescendants(id, boxes);
        descendants.forEach((desc) => allIds.add(desc.id));
      });

      return Array.from(allIds);
    },
    [boxes]
  );

  const startDrag = useCallback(
    (boxId: string, mouseX: number, mouseY: number) => {
      let boxesToDrag: string[];

      if (selectedBoxIds.includes(boxId)) {
        boxesToDrag = getBoxesToDrag(selectedBoxIds);
      } else {
        boxesToDrag = getBoxesToDrag([boxId]);
      }

      const initialPositions = new Map<string, { x: number; y: number }>();
      boxesToDrag.forEach((id) => {
        const box = boxes.find((b) => b.id === id);
        if (box) {
          initialPositions.set(id, { x: box.x, y: box.y });
        }
      });

      const newDragState: DragState = {
        isDragging: true,
        draggedBoxIds: boxesToDrag,
        initialPositions,
        startMousePos: { x: mouseX, y: mouseY },
        currentMousePos: { x: mouseX, y: mouseY },
      };

      setDragState(newDragState);

      if (onDragStart) {
        onDragStart(boxesToDrag);
      }
    },
    [boxes, selectedBoxIds, getBoxesToDrag, onDragStart]
  );

  const updateDrag = useCallback(
    (mouseX: number, mouseY: number) => {
      if (!dragStateRef.current.isDragging) return;

      const delta = {
        x: mouseX - dragStateRef.current.startMousePos.x,
        y: mouseY - dragStateRef.current.startMousePos.y,
      };

      setDragState((prev) => ({
        ...prev,
        currentMousePos: { x: mouseX, y: mouseY },
      }));

      if (onDragMove) {
        onDragMove(dragStateRef.current.draggedBoxIds, delta);
      }
    },
    [onDragMove]
  );

  const endDrag = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;

    const { draggedBoxIds, startMousePos, currentMousePos, initialPositions } =
      dragStateRef.current;

    const finalDelta = {
      x: currentMousePos.x - startMousePos.x,
      y: currentMousePos.y - startMousePos.y,
    };

    draggedBoxIds.forEach((id) => {
      const initialPos = initialPositions.get(id);
      if (initialPos) {
        const newX = initialPos.x + finalDelta.x;
        const newY = initialPos.y + finalDelta.y;

        updateBoxPosition(id, newX, newY);
      }
    });

    if (onDragEnd) {
      onDragEnd(draggedBoxIds, finalDelta);
    }

    setDragState({
      isDragging: false,
      draggedBoxIds: [],
      initialPositions: new Map(),
      startMousePos: { x: 0, y: 0 },
      currentMousePos: { x: 0, y: 0 },
    });
  }, [onDragEnd, updateBoxPosition]);

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedBoxIds: [],
      initialPositions: new Map(),
      startMousePos: { x: 0, y: 0 },
      currentMousePos: { x: 0, y: 0 },
    });
  }, []);

  const getCurrentDelta = useCallback((): { x: number; y: number } => {
    if (!dragState.isDragging) return { x: 0, y: 0 };

    return {
      x: dragState.currentMousePos.x - dragState.startMousePos.x,
      y: dragState.currentMousePos.y - dragState.startMousePos.y,
    };
  }, [dragState]);

  const getBoxPreviewPosition = useCallback(
    (boxId: string): { x: number; y: number } | null => {
      if (!dragState.isDragging || !dragState.draggedBoxIds.includes(boxId)) {
        return null;
      }

      const initialPos = dragState.initialPositions.get(boxId);
      if (!initialPos) return null;

      const delta = getCurrentDelta();

      return {
        x: initialPos.x + delta.x,
        y: initialPos.y + delta.y,
      };
    },
    [dragState, getCurrentDelta]
  );

  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelDrag();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [dragState.isDragging, updateDrag, endDrag, cancelDrag]);

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    getCurrentDelta,
    getBoxPreviewPosition,
    isDragging: dragState.isDragging,
  };
};
