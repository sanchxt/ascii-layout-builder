import { useState, useCallback, useRef } from "react";
import { useBoxStore } from "../store/boxStore";
import { getAllDescendants, getAbsolutePosition } from "../utils/boxHierarchy";
import {
  getLayoutParent,
  calculateLayoutReorder,
  isDraggingOutsideLayout,
  type ReorderResult,
} from "@/features/layout-system/lib/layoutConstraints";
import { recalculateLayout } from "@/features/layout-system/store/layoutStore";

export interface DragState {
  isDragging: boolean;
  draggedBoxIds: string[];
  initialAbsolutePositions: Map<string, { x: number; y: number }>;
  startCanvasPos: { x: number; y: number };
  currentCanvasPos: { x: number; y: number };
  layoutReorder: ReorderResult | null;
  isDraggingOutside: boolean;
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
    layoutReorder: null,
    isDraggingOutside: false,
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
        layoutReorder: null,
        isDraggingOutside: false,
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

      const primaryBoxId = dragStateRef.current.draggedBoxIds[0];
      const primaryBox = boxes.find((b) => b.id === primaryBoxId);

      let layoutReorder: ReorderResult | null = null;
      let isDraggingOutside = false;

      if (primaryBox) {
        const layoutParent = getLayoutParent(primaryBoxId, boxes);

        if (layoutParent) {
          const initialPos =
            dragStateRef.current.initialAbsolutePositions.get(primaryBoxId);
          if (initialPos) {
            const newPosition = {
              x: initialPos.x + delta.x,
              y: initialPos.y + delta.y,
            };

            isDraggingOutside = isDraggingOutsideLayout(
              primaryBox,
              newPosition,
              layoutParent
            );

            if (!isDraggingOutside) {
              const parentRelativePos = {
                x: primaryBox.x + delta.x,
                y: primaryBox.y + delta.y,
              };
              layoutReorder = calculateLayoutReorder(
                primaryBoxId,
                parentRelativePos,
                boxes
              );
            }
          }
        }
      }

      setDragState((prev) => ({
        ...prev,
        currentCanvasPos: { x: canvasX, y: canvasY },
        layoutReorder,
        isDraggingOutside,
      }));

      if (onDragMove) {
        onDragMove(dragStateRef.current.draggedBoxIds, delta);
      }
    },
    [onDragMove, boxes]
  );

  const detachFromParent = useBoxStore((state) => state.detachFromParent);
  const updateBox = useBoxStore((state) => state.updateBox);

  const endDrag = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;

    const {
      draggedBoxIds,
      startCanvasPos,
      currentCanvasPos,
      layoutReorder,
      isDraggingOutside,
    } = dragStateRef.current;

    const finalDelta = {
      x: currentCanvasPos.x - startCanvasPos.x,
      y: currentCanvasPos.y - startCanvasPos.y,
    };

    const primaryBoxId = draggedBoxIds[0];
    const primaryBox = boxes.find((b) => b.id === primaryBoxId);

    if (primaryBox) {
      const layoutParent = getLayoutParent(primaryBoxId, boxes);

      if (layoutParent) {
        if (isDraggingOutside) {
          detachFromParent(primaryBoxId);
        } else if (layoutReorder?.shouldReorder) {
          updateBox(layoutParent.id, {
            children: layoutReorder.newChildOrder,
          });
          recalculateLayout(layoutParent.id);

          setDragState({
            isDragging: false,
            draggedBoxIds: [],
            initialAbsolutePositions: new Map(),
            startCanvasPos: { x: 0, y: 0 },
            currentCanvasPos: { x: 0, y: 0 },
            layoutReorder: null,
            isDraggingOutside: false,
          });
          return;
        }
      }
    }

    if (onDragEnd) {
      onDragEnd(draggedBoxIds, finalDelta);
    }

    setDragState({
      isDragging: false,
      draggedBoxIds: [],
      initialAbsolutePositions: new Map(),
      startCanvasPos: { x: 0, y: 0 },
      currentCanvasPos: { x: 0, y: 0 },
      layoutReorder: null,
      isDraggingOutside: false,
    });
  }, [onDragEnd, boxes, detachFromParent, updateBox]);

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedBoxIds: [],
      initialAbsolutePositions: new Map(),
      startCanvasPos: { x: 0, y: 0 },
      currentCanvasPos: { x: 0, y: 0 },
      layoutReorder: null,
      isDraggingOutside: false,
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
    layoutReorder: dragState.layoutReorder,
    isDraggingOutsideLayout: dragState.isDraggingOutside,
  };
};
