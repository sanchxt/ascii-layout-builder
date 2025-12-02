import type { Line, LineDirection, BoxConnectionPoint } from "@/types/line";
import type { Box } from "@/types/box";
import { LINE_CONSTANTS } from "@/lib/constants";
import { getLineAbsolutePosition } from "./lineHierarchy";

export function pointToLineDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) {
    return Math.sqrt(A * A + B * B);
  }

  let t = dot / lenSq;

  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * C;
  const closestY = y1 + t * D;

  const dx = px - closestX;
  const dy = py - closestY;

  return Math.sqrt(dx * dx + dy * dy);
}

export function isPointNearLine(
  px: number,
  py: number,
  line: Line,
  tolerance: number = LINE_CONSTANTS.SELECTION_TOLERANCE,
  boxes?: Box[]
): boolean {
  let startX = line.startX;
  let startY = line.startY;
  let endX = line.endX;
  let endY = line.endY;

  if (line.parentId && boxes) {
    const absPos = getLineAbsolutePosition(line, boxes);
    startX = absPos.startX;
    startY = absPos.startY;
    endX = absPos.endX;
    endY = absPos.endY;
  }

  const distance = pointToLineDistance(px, py, startX, startY, endX, endY);
  return distance <= tolerance;
}

export function isPointNearEndpoint(
  px: number,
  py: number,
  endpointX: number,
  endpointY: number,
  tolerance: number = LINE_CONSTANTS.ENDPOINT_HANDLE_SIZE
): boolean {
  const dx = px - endpointX;
  const dy = py - endpointY;
  return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}

export function getLineDirection(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): LineDirection {
  const deltaX = Math.abs(endX - startX);
  const deltaY = Math.abs(endY - startY);
  return deltaX >= deltaY ? "horizontal" : "vertical";
}

export function constrainToDirection(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  direction: LineDirection
): { endX: number; endY: number } {
  if (direction === "horizontal") {
    return { endX, endY: startY };
  } else {
    return { endX: startX, endY };
  }
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function getLineLength(line: Line): number {
  const dx = line.endX - line.startX;
  const dy = line.endY - line.startY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isLineValid(line: Partial<Line>): boolean {
  if (
    line.startX === undefined ||
    line.startY === undefined ||
    line.endX === undefined ||
    line.endY === undefined
  ) {
    return false;
  }

  const dx = line.endX - line.startX;
  const dy = line.endY - line.startY;
  const length = Math.sqrt(dx * dx + dy * dy);

  return length >= LINE_CONSTANTS.MIN_LENGTH;
}

export function getLineMidpoint(line: Line): { x: number; y: number } {
  return {
    x: (line.startX + line.endX) / 2,
    y: (line.startY + line.endY) / 2,
  };
}

export function getPointAlongLine(
  line: Line,
  position: number
): { x: number; y: number } {
  const t = Math.max(0, Math.min(1, position));
  return {
    x: line.startX + (line.endX - line.startX) * t,
    y: line.startY + (line.endY - line.startY) * t,
  };
}

export function getLineBoundingBox(line: Line): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const minX = Math.min(line.startX, line.endX);
  const minY = Math.min(line.startY, line.endY);
  const maxX = Math.max(line.startX, line.endX);
  const maxY = Math.max(line.startY, line.endY);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function lineIntersectsRect(
  line: Line,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  const bbox = getLineBoundingBox(line);

  const boxesOverlap =
    bbox.x < rectX + rectWidth &&
    bbox.x + bbox.width > rectX &&
    bbox.y < rectY + rectHeight &&
    bbox.y + bbox.height > rectY;

  if (!boxesOverlap) return false;

  return true;
}

export function findClosestBoxEdgePoint(
  px: number,
  py: number,
  box: Box
): {
  point: { x: number; y: number };
  side: BoxConnectionPoint["side"];
  offset: number;
} {
  const boxRight = box.x + box.width;
  const boxBottom = box.y + box.height;

  const distances = [
    { side: "top" as const, distance: Math.abs(py - box.y), y: box.y },
    {
      side: "bottom" as const,
      distance: Math.abs(py - boxBottom),
      y: boxBottom,
    },
    { side: "left" as const, distance: Math.abs(px - box.x), x: box.x },
    { side: "right" as const, distance: Math.abs(px - boxRight), x: boxRight },
  ];

  const closest = distances.reduce((min, curr) =>
    curr.distance < min.distance ? curr : min
  );

  let point: { x: number; y: number };
  let offset: number;

  if (closest.side === "top" || closest.side === "bottom") {
    const clampedX = Math.max(box.x, Math.min(px, boxRight));
    point = { x: clampedX, y: closest.y! };
    offset = (clampedX - box.x) / box.width;
  } else {
    const clampedY = Math.max(box.y, Math.min(py, boxBottom));
    point = { x: closest.x!, y: clampedY };
    offset = (clampedY - box.y) / box.height;
  }

  return { point, side: closest.side, offset };
}

export function getConnectionPointCoords(
  connection: BoxConnectionPoint,
  box: Box
): { x: number; y: number } {
  switch (connection.side) {
    case "top":
      return {
        x: box.x + box.width * connection.offset,
        y: box.y,
      };
    case "bottom":
      return {
        x: box.x + box.width * connection.offset,
        y: box.y + box.height,
      };
    case "left":
      return {
        x: box.x,
        y: box.y + box.height * connection.offset,
      };
    case "right":
      return {
        x: box.x + box.width,
        y: box.y + box.height * connection.offset,
      };
  }
}

export function findNearbyBoxConnection(
  px: number,
  py: number,
  boxes: Box[],
  excludeBoxIds: string[] = [],
  snapDistance: number = LINE_CONSTANTS.CONNECTION_SNAP_DISTANCE
): {
  boxId: string;
  connection: BoxConnectionPoint;
  point: { x: number; y: number };
} | null {
  for (const box of boxes) {
    if (excludeBoxIds.includes(box.id)) continue;
    if (box.visible === false || box.locked) continue;

    const { point, side, offset } = findClosestBoxEdgePoint(px, py, box);
    const distance = Math.sqrt(
      Math.pow(px - point.x, 2) + Math.pow(py - point.y, 2)
    );

    if (distance <= snapDistance) {
      return {
        boxId: box.id,
        connection: { boxId: box.id, side, offset },
        point,
      };
    }
  }

  return null;
}
