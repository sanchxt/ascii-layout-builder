import type { Box, BorderStyle } from "@/types/box";
import { BOX_CONSTANTS } from "@/lib/constants";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";

export const getBorderWidth = (borderStyle: BorderStyle): number => {
  switch (borderStyle) {
    case "single":
      return 2;
    case "double":
      return 4;
    case "dashed":
      return 2;
  }
};

export const getChildBoxes = (parentId: string, boxes: Box[]): Box[] => {
  return boxes.filter((box) => box.parentId === parentId);
};

export const getAllDescendants = (boxId: string, boxes: Box[]): Box[] => {
  const descendants: Box[] = [];
  const children = getChildBoxes(boxId, boxes);

  for (const child of children) {
    descendants.push(child);
    descendants.push(...getAllDescendants(child.id, boxes));
  }

  return descendants;
};

export const getAncestors = (boxId: string, boxes: Box[]): Box[] => {
  const ancestors: Box[] = [];
  let currentBox = boxes.find((b) => b.id === boxId);

  while (currentBox?.parentId) {
    const parent = boxes.find((b) => b.id === currentBox?.parentId);
    if (!parent) break;
    ancestors.push(parent);
    currentBox = parent;
  }

  return ancestors;
};

export const getNestingDepth = (boxId: string, boxes: Box[]): number => {
  return getAncestors(boxId, boxes).length;
};

export const isDescendantOf = (
  childId: string,
  ancestorId: string,
  boxes: Box[]
): boolean => {
  if (childId === ancestorId) return false;
  const ancestors = getAncestors(childId, boxes);
  return ancestors.some((ancestor) => ancestor.id === ancestorId);
};

export const canNestBox = (
  childId: string,
  parentId: string,
  boxes: Box[]
): { canNest: boolean; reason?: string } => {
  if (childId === parentId) {
    return { canNest: false, reason: "Cannot nest a box into itself" };
  }

  if (isDescendantOf(parentId, childId, boxes)) {
    return {
      canNest: false,
      reason: "Cannot nest a box into its own descendant",
    };
  }

  const childBox = boxes.find((b) => b.id === childId);
  if (!childBox) {
    return { canNest: false, reason: "Child box not found" };
  }

  const parentDepth = getNestingDepth(parentId, boxes);
  const childWithDescendantsDepth = getMaxDescendantDepth(childId, boxes);

  if (
    parentDepth + 1 + childWithDescendantsDepth >
    BOX_CONSTANTS.MAX_NESTING_DEPTH
  ) {
    return {
      canNest: false,
      reason: `Would exceed maximum nesting depth of ${BOX_CONSTANTS.MAX_NESTING_DEPTH}`,
    };
  }

  return { canNest: true };
};

const getMaxDescendantDepth = (boxId: string, boxes: Box[]): number => {
  const children = getChildBoxes(boxId, boxes);
  if (children.length === 0) return 0;

  return (
    1 +
    Math.max(...children.map((child) => getMaxDescendantDepth(child.id, boxes)))
  );
};

