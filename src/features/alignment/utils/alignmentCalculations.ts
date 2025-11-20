import type { Box } from "@/types/box";
import { getAbsolutePosition } from "@/features/boxes/utils/boxHierarchy";
import type {
  AlignmentType,
  BoxWithAbsolutePosition,
  BoxPositionUpdate,
  AlignmentReference,
  AlignmentValidation,
} from "../types/alignment";

export const validateAlignment = (boxIds: string[]): AlignmentValidation => {
  if (boxIds.length < 2) {
    return {
      canAlign: false,
      reason: "At least 2 boxes must be selected for alignment",
    };
  }

  return { canAlign: true };
};

export const filterOutChildrenOfSelectedParents = (
  boxIds: string[],
  allBoxes: Box[]
): string[] => {
  return boxIds.filter((id) => {
    const box = allBoxes.find((b) => b.id === id);
    if (!box || !box.parentId) return true;

    let currentParentId: string | undefined = box.parentId;
    while (currentParentId) {
      if (boxIds.includes(currentParentId)) {
        return false;
      }
      const parent = allBoxes.find((b) => b.id === currentParentId);
      currentParentId = parent?.parentId;
    }

    return true;
  });
};

export const getBoxesWithAbsolutePositions = (
  boxIds: string[],
  allBoxes: Box[]
): BoxWithAbsolutePosition[] => {
  return boxIds.map((id) => {
    const box = allBoxes.find((b) => b.id === id)!;
    const absPos = getAbsolutePosition(box, allBoxes);

    return {
      box,
      absPos: {
        x: absPos.x,
        y: absPos.y,
        width: box.width,
        height: box.height,
      },
    };
  });
};

export const calculateAlignmentReference = (
  boxes: BoxWithAbsolutePosition[],
  alignment: AlignmentType
): AlignmentReference => {
  switch (alignment) {
    case "left": {
      const value = Math.min(...boxes.map((b) => b.absPos.x));
      return { value, type: alignment };
    }

    case "center-h": {
      const centers = boxes.map((b) => b.absPos.x + b.absPos.width / 2);
      const value = centers.reduce((sum, c) => sum + c, 0) / centers.length;
      return { value, type: alignment };
    }

    case "right": {
      const value = Math.max(...boxes.map((b) => b.absPos.x + b.absPos.width));
      return { value, type: alignment };
    }

    case "top": {
      const value = Math.min(...boxes.map((b) => b.absPos.y));
      return { value, type: alignment };
    }

    case "middle-v": {
      const middles = boxes.map((b) => b.absPos.y + b.absPos.height / 2);
      const value = middles.reduce((sum, m) => sum + m, 0) / middles.length;
      return { value, type: alignment };
    }

    case "bottom": {
      const value = Math.max(...boxes.map((b) => b.absPos.y + b.absPos.height));
      return { value, type: alignment };
    }
  }
};

export const calculateNewAbsolutePosition = (
  boxWithAbsPos: BoxWithAbsolutePosition,
  reference: AlignmentReference
): { x: number; y: number } => {
  const { absPos } = boxWithAbsPos;
  const { value, type } = reference;

  switch (type) {
    case "left":
      return { x: value, y: absPos.y };

    case "center-h":
      return { x: value - absPos.width / 2, y: absPos.y };

    case "right":
      return { x: value - absPos.width, y: absPos.y };

    case "top":
      return { x: absPos.x, y: value };

    case "middle-v":
      return { x: absPos.x, y: value - absPos.height / 2 };

    case "bottom":
      return { x: absPos.x, y: value - absPos.height };
  }
};

export const convertAbsoluteToLocal = (
  box: Box,
  absolutePos: { x: number; y: number },
  allBoxes: Box[]
): { x: number; y: number } => {
  if (!box.parentId) {
    return absolutePos;
  }

  const parent = allBoxes.find((b) => b.id === box.parentId);
  if (!parent) {
    console.warn(`Parent ${box.parentId} not found for box ${box.id}`);
    return absolutePos;
  }

  const parentAbsPos = getAbsolutePosition(parent, allBoxes);

  const localX = absolutePos.x - (parentAbsPos.x + parent.padding);
  const localY = absolutePos.y - (parentAbsPos.y + parent.padding);

  return { x: localX, y: localY };
};

export const calculateAlignedPositions = (
  boxIds: string[],
  alignment: AlignmentType,
  allBoxes: Box[]
): BoxPositionUpdate[] => {
  const validation = validateAlignment(boxIds);
  if (!validation.canAlign) {
    console.warn(`Cannot align: ${validation.reason}`);
    return [];
  }

  const filteredIds = filterOutChildrenOfSelectedParents(boxIds, allBoxes);

  if (filteredIds.length < 2) {
    console.warn("After filtering, less than 2 boxes remain");
    return [];
  }

  const boxesWithAbsPos = getBoxesWithAbsolutePositions(filteredIds, allBoxes);

  const reference = calculateAlignmentReference(boxesWithAbsPos, alignment);

  const updates: BoxPositionUpdate[] = boxesWithAbsPos.map((boxWithAbsPos) => {
    const { box } = boxWithAbsPos;

    const newAbsPos = calculateNewAbsolutePosition(boxWithAbsPos, reference);

    const localPos = convertAbsoluteToLocal(box, newAbsPos, allBoxes);

    return {
      id: box.id,
      x: localPos.x,
      y: localPos.y,
    };
  });

  return updates;
};
