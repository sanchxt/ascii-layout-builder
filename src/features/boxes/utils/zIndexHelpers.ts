import type { Box } from "@/types/box";

export const normalizeZIndices = (boxes: Box[]): Box[] => {
  const groups = new Map<string | undefined, Box[]>();

  boxes.forEach((box) => {
    const parentKey = box.parentId || "root";
    if (!groups.has(parentKey)) {
      groups.set(parentKey, []);
    }
    groups.get(parentKey)!.push(box);
  });

  const normalized: Box[] = [];
  groups.forEach((groupBoxes) => {
    const sorted = [...groupBoxes].sort((a, b) => a.zIndex - b.zIndex);
    sorted.forEach((box, index) => {
      normalized.push({ ...box, zIndex: index });
    });
  });

  return normalized;
};

export const getZIndexRange = (
  boxes: Box[],
  parentId?: string
): { min: number; max: number } => {
  const siblings = boxes.filter((b) => b.parentId === parentId);

  if (siblings.length === 0) {
    return { min: 0, max: 0 };
  }

  const zIndices = siblings.map((b) => b.zIndex);
  return {
    min: Math.min(...zIndices),
    max: Math.max(...zIndices),
  };
};

export const calculateNewZIndex = (
  boxes: Box[],
  targetId: string,
  direction: "front" | "back" | "forward" | "backward"
): number | null => {
  const targetBox = boxes.find((b) => b.id === targetId);
  if (!targetBox) return null;

  const siblings = boxes
    .filter((b) => b.parentId === targetBox.parentId)
    .sort((a, b) => a.zIndex - b.zIndex);

  const currentIndex = siblings.findIndex((b) => b.id === targetId);
  if (currentIndex === -1) return null;

  const range = getZIndexRange(boxes, targetBox.parentId);

  switch (direction) {
    case "front":
      return range.max + 1;

    case "back":
      return range.min - 1;

    case "forward":
      if (currentIndex === siblings.length - 1) return null;
      return siblings[currentIndex + 1].zIndex + 1;

    case "backward":
      if (currentIndex === 0) return null;
      return siblings[currentIndex - 1].zIndex - 1;

    default:
      return null;
  }
};

export const calculateInsertZIndex = (
  boxes: Box[],
  parentId: string | undefined,
  insertBeforeId: string | null
): number => {
  const siblings = boxes
    .filter((b) => b.parentId === parentId)
    .sort((a, b) => a.zIndex - b.zIndex);

  if (siblings.length === 0) {
    return 0;
  }

  if (!insertBeforeId) {
    return siblings[siblings.length - 1].zIndex + 1;
  }

  const targetIndex = siblings.findIndex((b) => b.id === insertBeforeId);
  if (targetIndex === -1) {
    return siblings[siblings.length - 1].zIndex + 1;
  }

  if (targetIndex === 0) {
    return siblings[0].zIndex - 1;
  }

  const prevZIndex = siblings[targetIndex - 1].zIndex;
  const nextZIndex = siblings[targetIndex].zIndex;
  return (prevZIndex + nextZIndex) / 2;
};

export const getSiblingBoxes = (boxes: Box[], boxId: string): Box[] | null => {
  const box = boxes.find((b) => b.id === boxId);
  if (!box) return null;

  return boxes
    .filter((b) => b.parentId === box.parentId && b.id !== boxId)
    .sort((a, b) => a.zIndex - b.zIndex);
};

export const canMoveInDirection = (
  boxes: Box[],
  boxId: string,
  direction: "front" | "back" | "forward" | "backward"
): boolean => {
  const box = boxes.find((b) => b.id === boxId);
  if (!box) return false;

  const siblings = boxes
    .filter((b) => b.parentId === box.parentId)
    .sort((a, b) => a.zIndex - b.zIndex);

  const currentIndex = siblings.findIndex((b) => b.id === boxId);
  if (currentIndex === -1) return false;

  switch (direction) {
    case "front":
      return currentIndex < siblings.length - 1;
    case "back":
      return currentIndex > 0;
    case "forward":
      return currentIndex < siblings.length - 1;
    case "backward":
      return currentIndex > 0;
    default:
      return false;
  }
};
