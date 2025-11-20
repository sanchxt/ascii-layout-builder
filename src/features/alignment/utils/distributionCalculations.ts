import type { Box } from "@/types/box";
import type {
  DistributionType,
  BoxWithAbsolutePosition,
  BoxPositionUpdate,
  AlignmentValidation,
} from "../types/alignment";
import {
  filterOutChildrenOfSelectedParents,
  getBoxesWithAbsolutePositions,
  convertAbsoluteToLocal,
} from "./alignmentCalculations";

export const validateDistribution = (boxIds: string[]): AlignmentValidation => {
  if (boxIds.length < 3) {
    return {
      canAlign: false,
      reason: "At least 3 boxes must be selected for distribution",
    };
  }

  return { canAlign: true };
};

export const sortBoxesByPosition = (
  boxes: BoxWithAbsolutePosition[],
  type: DistributionType
): BoxWithAbsolutePosition[] => {
  return [...boxes].sort((a, b) => {
    if (type === "horizontal") {
      return a.absPos.x - b.absPos.x;
    } else {
      return a.absPos.y - b.absPos.y;
    }
  });
};

export const calculateDistributionSpace = (
  sortedBoxes: BoxWithAbsolutePosition[],
  type: DistributionType
): number => {
  if (sortedBoxes.length < 3) {
    return 0;
  }

  const firstBox = sortedBoxes[0];
  const lastBox = sortedBoxes[sortedBoxes.length - 1];

  if (type === "horizontal") {
    const totalSpan =
      lastBox.absPos.x + lastBox.absPos.width - firstBox.absPos.x;

    const totalBoxWidth = sortedBoxes.reduce(
      (sum, box) => sum + box.absPos.width,
      0
    );

    return totalSpan - totalBoxWidth;
  } else {
    const totalSpan =
      lastBox.absPos.y + lastBox.absPos.height - firstBox.absPos.y;

    const totalBoxHeight = sortedBoxes.reduce(
      (sum, box) => sum + box.absPos.height,
      0
    );

    return totalSpan - totalBoxHeight;
  }
};

export const calculateEvenGap = (
  sortedBoxes: BoxWithAbsolutePosition[],
  type: DistributionType
): number => {
  const totalSpace = calculateDistributionSpace(sortedBoxes, type);
  const numGaps = sortedBoxes.length - 1;

  return totalSpace / numGaps;
};

export const calculateNewDistributedPositions = (
  sortedBoxes: BoxWithAbsolutePosition[],
  evenGap: number,
  type: DistributionType
): BoxPositionUpdate[] => {
  const updates: BoxPositionUpdate[] = [];

  const firstBox = sortedBoxes[0];
  updates.push({
    id: firstBox.box.id,
    x: firstBox.box.x,
    y: firstBox.box.y,
  });

  let currentPosition =
    type === "horizontal"
      ? firstBox.absPos.x + firstBox.absPos.width
      : firstBox.absPos.y + firstBox.absPos.height;

  for (let i = 1; i < sortedBoxes.length - 1; i++) {
    const boxWithAbsPos = sortedBoxes[i];
    const { box } = boxWithAbsPos;

    currentPosition += evenGap;

    let newAbsPos: { x: number; y: number };
    if (type === "horizontal") {
      newAbsPos = {
        x: currentPosition,
        y: boxWithAbsPos.absPos.y,
      };
      currentPosition += boxWithAbsPos.absPos.width;
    } else {
      newAbsPos = {
        x: boxWithAbsPos.absPos.x,
        y: currentPosition,
      };
      currentPosition += boxWithAbsPos.absPos.height;
    }

    const localPos = convertAbsoluteToLocal(
      box,
      newAbsPos,
      sortedBoxes.map((b) => b.box)
    );

    updates.push({
      id: box.id,
      x: localPos.x,
      y: localPos.y,
    });
  }

  const lastBox = sortedBoxes[sortedBoxes.length - 1];
  updates.push({
    id: lastBox.box.id,
    x: lastBox.box.x,
    y: lastBox.box.y,
  });

  return updates;
};

export const calculateDistributedPositions = (
  boxIds: string[],
  distribution: DistributionType,
  allBoxes: Box[]
): BoxPositionUpdate[] => {
  const validation = validateDistribution(boxIds);
  if (!validation.canAlign) {
    console.warn(`Cannot distribute: ${validation.reason}`);
    return [];
  }

  const filteredIds = filterOutChildrenOfSelectedParents(boxIds, allBoxes);

  if (filteredIds.length < 3) {
    console.warn("After filtering, less than 3 boxes remain");
    return [];
  }

  const boxesWithAbsPos = getBoxesWithAbsolutePositions(filteredIds, allBoxes);

  const sortedBoxes = sortBoxesByPosition(boxesWithAbsPos, distribution);

  const evenGap = calculateEvenGap(sortedBoxes, distribution);

  const updates = calculateNewDistributedPositions(
    sortedBoxes,
    evenGap,
    distribution
  );

  return updates;
};
