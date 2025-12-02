import type { Line } from "@/types/line";
import type { Box } from "@/types/box";
import { BOX_CONSTANTS } from "@/lib/constants";
import {
  getBorderWidth,
  getAbsolutePosition as getBoxAbsolutePosition,
  getNestingDepth as getBoxNestingDepth,
} from "@/features/boxes/utils/boxHierarchy";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";

export const getLineAbsolutePosition = (
  line: Line,
  boxes: Box[]
): { startX: number; startY: number; endX: number; endY: number } => {
  if (!line.parentId) {
    const artboardOffset = getArtboardOffset(line.artboardId);
    return {
      startX: line.startX + artboardOffset.x,
      startY: line.startY + artboardOffset.y,
      endX: line.endX + artboardOffset.x,
      endY: line.endY + artboardOffset.y,
    };
  }

  const parentBox = boxes.find((b) => b.id === line.parentId);
  if (!parentBox) {
    const artboardOffset = getArtboardOffset(line.artboardId);
    return {
      startX: line.startX + artboardOffset.x,
      startY: line.startY + artboardOffset.y,
      endX: line.endX + artboardOffset.x,
      endY: line.endY + artboardOffset.y,
    };
  }

  const parentAbsPos = getBoxAbsolutePosition(parentBox, boxes);
  const borderWidth = getBorderWidth(parentBox.borderStyle);
  const offset = borderWidth + parentBox.padding;

  return {
    startX: line.startX + parentAbsPos.x + offset,
    startY: line.startY + parentAbsPos.y + offset,
    endX: line.endX + parentAbsPos.x + offset,
    endY: line.endY + parentAbsPos.y + offset,
  };
};

const getArtboardOffset = (
  artboardId: string | undefined
): { x: number; y: number } => {
  if (!artboardId) return { x: 0, y: 0 };
  const artboard = useArtboardStore
    .getState()
    .artboards.find((a) => a.id === artboardId);
  return artboard ? { x: artboard.x, y: artboard.y } : { x: 0, y: 0 };
};

export const convertLineToParentRelative = (
  coords: { startX: number; startY: number; endX: number; endY: number },
  parent: Box,
  boxes: Box[]
): { startX: number; startY: number; endX: number; endY: number } => {
  const parentAbsPos = getBoxAbsolutePosition(parent, boxes);
  const borderWidth = getBorderWidth(parent.borderStyle);
  const offset = borderWidth + parent.padding;

  return {
    startX: coords.startX - parentAbsPos.x - offset,
    startY: coords.startY - parentAbsPos.y - offset,
    endX: coords.endX - parentAbsPos.x - offset,
    endY: coords.endY - parentAbsPos.y - offset,
  };
};

export const convertLineToCanvasAbsolute = (
  coords: { startX: number; startY: number; endX: number; endY: number },
  parent: Box,
  boxes: Box[]
): { startX: number; startY: number; endX: number; endY: number } => {
  const parentAbsPos = getBoxAbsolutePosition(parent, boxes);
  const borderWidth = getBorderWidth(parent.borderStyle);
  const offset = borderWidth + parent.padding;

  return {
    startX: coords.startX + parentAbsPos.x + offset,
    startY: coords.startY + parentAbsPos.y + offset,
    endX: coords.endX + parentAbsPos.x + offset,
    endY: coords.endY + parentAbsPos.y + offset,
  };
};

export const getLinesInBox = (boxId: string, lines: Line[]): Line[] => {
  return lines.filter((line) => line.parentId === boxId);
};

export const getRootLines = (lines: Line[]): Line[] => {
  return lines.filter((line) => !line.parentId);
};

export const canNestLine = (box: Box, boxes: Box[]): boolean => {
  if (box.locked) {
    return false;
  }

  const boxDepth = getBoxNestingDepth(box.id, boxes);
  if (boxDepth >= BOX_CONSTANTS.MAX_NESTING_DEPTH) {
    return false;
  }

  return true;
};

export const getLineBounds = (
  line: Line,
  boxes: Box[]
): { x: number; y: number; width: number; height: number } => {
  const absPos = getLineAbsolutePosition(line, boxes);

  const minX = Math.min(absPos.startX, absPos.endX);
  const minY = Math.min(absPos.startY, absPos.endY);
  const maxX = Math.max(absPos.startX, absPos.endX);
  const maxY = Math.max(absPos.startY, absPos.endY);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const isPointNearLineAbsolute = (
  px: number,
  py: number,
  line: Line,
  boxes: Box[],
  tolerance: number = 5
): boolean => {
  const absPos = getLineAbsolutePosition(line, boxes);

  const dx = absPos.endX - absPos.startX;
  const dy = absPos.endY - absPos.startY;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    const dist = Math.sqrt(
      Math.pow(px - absPos.startX, 2) + Math.pow(py - absPos.startY, 2)
    );
    return dist <= tolerance;
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((px - absPos.startX) * dx + (py - absPos.startY) * dy) / lengthSquared
    )
  );

  const projX = absPos.startX + t * dx;
  const projY = absPos.startY + t * dy;

  const dist = Math.sqrt(Math.pow(px - projX, 2) + Math.pow(py - projY, 2));
  return dist <= tolerance;
};

export const lineIntersectsRect = (
  line: Line,
  boxes: Box[],
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean => {
  const absPos = getLineAbsolutePosition(line, boxes);

  const startInRect =
    absPos.startX >= rectX &&
    absPos.startX <= rectX + rectWidth &&
    absPos.startY >= rectY &&
    absPos.startY <= rectY + rectHeight;

  const endInRect =
    absPos.endX >= rectX &&
    absPos.endX <= rectX + rectWidth &&
    absPos.endY >= rectY &&
    absPos.endY <= rectY + rectHeight;

  if (startInRect || endInRect) {
    return true;
  }

  const rectRight = rectX + rectWidth;
  const rectBottom = rectY + rectHeight;

  return (
    lineSegmentsIntersect(
      absPos.startX,
      absPos.startY,
      absPos.endX,
      absPos.endY,
      rectX,
      rectY,
      rectRight,
      rectY
    ) || // top
    lineSegmentsIntersect(
      absPos.startX,
      absPos.startY,
      absPos.endX,
      absPos.endY,
      rectRight,
      rectY,
      rectRight,
      rectBottom
    ) || // right
    lineSegmentsIntersect(
      absPos.startX,
      absPos.startY,
      absPos.endX,
      absPos.endY,
      rectX,
      rectBottom,
      rectRight,
      rectBottom
    ) || // bottom
    lineSegmentsIntersect(
      absPos.startX,
      absPos.startY,
      absPos.endX,
      absPos.endY,
      rectX,
      rectY,
      rectX,
      rectBottom
    ) // left
  );
};

const lineSegmentsIntersect = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean => {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return false;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
};
