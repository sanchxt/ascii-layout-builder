import type { Box, ResizeHandle, ResizeHandlePosition } from "@/types/box";
import type { CanvasPosition } from "@/types/canvas";
import { BOX_CONSTANTS } from "@/lib/constants";

export const getResizeHandles = (box: Box): ResizeHandlePosition[] => {
  const { x, y, width, height } = box;

  return [
    {
      handle: "top-left",
      x,
      y,
      cursor: "nwse-resize",
    },
    {
      handle: "top",
      x: x + width / 2,
      y,
      cursor: "ns-resize",
    },
    {
      handle: "top-right",
      x: x + width,
      y,
      cursor: "nesw-resize",
    },
    {
      handle: "right",
      x: x + width,
      y: y + height / 2,
      cursor: "ew-resize",
    },
    {
      handle: "bottom-right",
      x: x + width,
      y: y + height,
      cursor: "nwse-resize",
    },
    {
      handle: "bottom",
      x: x + width / 2,
      y: y + height,
      cursor: "ns-resize",
    },
    {
      handle: "bottom-left",
      x,
      y: y + height,
      cursor: "nesw-resize",
    },
    {
      handle: "left",
      x,
      y: y + height / 2,
      cursor: "ew-resize",
    },
  ];
};

export const getHandleAtPoint = (
  point: CanvasPosition,
  box: Box,
  zoom = 1
): ResizeHandle | null => {
  const handles = getResizeHandles(box);
  const hitArea = BOX_CONSTANTS.HANDLE_HIT_AREA / zoom;

  for (const handle of handles) {
    const dx = Math.abs(point.x - handle.x);
    const dy = Math.abs(point.y - handle.y);

    if (dx <= hitArea && dy <= hitArea) {
      return handle.handle;
    }
  }

  return null;
};

export const calculateResizedBox = (
  box: Box,
  handle: ResizeHandle,
  newPoint: CanvasPosition
): Partial<Box> => {
  const { x, y, width, height } = box;
  let newX = x;
  let newY = y;
  let newWidth = width;
  let newHeight = height;

  switch (handle) {
    case "top-left":
      newX = newPoint.x;
      newY = newPoint.y;
      newWidth = x + width - newPoint.x;
      newHeight = y + height - newPoint.y;
      break;

    case "top":
      newY = newPoint.y;
      newHeight = y + height - newPoint.y;
      break;

    case "top-right":
      newY = newPoint.y;
      newWidth = newPoint.x - x;
      newHeight = y + height - newPoint.y;
      break;

    case "right":
      newWidth = newPoint.x - x;
      break;

    case "bottom-right":
      newWidth = newPoint.x - x;
      newHeight = newPoint.y - y;
      break;

    case "bottom":
      newHeight = newPoint.y - y;
      break;

    case "bottom-left":
      newX = newPoint.x;
      newWidth = x + width - newPoint.x;
      newHeight = newPoint.y - y;
      break;

    case "left":
      newX = newPoint.x;
      newWidth = x + width - newPoint.x;
      break;
  }

  if (newWidth < BOX_CONSTANTS.MIN_WIDTH) {
    if (handle.includes("left")) {
      newX = x + width - BOX_CONSTANTS.MIN_WIDTH;
    }
    newWidth = BOX_CONSTANTS.MIN_WIDTH;
  }

  if (newHeight < BOX_CONSTANTS.MIN_HEIGHT) {
    if (handle.includes("top")) {
      newY = y + height - BOX_CONSTANTS.MIN_HEIGHT;
    }
    newHeight = BOX_CONSTANTS.MIN_HEIGHT;
  }

  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  };
};

export const getCursorForHandle = (handle: ResizeHandle): string => {
  const cursorMap: Record<ResizeHandle, string> = {
    "top-left": "nwse-resize",
    top: "ns-resize",
    "top-right": "nesw-resize",
    right: "ew-resize",
    "bottom-right": "nwse-resize",
    bottom: "ns-resize",
    "bottom-left": "nesw-resize",
    left: "ew-resize",
  };

  return cursorMap[handle];
};

export const isPointOnBoxBorder = (
  point: CanvasPosition,
  box: Box,
  threshold = 5
): boolean => {
  const { x, y, width, height } = box;

  const onLeftBorder =
    Math.abs(point.x - x) <= threshold && point.y >= y && point.y <= y + height;

  const onRightBorder =
    Math.abs(point.x - (x + width)) <= threshold &&
    point.y >= y &&
    point.y <= y + height;

  const onTopBorder =
    Math.abs(point.y - y) <= threshold && point.x >= x && point.x <= x + width;

  const onBottomBorder =
    Math.abs(point.y - (y + height)) <= threshold &&
    point.x >= x &&
    point.x <= x + width;

  return onLeftBorder || onRightBorder || onTopBorder || onBottomBorder;
};
