import type { Box } from "@/types/box";
import { BOX_CONSTANTS } from "@/lib/constants";
import { isBoxInsideParent } from "./boxHierarchy";

export interface AutoDetachResult {
  shouldDetach: boolean;
  reason?: string;
}

export const shouldAutoDetach = (
  childBox: Box,
  parentBox: Box
): AutoDetachResult => {
  if (!childBox.parentId || childBox.parentId !== parentBox.id) {
    return { shouldDetach: false, reason: "Box is not a child of this parent" };
  }

  const isInside = isBoxInsideParent(childBox, parentBox);

  if (!isInside) {
    return {
      shouldDetach: true,
      reason: "Child box center is outside parent bounds (beyond threshold)",
    };
  }

  return { shouldDetach: false };
};

export const isPositionInBounds = (
  childX: number,
  childY: number,
  childWidth: number,
  childHeight: number,
  parentWidth: number,
  parentHeight: number
): boolean => {
  const threshold = BOX_CONSTANTS.AUTO_DETACH_THRESHOLD;

  const childCenterX = childX + childWidth / 2;
  const childCenterY = childY + childHeight / 2;

  const isWithinX =
    childCenterX >= -threshold && childCenterX <= parentWidth + threshold;
  const isWithinY =
    childCenterY >= -threshold && childCenterY <= parentHeight + threshold;

  return isWithinX && isWithinY;
};

export const getOverflowingChildren = (
  parentBox: Box,
  newWidth: number,
  newHeight: number,
  children: Box[]
): string[] => {
  return children
    .filter((child) => {
      if (child.parentId !== parentBox.id) return false;

      return !isPositionInBounds(
        child.x,
        child.y,
        child.width,
        child.height,
        newWidth,
        newHeight
      );
    })
    .map((child) => child.id);
};

export const checkAutoDetachOnChange = (
  box: Box,
  newX: number,
  newY: number,
  newWidth?: number,
  newHeight?: number,
  parent?: Box
): AutoDetachResult => {
  if (!box.parentId || !parent) {
    return { shouldDetach: false, reason: "Box has no parent" };
  }

  const width = newWidth ?? box.width;
  const height = newHeight ?? box.height;

  const isInBounds = isPositionInBounds(
    newX,
    newY,
    width,
    height,
    parent.width,
    parent.height
  );

  if (!isInBounds) {
    return {
      shouldDetach: true,
      reason: "New position/size would place box outside parent bounds",
    };
  }

  return { shouldDetach: false };
};
