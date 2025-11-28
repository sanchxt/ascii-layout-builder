import type { Box } from "@/types/box";
import type {
  FlexLayout,
  GridLayout,
  LayoutConfig,
  LayoutCalculationResult,
  LayoutChildPosition,
  ContainerSpace,
  LayoutPadding,
  ChildSizingMode,
} from "../types/layout";
import { normalizeLayoutPadding } from "../types/layout";
import { BOX_CONSTANTS } from "@/lib/constants";

const LAYOUT_CHILD_MIN_SIZE = 20;

const getBorderWidth = (borderStyle: Box["borderStyle"]): number => {
  return borderStyle === "double" ? 4 : 2;
};

export function getContainerSpace(
  container: Box,
  layoutPadding?: LayoutPadding
): ContainerSpace {
  const borderWidth = getBorderWidth(container.borderStyle);
  const totalOffset = borderWidth + container.padding;
  const lp = normalizeLayoutPadding(layoutPadding);

  return {
    x: totalOffset + lp.left,
    y: totalOffset + lp.top,
    width: Math.max(0, container.width - totalOffset * 2 - lp.left - lp.right),
    height: Math.max(
      0,
      container.height - totalOffset * 2 - lp.top - lp.bottom
    ),
  };
}

function calculateCrossAxisPosition(
  alignValue: FlexLayout["alignItems"],
  isRow: boolean,
  space: ContainerSpace,
  crossAxisSpace: number,
  childCrossSize: number,
  sizingMode: ChildSizingMode = "fill"
): { crossPos: number; crossSize: number } {
  let crossPos: number;
  let crossSize: number;

  const minCrossSize = isRow
    ? BOX_CONSTANTS.MIN_HEIGHT
    : BOX_CONSTANTS.MIN_WIDTH;
  const useMinSize = sizingMode === "auto" && alignValue !== "stretch";
  const effectiveChildSize = useMinSize
    ? minCrossSize
    : Math.min(childCrossSize, crossAxisSpace);

  switch (alignValue) {
    case "start":
      crossPos = isRow ? space.y : space.x;
      crossSize = effectiveChildSize;
      break;
    case "end":
      crossSize = effectiveChildSize;
      crossPos = isRow
        ? space.y + crossAxisSpace - crossSize
        : space.x + crossAxisSpace - crossSize;
      break;
    case "center":
      crossSize = effectiveChildSize;
      crossPos = isRow
        ? space.y + (crossAxisSpace - crossSize) / 2
        : space.x + (crossAxisSpace - crossSize) / 2;
      break;
    case "stretch":
    default:
      crossPos = isRow ? space.y : space.x;
      crossSize = crossAxisSpace;
      break;
  }

  return { crossPos, crossSize };
}

