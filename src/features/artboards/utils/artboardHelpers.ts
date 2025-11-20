import type { Artboard, ArtboardPreset } from "@/types/artboard";
import type { Box } from "@/types/box";
import { getPresetName } from "./artboardPresets";

export interface Point {
  x: number;
  y: number;
}

export function isPointInArtboard(point: Point, artboard: Artboard): boolean {
  return (
    point.x >= artboard.x &&
    point.x <= artboard.x + artboard.width &&
    point.y >= artboard.y &&
    point.y <= artboard.y + artboard.height
  );
}

export function getBoxesInArtboard(artboardId: string, boxes: Box[]): Box[] {
  return boxes.filter((box) => box.artboardId === artboardId);
}

export function getOrphanBoxes(boxes: Box[]): Box[] {
  return boxes.filter((box) => !box.artboardId);
}

export function generateDefaultArtboardName(
  preset: ArtboardPreset,
  existingArtboards: Artboard[]
): string {
  const baseName = getPresetName(preset);

  if (existingArtboards.length === 0) {
    return `${baseName} 1`;
  }

  const pattern = new RegExp(`^${baseName} (\\d+)$`);
  const existingNumbers: number[] = [];

  for (const artboard of existingArtboards) {
    const match = artboard.name.match(pattern);
    if (match && match[1]) {
      existingNumbers.push(parseInt(match[1], 10));
    }
  }

  if (existingNumbers.length === 0) {
    return `${baseName} 1`;
  }

  const maxNumber = Math.max(...existingNumbers);
  return `${baseName} ${maxNumber + 1}`;
}

export function calculatePastePosition(
  box: Box,
  sourceArtboard: Artboard | null,
  targetArtboard: Artboard | null,
  pasteOffset = 20
): Point {
  if (!sourceArtboard && !targetArtboard) {
    return {
      x: box.x + pasteOffset,
      y: box.y + pasteOffset,
    };
  }

  if (sourceArtboard && !targetArtboard) {
    return {
      x: box.x + pasteOffset,
      y: box.y + pasteOffset,
    };
  }

  if (!sourceArtboard && targetArtboard) {
    const relativeX = box.x - targetArtboard.x;
    const relativeY = box.y - targetArtboard.y;

    const fitsHorizontally =
      relativeX >= 0 && relativeX + box.width <= targetArtboard.width;
    const fitsVertically =
      relativeY >= 0 && relativeY + box.height <= targetArtboard.height;

    if (fitsHorizontally && fitsVertically) {
      return { x: box.x + pasteOffset, y: box.y + pasteOffset };
    }

    return {
      x: targetArtboard.x + (targetArtboard.width - box.width) / 2,
      y: targetArtboard.y + (targetArtboard.height - box.height) / 2,
    };
  }

  if (sourceArtboard && targetArtboard) {
    if (sourceArtboard.id === targetArtboard.id) {
      return {
        x: box.x + pasteOffset,
        y: box.y + pasteOffset,
      };
    }

    const relativeX = box.x - sourceArtboard.x;
    const relativeY = box.y - sourceArtboard.y;

    let newX = targetArtboard.x + relativeX;
    let newY = targetArtboard.y + relativeY;

    const wouldOverflowRight =
      newX + box.width > targetArtboard.x + targetArtboard.width;
    const wouldOverflowBottom =
      newY + box.height > targetArtboard.y + targetArtboard.height;
    const wouldOverflowLeft = newX < targetArtboard.x;
    const wouldOverflowTop = newY < targetArtboard.y;

    if (
      wouldOverflowRight ||
      wouldOverflowBottom ||
      wouldOverflowLeft ||
      wouldOverflowTop
    ) {
      newX =
        targetArtboard.x + (targetArtboard.width - box.width) / 2 + pasteOffset;
      newY =
        targetArtboard.y +
        (targetArtboard.height - box.height) / 2 +
        pasteOffset;

      newX = Math.max(
        targetArtboard.x,
        Math.min(newX, targetArtboard.x + targetArtboard.width - box.width)
      );
      newY = Math.max(
        targetArtboard.y,
        Math.min(newY, targetArtboard.y + targetArtboard.height - box.height)
      );
    }

    return { x: newX, y: newY };
  }

  return {
    x: box.x + pasteOffset,
    y: box.y + pasteOffset,
  };
}

export function isBoxInArtboard(box: Box, artboard: Artboard): boolean {
  return (
    box.x >= artboard.x &&
    box.x + box.width <= artboard.x + artboard.width &&
    box.y >= artboard.y &&
    box.y + box.height <= artboard.y + artboard.height
  );
}

export function getBoxOverflow(
  box: Box,
  artboard: Artboard
): { top: boolean; right: boolean; bottom: boolean; left: boolean } | null {
  const overflows = {
    top: box.y < artboard.y,
    right: box.x + box.width > artboard.x + artboard.width,
    bottom: box.y + box.height > artboard.y + artboard.height,
    left: box.x < artboard.x,
  };

  const hasOverflow = Object.values(overflows).some((overflow) => overflow);
  return hasOverflow ? overflows : null;
}

export function findArtboardAtPoint(
  point: Point,
  artboards: Artboard[]
): Artboard | null {
  const containingArtboards = artboards.filter(
    (artboard) => artboard.visible && isPointInArtboard(point, artboard)
  );

  if (containingArtboards.length === 0) {
    return null;
  }

  return containingArtboards.reduce((highest, current) =>
    current.zIndex > highest.zIndex ? current : highest
  );
}

export function getArtboardContentBounds(
  artboardId: string,
  boxes: Box[]
): { x: number; y: number; width: number; height: number } | null {
  const artboardBoxes = getBoxesInArtboard(artboardId, boxes);

  if (artboardBoxes.length === 0) {
    return null;
  }

  const minX = Math.min(...artboardBoxes.map((box) => box.x));
  const minY = Math.min(...artboardBoxes.map((box) => box.y));
  const maxX = Math.max(...artboardBoxes.map((box) => box.x + box.width));
  const maxY = Math.max(...artboardBoxes.map((box) => box.y + box.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
