import { useState, useCallback, useRef } from "react";
import { useBoxStore } from "../store/boxStore";
import { getAllDescendants, getAbsolutePosition } from "../utils/boxHierarchy";

export interface DragState {
  isDragging: boolean;
  draggedBoxIds: string[];
  initialAbsolutePositions: Map<string, { x: number; y: number }>;
  startCanvasPos: { x: number; y: number };
  currentCanvasPos: { x: number; y: number };
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

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBoxIds: [],
    initialAbsolutePositions: new Map(),
    startCanvasPos: { x: 0, y: 0 },
    currentCanvasPos: { x: 0, y: 0 },
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
    (boxId: string, canvasX: number, canvasY: number) => {
      let boxesToDrag: string[];

      if (selectedBoxIds.includes(boxId)) {
        boxesToDrag = getBoxesToDrag(selectedBoxIds);
      } else {
        boxesToDrag = getBoxesToDrag([boxId]);
      }

      const initialAbsolutePositions = new Map<
        string,
        { x: number; y: number }
      >();
      boxesToDrag.forEach((id) => {
        const box = boxes.find((b) => b.id === id);
        if (box) {
          const absolutePos = getAbsolutePosition(box, boxes);
          initialAbsolutePositions.set(id, absolutePos);
        }
      });

      const newDragState: DragState = {
        isDragging: true,
        draggedBoxIds: boxesToDrag,
        initialAbsolutePositions,
        startCanvasPos: { x: canvasX, y: canvasY },
        currentCanvasPos: { x: canvasX, y: canvasY },
      };

      setDragState(newDragState);

      if (onDragStart) {
        onDragStart(boxesToDrag);
      }
    },
    [boxes, selectedBoxIds, getBoxesToDrag, onDragStart]
  );

  const updateDrag = useCallback(
    (canvasX: number, canvasY: number) => {
      if (!dragStateRef.current.isDragging) return;

      const delta = {
        x: canvasX - dragStateRef.current.startCanvasPos.x,
        y: canvasY - dragStateRef.current.startCanvasPos.y,
      };

      setDragState((prev) => ({
        ...prev,
        currentCanvasPos: { x: canvasX, y: canvasY },
      }));

      if (onDragMove) {
        onDragMove(dragStateRef.current.draggedBoxIds, delta);
      }
    },
    [onDragMove]
  );

  const endDrag = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;

    const { draggedBoxIds, startCanvasPos, currentCanvasPos } =
      dragStateRef.current;

    const finalDelta = {
      x: currentCanvasPos.x - startCanvasPos.x,
      y: currentCanvasPos.y - startCanvasPos.y,
    };

    if (onDragEnd) {
      onDragEnd(draggedBoxIds, finalDelta);
    }

    setDragState({
      isDragging: false,
      draggedBoxIds: [],
      initialAbsolutePositions: new Map(),
      startCanvasPos: { x: 0, y: 0 },
      currentCanvasPos: { x: 0, y: 0 },
    });
  }, [onDragEnd]);

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedBoxIds: [],
      initialAbsolutePositions: new Map(),
      startCanvasPos: { x: 0, y: 0 },
      currentCanvasPos: { x: 0, y: 0 },
    });
  }, []);

  const getCurrentDelta = useCallback((): { x: number; y: number } => {
    if (!dragState.isDragging) return { x: 0, y: 0 };

    return {
      x: dragState.currentCanvasPos.x - dragState.startCanvasPos.x,
      y: dragState.currentCanvasPos.y - dragState.startCanvasPos.y,
    };
  }, [dragState]);

  const getBoxPreviewPosition = useCallback(
    (boxId: string): { x: number; y: number } | null => {
      if (!dragState.isDragging || !dragState.draggedBoxIds.includes(boxId)) {
        return null;
      }

      const initialAbsolutePos = dragState.initialAbsolutePositions.get(boxId);
      if (!initialAbsolutePos) return null;

      const delta = getCurrentDelta();

      return {
        x: initialAbsolutePos.x + delta.x,
        y: initialAbsolutePos.y + delta.y,
      };
    },
    [dragState, getCurrentDelta]
  );

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    getCurrentDelta,
    getBoxPreviewPosition,
    isDragging: dragState.isDragging,
    initialAbsolutePositions: dragState.initialAbsolutePositions,
  };
};