function calculateFlexLayoutWithWrap(
  container: Box,
  children: Box[],
  config: FlexLayout
): LayoutCalculationResult {
  const space = getContainerSpace(container, config.layoutPadding);
  const positions: LayoutChildPosition[] = [];
  const childCount = children.length;

  if (childCount === 0) {
    return { positions: [], overflow: false };
  }

  const {
    direction,
    gap,
    alignItems,
    justifyContent,
    alignContent,
    childSizingMode,
  } = config;
  const sizingMode = childSizingMode ?? "fill";
  const isRow = direction === "row";

  const mainAxisSpace = isRow ? space.width : space.height;
  const crossAxisSpace = isRow ? space.height : space.width;
  const mainAxisStart = isRow ? space.x : space.y;
  const crossAxisStart = isRow ? space.y : space.x;

  interface FlexLine {
    children: Box[];
    mainSize: number;
    crossSize: number;
  }

  const lines: FlexLine[] = [];
  let currentLine: FlexLine = { children: [], mainSize: 0, crossSize: 0 };

  children.forEach((child) => {
    const minMainSize = isRow
      ? BOX_CONSTANTS.MIN_WIDTH
      : BOX_CONSTANTS.MIN_HEIGHT;
    const childMainSize =
      sizingMode === "auto"
        ? minMainSize
        : isRow
        ? Math.max(LAYOUT_CHILD_MIN_SIZE, child.width)
        : Math.max(LAYOUT_CHILD_MIN_SIZE, child.height);
    const childCrossSize = isRow ? child.height : child.width;

    const gapNeeded = currentLine.children.length > 0 ? gap : 0;
    const wouldOverflow =
      currentLine.mainSize + gapNeeded + childMainSize > mainAxisSpace;

    if (wouldOverflow && currentLine.children.length > 0) {
      lines.push(currentLine);
      currentLine = { children: [], mainSize: 0, crossSize: 0 };
    }

    const gapForChild = currentLine.children.length > 0 ? gap : 0;
    currentLine.children.push(child);
    currentLine.mainSize += gapForChild + childMainSize;
    currentLine.crossSize = Math.max(currentLine.crossSize, childCrossSize);
  });

  if (currentLine.children.length > 0) {
    lines.push(currentLine);
  }

  const lineGap = gap;
  const totalLinesHeight =
    lines.reduce((sum, line) => sum + line.crossSize, 0) +
    (lines.length - 1) * lineGap;
  const freeLineCrossSpace = Math.max(0, crossAxisSpace - totalLinesHeight);

  const effectiveAlignContent = alignContent ?? "start";
  let lineStartOffset = crossAxisStart;
  let lineEffectiveGap = lineGap;

  switch (effectiveAlignContent) {
    case "start":
      lineStartOffset = crossAxisStart;
      break;
    case "end":
      lineStartOffset = crossAxisStart + freeLineCrossSpace;
      break;
    case "center":
      lineStartOffset = crossAxisStart + freeLineCrossSpace / 2;
      break;
    case "space-between":
      if (lines.length > 1) {
        lineEffectiveGap = lineGap + freeLineCrossSpace / (lines.length - 1);
      }
      break;
    case "space-around":
      if (lines.length > 0) {
        const spacePerLine = freeLineCrossSpace / lines.length;
        lineStartOffset = crossAxisStart + spacePerLine / 2;
        lineEffectiveGap = lineGap + spacePerLine;
      }
      break;
    case "space-evenly":
      if (lines.length > 0) {
        const spaceSlots = lines.length + 1;
        const spacePerSlot = freeLineCrossSpace / spaceSlots;
        lineStartOffset = crossAxisStart + spacePerSlot;
        lineEffectiveGap = lineGap + spacePerSlot;
      }
      break;
  }

  let currentCrossPos = lineStartOffset;

  lines.forEach((line) => {
    const lineMainGapSpace = (line.children.length - 1) * gap;
    const lineChildrenSize = line.children.reduce((sum, child) => {
      const minMainSize = isRow
        ? BOX_CONSTANTS.MIN_WIDTH
        : BOX_CONSTANTS.MIN_HEIGHT;
      const childMainSize =
        sizingMode === "auto"
          ? minMainSize
          : isRow
          ? Math.max(LAYOUT_CHILD_MIN_SIZE, child.width)
          : Math.max(LAYOUT_CHILD_MIN_SIZE, child.height);
      return sum + childMainSize;
    }, 0);
    const lineFreeSpace = Math.max(
      0,
      mainAxisSpace - lineChildrenSize - lineMainGapSpace
    );

    let lineStartPos = mainAxisStart;
    let lineItemGap = gap;

    switch (justifyContent) {
      case "start":
        lineStartPos = mainAxisStart;
        break;
      case "end":
        lineStartPos = mainAxisStart + lineFreeSpace;
        break;
      case "center":
        lineStartPos = mainAxisStart + lineFreeSpace / 2;
        break;
      case "space-between":
        if (line.children.length > 1) {
          lineItemGap = gap + lineFreeSpace / (line.children.length - 1);
        }
        break;
      case "space-around":
        if (line.children.length > 0) {
          const spacePerItem = lineFreeSpace / line.children.length;
          lineStartPos = mainAxisStart + spacePerItem / 2;
          lineItemGap = gap + spacePerItem;
        }
        break;
      case "space-evenly":
        if (line.children.length > 0) {
          const spaceSlots = line.children.length + 1;
          const spacePerSlot = lineFreeSpace / spaceSlots;
          lineStartPos = mainAxisStart + spacePerSlot;
          lineItemGap = gap + spacePerSlot;
        }
        break;
    }

    let currentMainPos = lineStartPos;

    line.children.forEach((child) => {
      const minMainSize = isRow
        ? BOX_CONSTANTS.MIN_WIDTH
        : BOX_CONSTANTS.MIN_HEIGHT;
      const childMainSize =
        sizingMode === "auto"
          ? minMainSize
          : isRow
          ? Math.max(LAYOUT_CHILD_MIN_SIZE, child.width)
          : Math.max(LAYOUT_CHILD_MIN_SIZE, child.height);
      const childCrossSize = isRow ? child.height : child.width;

      const alignValue = child.layoutChildProps?.alignSelf ?? alignItems;

      const minCrossSize = isRow
        ? BOX_CONSTANTS.MIN_HEIGHT
        : BOX_CONSTANTS.MIN_WIDTH;
      const useMinSize = sizingMode === "auto" && alignValue !== "stretch";
      const effectiveCrossSize = useMinSize
        ? minCrossSize
        : Math.min(childCrossSize, line.crossSize);

      let itemCrossPos: number;
      let itemCrossSize: number;

      switch (alignValue) {
        case "start":
          itemCrossPos = currentCrossPos;
          itemCrossSize = effectiveCrossSize;
          break;
        case "end":
          itemCrossSize = effectiveCrossSize;
          itemCrossPos = currentCrossPos + line.crossSize - itemCrossSize;
          break;
        case "center":
          itemCrossSize = effectiveCrossSize;
          itemCrossPos = currentCrossPos + (line.crossSize - itemCrossSize) / 2;
          break;
        case "stretch":
        default:
          itemCrossPos = currentCrossPos;
          itemCrossSize = line.crossSize;
          break;
      }

      const position: LayoutChildPosition = isRow
        ? {
            id: child.id,
            x: currentMainPos,
            y: itemCrossPos,
            width: childMainSize,
            height: itemCrossSize,
          }
        : {
            id: child.id,
            x: itemCrossPos,
            y: currentMainPos,
            width: itemCrossSize,
            height: childMainSize,
          };

      position.width = Math.max(LAYOUT_CHILD_MIN_SIZE, position.width);
      position.height = Math.max(LAYOUT_CHILD_MIN_SIZE, position.height);

      positions.push(position);
      currentMainPos += childMainSize + lineItemGap;
    });

    currentCrossPos += line.crossSize + lineEffectiveGap;
  });

  return { positions, overflow: false };
}

