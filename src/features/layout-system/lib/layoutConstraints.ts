import type { Box } from "@/types/box";
import type { FlexLayout, GridLayout } from "../types/layout";
import {
  getContainerSpace,
  redistributeFlexLayout,
  hasLayout,
} from "./layoutEngine";
import { BOX_CONSTANTS } from "@/lib/constants";

export interface LayoutConstraintResult {
  isLayoutChild: boolean;
  layoutParent: Box | null;
  updates: Array<{ id: string; changes: Partial<Box> }>;
  overflow: boolean;
}

export interface ReorderResult {
  shouldReorder: boolean;
  swapWithId: string | null;
  newChildOrder: string[];
}

export function getLayoutParent(boxId: string, allBoxes: Box[]): Box | null {
  const box = allBoxes.find((b) => b.id === boxId);
  if (!box || !box.parentId) return null;

  const parent = allBoxes.find((b) => b.id === box.parentId);
  if (!parent) return null;

  return hasLayout(parent) ? parent : null;
}

export function isLayoutChild(boxId: string, allBoxes: Box[]): boolean {
  return getLayoutParent(boxId, allBoxes) !== null;
}

export function getLayoutSiblings(boxId: string, allBoxes: Box[]): Box[] {
  const box = allBoxes.find((b) => b.id === boxId);
  if (!box || !box.parentId) return [];

  return allBoxes.filter((b) => b.parentId === box.parentId && b.id !== boxId);
}

export function constrainFlexResize(
  box: Box,
  parent: Box,
  newSize: { width?: number; height?: number },
  allChildren: Box[]
): LayoutConstraintResult {
  const layout = parent.layout as FlexLayout;
  const isRow = layout.direction === "row";
  const space = getContainerSpace(parent);

  const newMainSize = isRow
    ? newSize.width ?? box.width
    : newSize.height ?? box.height;

  const otherChildren = allChildren.filter((c) => c.id !== box.id);
  const minMainSize = isRow
    ? BOX_CONSTANTS.MIN_WIDTH
    : BOX_CONSTANTS.MIN_HEIGHT;
  const totalGapSpace = (allChildren.length - 1) * layout.gap;
  const mainAxisSpace = isRow ? space.width : space.height;
  const minOtherSpace = otherChildren.length * minMainSize;

  const maxAllowedSize = mainAxisSpace - totalGapSpace - minOtherSpace;
  const constrainedMainSize = Math.min(
    Math.max(minMainSize, newMainSize),
    maxAllowedSize
  );

  const overflow = newMainSize > maxAllowedSize;

  const result = redistributeFlexLayout(
    parent,
    box.id,
    isRow ? { width: constrainedMainSize } : { height: constrainedMainSize },
    allChildren,
    layout
  );

  const updates = result.positions.map((pos) => ({
    id: pos.id,
    changes: {
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
    },
  }));

  return {
    isLayoutChild: true,
    layoutParent: parent,
    updates,
    overflow: overflow || result.overflow,
  };
}

export function constrainGridResize(
  box: Box,
  parent: Box,
  newSize: { width?: number; height?: number },
  allChildren: Box[]
): LayoutConstraintResult {
  const layout = parent.layout as GridLayout;
  const space = getContainerSpace(parent);
  const { columns, rows, gap, columnGap, rowGap } = layout;

  const effectiveColumnGap = columnGap ?? gap;
  const effectiveRowGap = rowGap ?? gap;

  const totalColumnGapSpace = (columns - 1) * effectiveColumnGap;
  const totalRowGapSpace = (rows - 1) * effectiveRowGap;
  const cellWidth = (space.width - totalColumnGapSpace) / columns;
  const cellHeight = (space.height - totalRowGapSpace) / rows;

  const boxIndex = allChildren.findIndex((c) => c.id === box.id);
  if (boxIndex === -1) {
    return {
      isLayoutChild: true,
      layoutParent: parent,
      updates: [],
      overflow: false,
    };
  }

  const constrainedWidth = Math.min(
    Math.max(BOX_CONSTANTS.MIN_WIDTH, newSize.width ?? box.width),
    cellWidth
  );
  const constrainedHeight = Math.min(
    Math.max(BOX_CONSTANTS.MIN_HEIGHT, newSize.height ?? box.height),
    cellHeight
  );

  return {
    isLayoutChild: true,
    layoutParent: parent,
    updates: [
      {
        id: box.id,
        changes: {
          width: constrainedWidth,
          height: constrainedHeight,
        },
      },
    ],
    overflow: false,
  };
}