export const getBoxBounds = (
  boxId: string,
  boxes: Box[],
  includeChildren: boolean = false
): { x: number; y: number; width: number; height: number } | null => {
  const box = boxes.find((b) => b.id === boxId);
  if (!box) return null;

  if (!includeChildren) {
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }

  const descendants = getAllDescendants(boxId, boxes);
  if (descendants.length === 0) {
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }

  const allBoxes = [box, ...descendants];
  const minX = Math.min(...allBoxes.map((b) => b.x));
  const minY = Math.min(...allBoxes.map((b) => b.y));
  const maxX = Math.max(...allBoxes.map((b) => b.x + b.width));
  const maxY = Math.max(...allBoxes.map((b) => b.y + b.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const isBoxInsideParent = (childBox: Box, parentBox: Box): boolean => {
  const threshold = BOX_CONSTANTS.AUTO_DETACH_THRESHOLD;

  const childCenterX = childBox.x + childBox.width / 2;
  const childCenterY = childBox.y + childBox.height / 2;

  const parentLeft = -threshold;
  const parentRight = parentBox.width + threshold;
  const parentTop = -threshold;
  const parentBottom = parentBox.height + threshold;

  return (
    childCenterX >= parentLeft &&
    childCenterX <= parentRight &&
    childCenterY >= parentTop &&
    childCenterY <= parentBottom
  );
};

export const isPositionInsideParent = (
  absoluteX: number,
  absoluteY: number,
  childWidth: number,
  childHeight: number,
  parentBox: Box,
  allBoxes: Box[]
): boolean => {
  const parentAbsPos = getAbsolutePosition(parentBox, allBoxes);
  const borderWidth = getBorderWidth(parentBox.borderStyle);
  const threshold = BOX_CONSTANTS.AUTO_DETACH_THRESHOLD;

  const childCenterX = absoluteX + childWidth / 2;
  const childCenterY = absoluteY + childHeight / 2;

  const parentLeft =
    parentAbsPos.x + borderWidth + parentBox.padding - threshold;
  const parentRight =
    parentAbsPos.x +
    parentBox.width -
    borderWidth -
    parentBox.padding +
    threshold;
  const parentTop =
    parentAbsPos.y + borderWidth + parentBox.padding - threshold;
  const parentBottom =
    parentAbsPos.y +
    parentBox.height -
    borderWidth -
    parentBox.padding +
    threshold;

  return (
    childCenterX >= parentLeft &&
    childCenterX <= parentRight &&
    childCenterY >= parentTop &&
    childCenterY <= parentBottom
  );
};

export const convertToParentRelative = (
  boxX: number,
  boxY: number,
  parent: Box
): { x: number; y: number } => {
  const borderWidth = getBorderWidth(parent.borderStyle);
  return {
    x: boxX - parent.x - borderWidth - parent.padding,
    y: boxY - parent.y - borderWidth - parent.padding,
  };
};

export const convertToCanvasAbsolute = (
  boxX: number,
  boxY: number,
  parent: Box
): { x: number; y: number } => {
  const borderWidth = getBorderWidth(parent.borderStyle);
  return {
    x: parent.x + borderWidth + parent.padding + boxX,
    y: parent.y + borderWidth + parent.padding + boxY,
  };
};

export const convertToLocalPosition = (
  absoluteX: number,
  absoluteY: number,
  targetParent: Box | null,
  allBoxes: Box[]
): { x: number; y: number } => {
  if (!targetParent) {
    return { x: absoluteX, y: absoluteY };
  }

  const parentAbsPos = getAbsolutePosition(targetParent, allBoxes);
  const borderWidth = getBorderWidth(targetParent.borderStyle);

  return {
    x: absoluteX - (parentAbsPos.x + borderWidth + targetParent.padding),
    y: absoluteY - (parentAbsPos.y + borderWidth + targetParent.padding),
  };
};

export const getAbsolutePosition = (
  box: Box,
  boxes: Box[]
): { x: number; y: number } => {
  const getArtboardOffset = (
    artboardId: string | undefined
  ): { x: number; y: number } => {
    if (!artboardId) return { x: 0, y: 0 };
    const artboard = useArtboardStore
      .getState()
      .artboards.find((a) => a.id === artboardId);
    return artboard ? { x: artboard.x, y: artboard.y } : { x: 0, y: 0 };
  };

  if (!box.parentId) {
    const artboardOffset = getArtboardOffset(box.artboardId);
    return {
      x: box.x + artboardOffset.x,
      y: box.y + artboardOffset.y,
    };
  }

  const ancestors = getAncestors(box.id, boxes);
  if (ancestors.length === 0) {
    const artboardOffset = getArtboardOffset(box.artboardId);
    return {
      x: box.x + artboardOffset.x,
      y: box.y + artboardOffset.y,
    };
  }

  let absoluteX = box.x;
  let absoluteY = box.y;

  for (const ancestor of ancestors.reverse()) {
    const borderWidth = getBorderWidth(ancestor.borderStyle);
    absoluteX += ancestor.x + borderWidth + ancestor.padding;
    absoluteY += ancestor.y + borderWidth + ancestor.padding;
  }

  const rootAncestor = ancestors[ancestors.length - 1];
  const artboardOffset = getArtboardOffset(rootAncestor?.artboardId);
  absoluteX += artboardOffset.x;
  absoluteY += artboardOffset.y;

  return { x: absoluteX, y: absoluteY };
};

export const getRootBoxes = (boxes: Box[]): Box[] => {
  return boxes.filter((box) => !box.parentId);
};

export const sortBoxesByRenderOrder = (boxes: Box[]): Box[] => {
  const sorted: Box[] = [];
  const visited = new Set<string>();

  const visit = (box: Box) => {
    if (visited.has(box.id)) return;
    visited.add(box.id);
    sorted.push(box);

    const children = getChildBoxes(box.id, boxes).sort(
      (a, b) => a.zIndex - b.zIndex
    );
    children.forEach(visit);
  };

  const rootBoxes = getRootBoxes(boxes).sort((a, b) => a.zIndex - b.zIndex);
  rootBoxes.forEach(visit);

  return sorted;
};

export const getDeepestBoxAtPoint = (
  point: { x: number; y: number },
  boxes: Box[]
): Box | null => {
  const isPointInBox = (
    p: { x: number; y: number },
    box: Box,
    boxes: Box[]
  ): boolean => {
    const absPos = getAbsolutePosition(box, boxes);
    return (
      p.x >= absPos.x &&
      p.x <= absPos.x + box.width &&
      p.y >= absPos.y &&
      p.y <= absPos.y + box.height
    );
  };

  let deepestBox: Box | null = null;
  let maxDepth = -1;

  for (const box of boxes) {
    if (isPointInBox(point, box, boxes)) {
      const depth = getNestingDepth(box.id, boxes);
      if (depth > maxDepth) {
        maxDepth = depth;
        deepestBox = box;
      } else if (depth === maxDepth && deepestBox) {
        if (box.zIndex > deepestBox.zIndex) {
          deepestBox = box;
        }
      }
    }
  }

  return deepestBox;
};