export function calculateFlexLayout(
  container: Box,
  children: Box[],
  config: FlexLayout
): LayoutCalculationResult {
  if (config.wrap) {
    return calculateFlexLayoutWithWrap(container, children, config);
  }

  const space = getContainerSpace(container, config.layoutPadding);
  const positions: LayoutChildPosition[] = [];
  const childCount = children.length;

  if (childCount === 0) {
    return { positions: [], overflow: false };
  }

  const { direction, gap, alignItems, justifyContent, childSizingMode } =
    config;
  const sizingMode = childSizingMode ?? "fill";
  const isRow = direction === "row";

  const mainAxisSpace = isRow ? space.width : space.height;
  const crossAxisSpace = isRow ? space.height : space.width;
  const mainAxisStart = isRow ? space.x : space.y;

  const childSizes: number[] = [];
  const totalGrow = children.reduce(
    (sum, c) => sum + (c.layoutChildProps?.flexGrow ?? 1),
    0
  );

  const isSpaceDistribution = [
    "space-between",
    "space-around",
    "space-evenly",
  ].includes(justifyContent);
  const useAutoSizing = sizingMode === "auto" || isSpaceDistribution;

  const baseGapCount = childCount - 1;
  const minGapSpace = baseGapCount * gap;

  let totalChildrenSize = 0;

  if (useAutoSizing) {
    const minMainSize = isRow
      ? BOX_CONSTANTS.MIN_WIDTH
      : BOX_CONSTANTS.MIN_HEIGHT;

    children.forEach((child) => {
      const flexBasis = child.layoutChildProps?.flexBasis;
      let childSize: number;

      if (flexBasis && flexBasis !== "auto") {
        childSize = parseFloat(flexBasis) || minMainSize;
      } else {
        childSize = minMainSize;
      }

      childSizes.push(childSize);
      totalChildrenSize += childSize;
    });
  } else {
    const availableMainSpace = mainAxisSpace - minGapSpace;

    children.forEach((child) => {
      const flexGrow = child.layoutChildProps?.flexGrow ?? 1;
      const childShare = totalGrow > 0 ? flexGrow / totalGrow : 1 / childCount;
      const childSize = Math.max(
        LAYOUT_CHILD_MIN_SIZE,
        availableMainSpace * childShare
      );
      childSizes.push(childSize);
      totalChildrenSize += childSize;
    });
  }

  const freeSpace = Math.max(
    0,
    mainAxisSpace - totalChildrenSize - minGapSpace
  );

  const overflow = mainAxisSpace < totalChildrenSize + minGapSpace;

  let startOffset = mainAxisStart;
  let effectiveGap = gap;

  switch (justifyContent) {
    case "start":
      startOffset = mainAxisStart;
      break;
    case "end":
      startOffset = mainAxisStart + freeSpace;
      break;
    case "center":
      startOffset = mainAxisStart + freeSpace / 2;
      break;
    case "space-between":
      if (childCount > 1) {
        effectiveGap = gap + freeSpace / (childCount - 1);
      }
      break;
    case "space-around":
      if (childCount > 0) {
        const spacePerItem = freeSpace / childCount;
        startOffset = mainAxisStart + spacePerItem / 2;
        effectiveGap = gap + spacePerItem;
      }
      break;
    case "space-evenly":
      if (childCount > 0) {
        const spaceSlots = childCount + 1;
        const spacePerSlot = freeSpace / spaceSlots;
        startOffset = mainAxisStart + spacePerSlot;
        effectiveGap = gap + spacePerSlot;
      }
      break;
  }

  let currentMainPos = startOffset;

  children.forEach((child, index) => {
    const childMainSize = childSizes[index];

    const alignValue = child.layoutChildProps?.alignSelf ?? alignItems;
    const childCrossSize = isRow ? child.height : child.width;

    const { crossPos, crossSize } = calculateCrossAxisPosition(
      alignValue,
      isRow,
      space,
      crossAxisSpace,
      childCrossSize,
      sizingMode
    );

    const position: LayoutChildPosition = isRow
      ? {
          id: child.id,
          x: currentMainPos,
          y: crossPos,
          width: childMainSize,
          height: crossSize,
        }
      : {
          id: child.id,
          x: crossPos,
          y: currentMainPos,
          width: crossSize,
          height: childMainSize,
        };

    position.width = Math.max(LAYOUT_CHILD_MIN_SIZE, position.width);
    position.height = Math.max(LAYOUT_CHILD_MIN_SIZE, position.height);

    positions.push(position);

    currentMainPos += childMainSize + effectiveGap;
  });

  return { positions, overflow };
}