export function constrainLayoutResize(
  boxId: string,
  newSize: { width?: number; height?: number },
  allBoxes: Box[]
): LayoutConstraintResult {
  const box = allBoxes.find((b) => b.id === boxId);
  if (!box) {
    return {
      isLayoutChild: false,
      layoutParent: null,
      updates: [],
      overflow: false,
    };
  }

  const layoutParent = getLayoutParent(boxId, allBoxes);
  if (!layoutParent || !layoutParent.layout) {
    return {
      isLayoutChild: false,
      layoutParent: null,
      updates: [],
      overflow: false,
    };
  }

  const allChildren = allBoxes.filter((b) => b.parentId === layoutParent.id);

  if (layoutParent.layout.type === "flex") {
    return constrainFlexResize(box, layoutParent, newSize, allChildren);
  }

  if (layoutParent.layout.type === "grid") {
    return constrainGridResize(box, layoutParent, newSize, allChildren);
  }

  return {
    isLayoutChild: false,
    layoutParent: null,
    updates: [],
    overflow: false,
  };
}

export function calculateFlexReorder(
  box: Box,
  newPosition: { x: number; y: number },
  parent: Box,
  allChildren: Box[]
): ReorderResult {
  const layout = parent.layout as FlexLayout;
  const isRow = layout.direction === "row";

  const sortedChildren = [...allChildren].sort((a, b) =>
    isRow ? a.x - b.x : a.y - b.y
  );

  const currentIndex = sortedChildren.findIndex((c) => c.id === box.id);
  if (currentIndex === -1) {
    return {
      shouldReorder: false,
      swapWithId: null,
      newChildOrder: allChildren.map((c) => c.id),
    };
  }

  const newMainPos = isRow ? newPosition.x : newPosition.y;
  const boxMainSize = isRow ? box.width : box.height;
  const boxCenter = newMainPos + boxMainSize / 2;

  let newIndex = currentIndex;

  for (let i = 0; i < sortedChildren.length; i++) {
    if (i === currentIndex) continue;

    const other = sortedChildren[i];
    const otherMainPos = isRow ? other.x : other.y;
    const otherMainSize = isRow ? other.width : other.height;
    const otherCenter = otherMainPos + otherMainSize / 2;

    if (i < currentIndex && boxCenter < otherCenter) {
      newIndex = i;
      break;
    } else if (i > currentIndex && boxCenter > otherCenter) {
      newIndex = i;
    }
  }

  if (newIndex === currentIndex) {
    return {
      shouldReorder: false,
      swapWithId: null,
      newChildOrder: allChildren.map((c) => c.id),
    };
  }

  const newOrder = [...sortedChildren.map((c) => c.id)];
  const [removed] = newOrder.splice(currentIndex, 1);
  newOrder.splice(newIndex, 0, removed);

  return {
    shouldReorder: true,
    swapWithId: sortedChildren[newIndex].id,
    newChildOrder: newOrder,
  };
}

export function isDraggingOutsideLayout(
  box: Box,
  newAbsolutePosition: { x: number; y: number },
  parent: Box
): boolean {
  const space = getContainerSpace(parent);

  const centerX = newAbsolutePosition.x + box.width / 2;
  const centerY = newAbsolutePosition.y + box.height / 2;

  const parentLeft = space.x;
  const parentTop = space.y;
  const parentRight = space.x + space.width;
  const parentBottom = space.y + space.height;

  const margin = 20;

  return (
    centerX < parentLeft - margin ||
    centerX > parentRight + margin ||
    centerY < parentTop - margin ||
    centerY > parentBottom + margin
  );
}

