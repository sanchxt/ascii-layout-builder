import { useCallback, useState } from "react";
import { useLineStore, getMaxZIndexAcrossAll } from "../store/lineStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import type { CanvasPosition } from "@/types/canvas";
import type { Line, LineDirection, BoxConnectionPoint } from "@/types/line";
import { LINE_CONSTANTS, CANVAS_CONSTANTS } from "@/lib/constants";
import {
  getLineDirection,
  constrainToDirection,
  findNearbyBoxConnection,
  isLineValid,
  snapToGrid,
} from "../utils/lineGeometry";
import {
  convertLineToParentRelative,
  canNestLine,
} from "../utils/lineHierarchy";
import {
  getAbsolutePosition,
  getNestingDepth,
} from "@/features/boxes/utils/boxHierarchy";
import { BOX_CONSTANTS } from "@/lib/constants";

interface StartPoint {
  x: number;
  y: number;
}

export const useLineCreation = () => {
  const addLine = useLineStore((state) => state.addLine);
  const setTempLine = useLineStore((state) => state.setTempLine);
  const tempLine = useLineStore((state) => state.tempLine);
  const setLineCreationMode = useLineStore(
    (state) => state.setLineCreationMode
  );

  const boxes = useBoxStore((state) => state.boxes);
  const { viewport } = useCanvasStore();
  const activeArtboardId = useArtboardStore((state) => state.activeArtboardId);

  const [startPoint, setStartPoint] = useState<StartPoint | null>(null);
  const [direction, setDirection] = useState<LineDirection | null>(null);
  const [startConnection, setStartConnection] = useState<{
    boxId: string;
    connection: BoxConnectionPoint;
    point: { x: number; y: number };
  } | null>(null);

  const startCreating = useCallback(
    (point: CanvasPosition) => {
      setLineCreationMode("drawing");

      const nearbyConnection = findNearbyBoxConnection(point.x, point.y, boxes);

      let startX = point.x;
      let startY = point.y;

      if (nearbyConnection) {
        startX = nearbyConnection.point.x;
        startY = nearbyConnection.point.y;
        setStartConnection(nearbyConnection);
      } else {
        setStartConnection(null);
        if (viewport.snapToGrid) {
          startX = snapToGrid(startX, CANVAS_CONSTANTS.GRID_SIZE);
          startY = snapToGrid(startY, CANVAS_CONSTANTS.GRID_SIZE);
        }
      }

      setStartPoint({ x: startX, y: startY });
      setDirection(null);

      setTempLine({
        id: crypto.randomUUID(),
        startX,
        startY,
        endX: startX,
        endY: startY,
        direction: "horizontal",
        startArrow: LINE_CONSTANTS.DEFAULT_ARROW_STYLE,
        endArrow: LINE_CONSTANTS.DEFAULT_ARROW_STYLE,
        lineStyle: LINE_CONSTANTS.DEFAULT_LINE_STYLE,
        outputMode: LINE_CONSTANTS.DEFAULT_OUTPUT_MODE,
        artboardId: activeArtboardId || undefined,
        zIndex: getMaxZIndexAcrossAll() + 1,
        visible: true,
        locked: false,
        startConnection: nearbyConnection?.connection,
      });
    },
    [
      setLineCreationMode,
      setTempLine,
      boxes,
      viewport.snapToGrid,
      activeArtboardId,
    ]
  );

  const updateCreating = useCallback(
    (currentPoint: CanvasPosition) => {
      if (!tempLine || !startPoint) return;

      let endX = currentPoint.x;
      let endY = currentPoint.y;

      let currentDirection = direction;
      if (!currentDirection) {
        const deltaX = Math.abs(currentPoint.x - startPoint.x);
        const deltaY = Math.abs(currentPoint.y - startPoint.y);

        if (deltaX > 5 || deltaY > 5) {
          currentDirection = getLineDirection(
            startPoint.x,
            startPoint.y,
            currentPoint.x,
            currentPoint.y
          );
          setDirection(currentDirection);
        } else {
          return;
        }
      }

      const constrained = constrainToDirection(
        startPoint.x,
        startPoint.y,
        endX,
        endY,
        currentDirection
      );
      endX = constrained.endX;
      endY = constrained.endY;

      const nearbyEndConnection = findNearbyBoxConnection(
        endX,
        endY,
        boxes,
        startConnection ? [startConnection.boxId] : []
      );

      if (nearbyEndConnection) {
        if (currentDirection === "horizontal") {
          endX = nearbyEndConnection.point.x;
        } else {
          endY = nearbyEndConnection.point.y;
        }
      } else if (viewport.snapToGrid) {
        if (currentDirection === "horizontal") {
          endX = snapToGrid(endX, CANVAS_CONSTANTS.GRID_SIZE);
        } else {
          endY = snapToGrid(endY, CANVAS_CONSTANTS.GRID_SIZE);
        }
      }

      setTempLine({
        ...tempLine,
        endX,
        endY,
        direction: currentDirection,
        endConnection: nearbyEndConnection?.connection,
      });
    },
    [
      tempLine,
      startPoint,
      direction,
      boxes,
      startConnection,
      viewport.snapToGrid,
      setTempLine,
    ]
  );

  const findContainingBox = useCallback(
    (x: number, y: number) => {
      const threshold = BOX_CONSTANTS.NESTING_DROP_ZONE_THRESHOLD;

      const containingBoxes = boxes.filter((box) => {
        if (box.locked || box.visible === false) return false;

        const absPos = getAbsolutePosition(box, boxes);
        return (
          x >= absPos.x + threshold &&
          x <= absPos.x + box.width - threshold &&
          y >= absPos.y + threshold &&
          y <= absPos.y + box.height - threshold
        );
      });

      if (containingBoxes.length === 0) return null;

      return containingBoxes.reduce((deepest, current) => {
        const deepestDepth = getNestingDepth(deepest.id, boxes);
        const currentDepth = getNestingDepth(current.id, boxes);
        return currentDepth > deepestDepth ? current : deepest;
      });
    },
    [boxes]
  );

  const finishCreating = useCallback(() => {
    if (!tempLine) {
      setTempLine(null);
      setLineCreationMode("idle");
      setStartPoint(null);
      setDirection(null);
      setStartConnection(null);
      return;
    }

    if (isLineValid(tempLine)) {
      const lineCoords = {
        startX: tempLine.startX!,
        startY: tempLine.startY!,
        endX: tempLine.endX!,
        endY: tempLine.endY!,
      };

      const midX = (lineCoords.startX + lineCoords.endX) / 2;
      const midY = (lineCoords.startY + lineCoords.endY) / 2;
      const containingBox = findContainingBox(midX, midY);

      let finalCoords = lineCoords;
      let parentId: string | undefined;
      let artboardId = tempLine.artboardId;

      if (containingBox && canNestLine(containingBox, boxes)) {
        parentId = containingBox.id;
        artboardId = undefined;
        finalCoords = convertLineToParentRelative(
          lineCoords,
          containingBox,
          boxes
        );
      }

      const newLine: Line = {
        id: tempLine.id!,
        startX: finalCoords.startX,
        startY: finalCoords.startY,
        endX: finalCoords.endX,
        endY: finalCoords.endY,
        direction: tempLine.direction!,
        startArrow: tempLine.startArrow!,
        endArrow: tempLine.endArrow!,
        lineStyle: tempLine.lineStyle!,
        outputMode: tempLine.outputMode!,
        artboardId,
        parentId,
        zIndex: tempLine.zIndex!,
        visible: true,
        locked: false,
        startConnection: tempLine.startConnection,
        endConnection: tempLine.endConnection,
      };

      addLine(newLine);
    }

    setTempLine(null);
    setLineCreationMode("idle");
    setStartPoint(null);
    setDirection(null);
    setStartConnection(null);
  }, [
    tempLine,
    addLine,
    setTempLine,
    setLineCreationMode,
    findContainingBox,
    boxes,
  ]);

  const cancelCreating = useCallback(() => {
    setTempLine(null);
    setLineCreationMode("idle");
    setStartPoint(null);
    setDirection(null);
    setStartConnection(null);
  }, [setTempLine, setLineCreationMode]);

  return {
    startCreating,
    updateCreating,
    finishCreating,
    cancelCreating,
    tempLine,
    isCreating: !!startPoint,
    currentDirection: direction,
    startConnection,
  };
};
