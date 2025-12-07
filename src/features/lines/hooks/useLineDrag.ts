import { useState, useCallback, useRef } from "react";
import { useLineStore } from "../store/lineStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import type { Line } from "@/types/line";
import type { Box } from "@/types/box";
import { snapToGrid } from "../utils/lineGeometry";
import {
  getLineAbsolutePosition,
  convertLineToParentRelative,
  canNestLine,
} from "../utils/lineHierarchy";
import {
  getAbsolutePosition,
  getNestingDepth,
} from "@/features/boxes/utils/boxHierarchy";
import { CANVAS_CONSTANTS } from "@/lib/constants";

interface LineDragState {
  isDragging: boolean;
  draggedLineId: string | null;
  dragHandle: "line" | "start" | "end" | null;
  startCanvasPos: { x: number; y: number };
  currentCanvasPos: { x: number; y: number };
  initialLineState: Line | null;
}

const initialDragState: LineDragState = {
  isDragging: false,
  draggedLineId: null,
  dragHandle: null,
  startCanvasPos: { x: 0, y: 0 },
  currentCanvasPos: { x: 0, y: 0 },
  initialLineState: null,
};

export const useLineDrag = () => {
  const [dragState, setDragState] = useState<LineDragState>(initialDragState);

  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const lines = useLineStore((state) => state.lines);
  const updateLine = useLineStore((state) => state.updateLine);
  const setParent = useLineStore((state) => state.setParent);
  const detachFromParent = useLineStore((state) => state.detachFromParent);
  const boxes = useBoxStore((state) => state.boxes);
  const { viewport } = useCanvasStore();

  const findContainingBox = useCallback(
    (x: number, y: number, excludeBoxId?: string): Box | null => {
      const visibleBoxes = boxes.filter(
        (b) => b.visible !== false && !b.locked
      );

      let deepestBox: Box | null = null;
      let maxDepth = -1;

      for (const box of visibleBoxes) {
        if (excludeBoxId && box.id === excludeBoxId) continue;

        const absPos = getAbsolutePosition(box, boxes);

        if (
          x >= absPos.x &&
          x <= absPos.x + box.width &&
          y >= absPos.y &&
          y <= absPos.y + box.height
        ) {
          const depth = getNestingDepth(box.id, boxes);
          if (depth > maxDepth) {
            maxDepth = depth;
            deepestBox = box;
          } else if (
            depth === maxDepth &&
            deepestBox &&
            box.zIndex > deepestBox.zIndex
          ) {
            deepestBox = box;
          }
        }
      }

      return deepestBox;
    },
    [boxes]
  );

  const startDrag = useCallback(
    (
      lineId: string,
      canvasX: number,
      canvasY: number,
      handle: "line" | "start" | "end" = "line"
    ) => {
      const line = lines.find((l) => l.id === lineId);
      if (!line || line.locked) return;

      setDragState({
        isDragging: true,
        draggedLineId: lineId,
        dragHandle: handle,
        startCanvasPos: { x: canvasX, y: canvasY },
        currentCanvasPos: { x: canvasX, y: canvasY },
        initialLineState: { ...line },
      });
    },
    [lines]
  );

  const updateDrag = useCallback((canvasX: number, canvasY: number) => {
    if (!dragStateRef.current.isDragging) return;

    setDragState((prev) => ({
      ...prev,
      currentCanvasPos: { x: canvasX, y: canvasY },
    }));
  }, []);

  const endDrag = useCallback(() => {
    const currentDragState = dragStateRef.current;

    if (
      !currentDragState.isDragging ||
      !currentDragState.draggedLineId ||
      !currentDragState.initialLineState
    ) {
      setDragState(initialDragState);
      return;
    }

    const deltaX =
      currentDragState.currentCanvasPos.x - currentDragState.startCanvasPos.x;
    const deltaY =
      currentDragState.currentCanvasPos.y - currentDragState.startCanvasPos.y;
    const initial = currentDragState.initialLineState;

    const initialAbsPos = initial.parentId
      ? getLineAbsolutePosition(initial, boxes)
      : {
          startX: initial.startX,
          startY: initial.startY,
          endX: initial.endX,
          endY: initial.endY,
        };

    let finalAbsStartX: number;
    let finalAbsStartY: number;
    let finalAbsEndX: number;
    let finalAbsEndY: number;

    if (currentDragState.dragHandle === "line") {
      finalAbsStartX = initialAbsPos.startX + deltaX;
      finalAbsStartY = initialAbsPos.startY + deltaY;
      finalAbsEndX = initialAbsPos.endX + deltaX;
      finalAbsEndY = initialAbsPos.endY + deltaY;
    } else if (currentDragState.dragHandle === "start") {
      if (initial.direction === "horizontal") {
        finalAbsStartX = initialAbsPos.startX + deltaX;
        finalAbsStartY = initialAbsPos.startY;
      } else {
        finalAbsStartX = initialAbsPos.startX;
        finalAbsStartY = initialAbsPos.startY + deltaY;
      }
      finalAbsEndX = initialAbsPos.endX;
      finalAbsEndY = initialAbsPos.endY;
    } else {
      finalAbsStartX = initialAbsPos.startX;
      finalAbsStartY = initialAbsPos.startY;
      if (initial.direction === "horizontal") {
        finalAbsEndX = initialAbsPos.endX + deltaX;
        finalAbsEndY = initialAbsPos.endY;
      } else {
        finalAbsEndX = initialAbsPos.endX;
        finalAbsEndY = initialAbsPos.endY + deltaY;
      }
    }

    if (viewport.snapToGrid) {
      finalAbsStartX = snapToGrid(finalAbsStartX, CANVAS_CONSTANTS.GRID_SIZE);
      finalAbsStartY = snapToGrid(finalAbsStartY, CANVAS_CONSTANTS.GRID_SIZE);
      finalAbsEndX = snapToGrid(finalAbsEndX, CANVAS_CONSTANTS.GRID_SIZE);
      finalAbsEndY = snapToGrid(finalAbsEndY, CANVAS_CONSTANTS.GRID_SIZE);
    }

    const midX = (finalAbsStartX + finalAbsEndX) / 2;
    const midY = (finalAbsStartY + finalAbsEndY) / 2;
    const containingBox = findContainingBox(midX, midY);

    const currentParentId = initial.parentId;
    const newParentId = containingBox?.id;

    if (newParentId !== currentParentId) {
      if (newParentId && canNestLine(containingBox!, boxes)) {
        const relative = convertLineToParentRelative(
          {
            startX: finalAbsStartX,
            startY: finalAbsStartY,
            endX: finalAbsEndX,
            endY: finalAbsEndY,
          },
          containingBox!,
          boxes
        );

        updateLine(currentDragState.draggedLineId!, {
          startX: relative.startX,
          startY: relative.startY,
          endX: relative.endX,
          endY: relative.endY,
          startConnection: undefined,
          endConnection: undefined,
        });
        setParent(currentDragState.draggedLineId!, newParentId);
      } else {
        if (currentParentId) {
          detachFromParent(currentDragState.draggedLineId!);
        }
        updateLine(currentDragState.draggedLineId!, {
          startX: finalAbsStartX,
          startY: finalAbsStartY,
          endX: finalAbsEndX,
          endY: finalAbsEndY,
          startConnection: undefined,
          endConnection: undefined,
        });
      }
    } else {
      if (currentParentId) {
        const parentBox = boxes.find((b) => b.id === currentParentId);
        if (parentBox) {
          const relative = convertLineToParentRelative(
            {
              startX: finalAbsStartX,
              startY: finalAbsStartY,
              endX: finalAbsEndX,
              endY: finalAbsEndY,
            },
            parentBox,
            boxes
          );
          updateLine(currentDragState.draggedLineId!, {
            startX: relative.startX,
            startY: relative.startY,
            endX: relative.endX,
            endY: relative.endY,
            startConnection: undefined,
            endConnection: undefined,
          });
        }
      } else {
        updateLine(currentDragState.draggedLineId!, {
          startX: finalAbsStartX,
          startY: finalAbsStartY,
          endX: finalAbsEndX,
          endY: finalAbsEndY,
          startConnection: undefined,
          endConnection: undefined,
        });
      }
    }

    setDragState(initialDragState);
  }, [
    updateLine,
    setParent,
    detachFromParent,
    viewport.snapToGrid,
    boxes,
    findContainingBox,
  ]);

  const cancelDrag = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  const getLinePreviewPosition = useCallback(
    (
      lineId: string
    ): {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    } | null => {
      if (
        !dragState.isDragging ||
        dragState.draggedLineId !== lineId ||
        !dragState.initialLineState
      ) {
        return null;
      }

      const deltaX = dragState.currentCanvasPos.x - dragState.startCanvasPos.x;
      const deltaY = dragState.currentCanvasPos.y - dragState.startCanvasPos.y;
      const initial = dragState.initialLineState;

      const initialAbs = initial.parentId
        ? getLineAbsolutePosition(initial, boxes)
        : {
            startX: initial.startX,
            startY: initial.startY,
            endX: initial.endX,
            endY: initial.endY,
          };

      if (dragState.dragHandle === "line") {
        return {
          startX: initialAbs.startX + deltaX,
          startY: initialAbs.startY + deltaY,
          endX: initialAbs.endX + deltaX,
          endY: initialAbs.endY + deltaY,
        };
      } else if (dragState.dragHandle === "start") {
        if (initial.direction === "horizontal") {
          return {
            startX: initialAbs.startX + deltaX,
            startY: initialAbs.startY,
            endX: initialAbs.endX,
            endY: initialAbs.endY,
          };
        } else {
          return {
            startX: initialAbs.startX,
            startY: initialAbs.startY + deltaY,
            endX: initialAbs.endX,
            endY: initialAbs.endY,
          };
        }
      } else if (dragState.dragHandle === "end") {
        if (initial.direction === "horizontal") {
          return {
            startX: initialAbs.startX,
            startY: initialAbs.startY,
            endX: initialAbs.endX + deltaX,
            endY: initialAbs.endY,
          };
        } else {
          return {
            startX: initialAbs.startX,
            startY: initialAbs.startY,
            endX: initialAbs.endX,
            endY: initialAbs.endY + deltaY,
          };
        }
      }

      return null;
    },
    [dragState, boxes]
  );

  const isDragging = dragState.isDragging;

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    isDragging,
    getLinePreviewPosition,
  };
};