export function calculateGridReorder(
  box: Box,
  newPosition: { x: number; y: number },
  parent: Box,
  allChildren: Box[]
): ReorderResult {
  const layout = parent.layout as GridLayout;
  const space = getContainerSpace(parent);
  const { columns, rows, gap, columnGap, rowGap } = layout;

  const effectiveColumnGap = columnGap ?? gap;
  const effectiveRowGap = rowGap ?? gap;

  const totalColumnGapSpace = (columns - 1) * effectiveColumnGap;
  const totalRowGapSpace = (rows - 1) * effectiveRowGap;
  const cellWidth = (space.width - totalColumnGapSpace) / columns;
  const cellHeight = (space.height - totalRowGapSpace) / rows;

  const currentIndex = allChildren.findIndex((c) => c.id === box.id);
  if (currentIndex === -1) {
    return {
      shouldReorder: false,
      swapWithId: null,
      newChildOrder: allChildren.map((c) => c.id),
    };
  }

  const centerX = newPosition.x + box.width / 2 - space.x;
  const centerY = newPosition.y + box.height / 2 - space.y;

  const targetCol = Math.floor(centerX / (cellWidth + effectiveColumnGap));
  const targetRow = Math.floor(centerY / (cellHeight + effectiveRowGap));

  const clampedCol = Math.max(0, Math.min(columns - 1, targetCol));
  const clampedRow = Math.max(0, Math.min(rows - 1, targetRow));

  const targetIndex = clampedRow * columns + clampedCol;

  if (targetIndex === currentIndex || targetIndex >= allChildren.length) {
    return {
      shouldReorder: false,
      swapWithId: null,
      newChildOrder: allChildren.map((c) => c.id),
    };
  }

  const newOrder = [...allChildren.map((c) => c.id)];
  const temp = newOrder[currentIndex];
  newOrder[currentIndex] = newOrder[targetIndex];
  newOrder[targetIndex] = temp;

  return {
    shouldReorder: true,
    swapWithId: allChildren[targetIndex].id,
    newChildOrder: newOrder,
  };
}

export function getSelectedLayoutSiblings(
  boxId: string,
  selectedBoxIds: string[],
  allBoxes: Box[]
): Box[] {
  const box = allBoxes.find((b) => b.id === boxId);
  if (!box?.parentId) return [];

  const parent = allBoxes.find((b) => b.id === box.parentId);
  if (!parent || !hasLayout(parent)) return [];

  return allBoxes.filter(
    (b) => b.parentId === box.parentId && selectedBoxIds.includes(b.id)
  );
}

export function constrainMultiLayoutResize(
  boxIds: string[],
  newSize: { width?: number; height?: number },
  allBoxes: Box[]
): LayoutConstraintResult {
  if (boxIds.length === 0) {
    return {
      isLayoutChild: false,
      layoutParent: null,
      updates: [],
      overflow: false,
    };
  }

  const firstBox = allBoxes.find((b) => b.id === boxIds[0]);
  if (!firstBox?.parentId) {
    return {
      isLayoutChild: false,
      layoutParent: null,
      updates: [],
      overflow: false,
    };
  }

  const layoutParent = getLayoutParent(boxIds[0], allBoxes);
  if (!layoutParent?.layout) {
    return {
      isLayoutChild: false,
      layoutParent: null,
      updates: [],
      overflow: false,
    };
  }

  const isRow =
    layoutParent.layout.type === "flex" &&
    (layoutParent.layout as FlexLayout).direction === "row";

  const originalSize = isRow ? firstBox.width : firstBox.height;
  const targetSize = isRow
    ? newSize.width ?? originalSize
    : newSize.height ?? originalSize;
  const sizeDelta = targetSize - originalSize;

  const minSize = isRow ? BOX_CONSTANTS.MIN_WIDTH : BOX_CONSTANTS.MIN_HEIGHT;

  const updates: Array<{ id: string; changes: Partial<Box> }> = [];

  boxIds.forEach((id) => {
    const box = allBoxes.find((b) => b.id === id);
    if (!box) return;

    const currentMainSize = isRow ? box.width : box.height;
    const newMainSize = Math.max(minSize, currentMainSize + sizeDelta);

    updates.push({
      id,
      changes: isRow ? { width: newMainSize } : { height: newMainSize },
    });
  });

  return {
    isLayoutChild: true,
    layoutParent,
    updates,
    overflow: false,
  };
}

export function calculateLayoutReorder(
  boxId: string,
  newPosition: { x: number; y: number },
  allBoxes: Box[]
): ReorderResult {
  const box = allBoxes.find((b) => b.id === boxId);
  if (!box) {
    return {
      shouldReorder: false,
      swapWithId: null,
      newChildOrder: [],
    };
  }

  const layoutParent = getLayoutParent(boxId, allBoxes);
  if (!layoutParent || !layoutParent.layout) {
    return {
      shouldReorder: false,
      swapWithId: null,
      newChildOrder: [],
    };
  }

  const allChildren = allBoxes.filter((b) => b.parentId === layoutParent.id);

  if (layoutParent.layout.type === "flex") {
    return calculateFlexReorder(box, newPosition, layoutParent, allChildren);
  }

  if (layoutParent.layout.type === "grid") {
    return calculateGridReorder(box, newPosition, layoutParent, allChildren);
  }

  return {
    shouldReorder: false,
    swapWithId: null,
    newChildOrder: [],
  };
}