function calculateCellAlignment(
  alignValue: "start" | "center" | "end" | "stretch",
  cellStart: number,
  cellSize: number,
  itemNaturalSize: number
): { pos: number; size: number } {
  switch (alignValue) {
    case "start":
      return { pos: cellStart, size: Math.min(itemNaturalSize, cellSize) };
    case "end":
      const endSize = Math.min(itemNaturalSize, cellSize);
      return { pos: cellStart + cellSize - endSize, size: endSize };
    case "center":
      const centerSize = Math.min(itemNaturalSize, cellSize);
      return { pos: cellStart + (cellSize - centerSize) / 2, size: centerSize };
    case "stretch":
    default:
      return { pos: cellStart, size: cellSize };
  }
}

export function calculateGridLayout(
  container: Box,
  children: Box[],
  config: GridLayout
): LayoutCalculationResult {
  const space = getContainerSpace(container, config.layoutPadding);
  const positions: LayoutChildPosition[] = [];
  const overflowChildIds: string[] = [];

  const {
    columns,
    rows,
    gap,
    columnGap,
    rowGap,
    alignItems,
    justifyItems,
    childSizingMode,
  } = config;
  const sizingMode = childSizingMode ?? "fill";
  const effectiveColumnGap = columnGap ?? gap;
  const effectiveRowGap = rowGap ?? gap;

  const defaultAlign = sizingMode === "auto" ? "start" : "stretch";
  const effectiveAlignItems = alignItems ?? defaultAlign;
  const effectiveJustifyItems = justifyItems ?? defaultAlign;

  const totalColumnGapSpace = (columns - 1) * effectiveColumnGap;
  const totalRowGapSpace = (rows - 1) * effectiveRowGap;

  const cellWidth = (space.width - totalColumnGapSpace) / columns;
  const cellHeight = (space.height - totalRowGapSpace) / rows;

  const overflow =
    cellWidth < LAYOUT_CHILD_MIN_SIZE || cellHeight < LAYOUT_CHILD_MIN_SIZE;

  children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    if (row >= rows) {
      overflowChildIds.push(child.id);
      return;
    }

    const cellX = space.x + col * (cellWidth + effectiveColumnGap);
    const cellY = space.y + row * (cellHeight + effectiveRowGap);

    const minWidth = BOX_CONSTANTS.MIN_WIDTH;
    const minHeight = BOX_CONSTANTS.MIN_HEIGHT;
    const useMinWidth =
      sizingMode === "auto" && effectiveJustifyItems !== "stretch";
    const useMinHeight =
      sizingMode === "auto" && effectiveAlignItems !== "stretch";
    const childNaturalWidth = useMinWidth ? minWidth : child.width;
    const childNaturalHeight = useMinHeight ? minHeight : child.height;

    const { pos: itemX, size: itemWidth } = calculateCellAlignment(
      effectiveJustifyItems,
      cellX,
      cellWidth,
      childNaturalWidth
    );

    const { pos: itemY, size: itemHeight } = calculateCellAlignment(
      effectiveAlignItems,
      cellY,
      cellHeight,
      childNaturalHeight
    );

    positions.push({
      id: child.id,
      x: itemX,
      y: itemY,
      width: Math.max(LAYOUT_CHILD_MIN_SIZE, itemWidth),
      height: Math.max(LAYOUT_CHILD_MIN_SIZE, itemHeight),
    });
  });

  return { positions, overflow, overflowChildIds };
}

