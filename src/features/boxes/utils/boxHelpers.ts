import type { Box, BorderStyle } from "@/types/box";
import type { CanvasPosition } from "@/types/canvas";
import { BOX_CONSTANTS } from "@/lib/constants";

export const generateBoxId = (): string => {
  return crypto.randomUUID();
};

export const isPointInBox = (point: CanvasPosition, box: Box): boolean => {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
};

export const getBoxAtPoint = (
  point: CanvasPosition,
  boxes: Box[]
): Box | null => {
  const matchingBoxes = boxes.filter((box) => isPointInBox(point, box));

  if (matchingBoxes.length === 0) return null;

  return matchingBoxes.reduce((highest, current) =>
    current.zIndex > highest.zIndex ? current : highest
  );
};

export const clampBoxSize = (
  box: Partial<Box>,
  minWidth = BOX_CONSTANTS.MIN_WIDTH,
  minHeight = BOX_CONSTANTS.MIN_HEIGHT
): Partial<Box> => {
  return {
    ...box,
    width: Math.max(box.width || minWidth, minWidth),
    height: Math.max(box.height || minHeight, minHeight),
  };
};

export const clampBoxSizeWithAnchor = (
  box: Partial<Box>,
  anchorX: number,
  anchorY: number,
  minWidth = BOX_CONSTANTS.MIN_WIDTH,
  minHeight = BOX_CONSTANTS.MIN_HEIGHT
): Partial<Box> => {
  let { x = 0, y = 0, width = 0, height = 0 } = box;

  if (width < minWidth) {
    width = minWidth;
    if (x < anchorX) {
      x = anchorX - minWidth;
    }
  }

  if (height < minHeight) {
    height = minHeight;
    if (y < anchorY) {
      y = anchorY - minHeight;
    }
  }

  return {
    ...box,
    x,
    y,
    width,
    height,
  };
};

export const getBorderStyleCharacters = (
  style: BorderStyle
): {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
} => {
  switch (style) {
    case "single":
      return {
        topLeft: "┌",
        topRight: "┐",
        bottomLeft: "└",
        bottomRight: "┘",
        horizontal: "─",
        vertical: "│",
      };
    case "double":
      return {
        topLeft: "╔",
        topRight: "╗",
        bottomLeft: "╚",
        bottomRight: "╝",
        horizontal: "═",
        vertical: "║",
      };
    case "dashed":
      return {
        topLeft: "┌",
        topRight: "┐",
        bottomLeft: "└",
        bottomRight: "┘",
        horizontal: "╌",
        vertical: "╎",
      };
  }
};

export const createDefaultBox = (
  x: number,
  y: number,
  width?: number,
  height?: number
): Box => {
  const boxWidth = width ?? BOX_CONSTANTS.DEFAULT_WIDTH;
  const boxHeight = height ?? BOX_CONSTANTS.DEFAULT_HEIGHT;
  return {
    id: generateBoxId(),
    x,
    y,
    width: boxWidth,
    height: boxHeight,
    borderStyle: BOX_CONSTANTS.DEFAULT_BORDER_STYLE,
    padding: BOX_CONSTANTS.DEFAULT_PADDING,
    text: {
      value: "",
      alignment: "left",
      fontSize: "medium",
      formatting: [],
    },
    children: [],
    zIndex: 0,
  };
};

export const getMaxZIndex = (boxes: Box[]): number => {
  if (boxes.length === 0) return 0;
  return Math.max(...boxes.map((box) => box.zIndex));
};

export const getDistance = (p1: CanvasPosition, p2: CanvasPosition): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};