export function calculateLayout(
  container: Box,
  children: Box[],
  config: LayoutConfig
): LayoutCalculationResult {
  if (config.type === "none") {
    return { positions: [], overflow: false };
  }

  if (config.type === "flex") {
    return calculateFlexLayout(container, children, config);
  }

  if (config.type === "grid") {
    return calculateGridLayout(container, children, config);
  }

  return { positions: [], overflow: false };
}

export function redistributeFlexLayout(
  container: Box,
  resizedChildId: string,
  newSize: { width?: number; height?: number },
  children: Box[],
  config: FlexLayout
): LayoutCalculationResult {
  const space = getContainerSpace(container, config.layoutPadding);
  const isRow = config.direction === "row";
  const { gap, alignItems, justifyContent, childSizingMode } = config;
  const sizingMode = childSizingMode ?? "fill";

  const resizedChild = children.find((c) => c.id === resizedChildId);
  if (!resizedChild) {
    return calculateFlexLayout(container, children, config);
  }

  const resizedMainSize = isRow
    ? newSize.width ?? resizedChild.width
    : newSize.height ?? resizedChild.height;

  const totalGapSpace = (children.length - 1) * gap;
  const mainAxisSpace = isRow ? space.width : space.height;
  const crossAxisSpace = isRow ? space.height : space.width;
  const mainAxisStart = isRow ? space.x : space.y;
  const remainingSpace = mainAxisSpace - totalGapSpace - resizedMainSize;

  const otherChildren = children.filter((c) => c.id !== resizedChildId);
  const minMainSize = LAYOUT_CHILD_MIN_SIZE;
  const minTotalOtherSpace = otherChildren.length * minMainSize;

  const overflow = remainingSpace < minTotalOtherSpace;
  const otherChildMainSize = Math.max(
    minMainSize,
    remainingSpace / Math.max(1, otherChildren.length)
  );

  const totalChildrenSize =
    resizedMainSize + otherChildren.length * otherChildMainSize;
  const freeSpace = Math.max(
    0,
    mainAxisSpace - totalChildrenSize - totalGapSpace
  );

  let startOffset = mainAxisStart;
  let effectiveGap = gap;

  switch (justifyContent) {
    case "start":
      startOffset = mainAxisStart;
      break;
    case "end":
      startOffset = mainAxisStart + freeSpace;
      break;
    case "center":
      startOffset = mainAxisStart + freeSpace / 2;
      break;
    case "space-between":
      if (children.length > 1) {
        effectiveGap = gap + freeSpace / (children.length - 1);
      }
      break;
    case "space-around":
      if (children.length > 0) {
        const spacePerItem = freeSpace / children.length;
        startOffset = mainAxisStart + spacePerItem / 2;
        effectiveGap = gap + spacePerItem;
      }
      break;
    case "space-evenly":
      if (children.length > 0) {
        const spaceSlots = children.length + 1;
        const spacePerSlot = freeSpace / spaceSlots;
        startOffset = mainAxisStart + spacePerSlot;
        effectiveGap = gap + spacePerSlot;
      }
      break;
  }

  const positions: LayoutChildPosition[] = [];
  let currentMainPos = startOffset;

  const sortedChildren = [...children].sort((a, b) =>
    isRow ? a.x - b.x : a.y - b.y
  );

  sortedChildren.forEach((child) => {
    const isResizedChild = child.id === resizedChildId;
    const mainSize = isResizedChild ? resizedMainSize : otherChildMainSize;

    const alignValue = child.layoutChildProps?.alignSelf ?? alignItems;
    const childCrossSize = isRow ? child.height : child.width;

    const { crossPos, crossSize } = calculateCrossAxisPosition(
      alignValue,
      isRow,
      space,
      crossAxisSpace,
      childCrossSize,
      sizingMode
    );

    const position: LayoutChildPosition = isRow
      ? {
          id: child.id,
          x: currentMainPos,
          y: crossPos,
          width: mainSize,
          height: crossSize,
        }
      : {
          id: child.id,
          x: crossPos,
          y: currentMainPos,
          width: crossSize,
          height: mainSize,
        };

    position.width = Math.max(LAYOUT_CHILD_MIN_SIZE, position.width);
    position.height = Math.max(LAYOUT_CHILD_MIN_SIZE, position.height);

    positions.push(position);
    currentMainPos += mainSize + effectiveGap;
  });

  return { positions, overflow };
}

export function generateLayoutChildPositions(
  container: Box,
  config: LayoutConfig,
  childCount: number
): LayoutChildPosition[] {
  const tempChildren: Box[] = Array.from({ length: childCount }, (_, i) => ({
    id: `temp-${i}`,
    x: 0,
    y: 0,
    width: BOX_CONSTANTS.MIN_WIDTH,
    height: BOX_CONSTANTS.MIN_HEIGHT,
    borderStyle: "single" as const,
    padding: BOX_CONSTANTS.DEFAULT_PADDING,
    text: {
      value: "",
      alignment: "left" as const,
      fontSize: "medium" as const,
      formatting: [],
    },
    children: [],
    zIndex: 0,
  }));

  const result = calculateLayout(container, tempChildren, config);
  return result.positions;
}

export function hasLayout(box: Box): boolean {
  return box.layout !== undefined && box.layout.type !== "none";
}

export function isLayoutChild(box: Box, allBoxes: Box[]): boolean {
  if (!box.parentId) return false;
  const parent = allBoxes.find((b) => b.id === box.parentId);
  return parent ? hasLayout(parent) : false;
}
