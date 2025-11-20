import type { Box } from "@/types/box";
import { getAbsolutePosition } from "@/features/boxes/utils/boxHierarchy";
import { ALIGNMENT_CONSTANTS } from "@/lib/constants";
import type {
  SmartGuide,
  SpacingGuide,
  AlignmentPoint,
} from "@/features/alignment/types/alignment";

export function calculateBoundingBox(
  boxes: Box[],
  allBoxes: Box[]
): { x: number; y: number; width: number; height: number } {
  if (boxes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  if (boxes.length === 1) {
    const absPos = getAbsolutePosition(boxes[0], allBoxes);
    return {
      x: absPos.x,
      y: absPos.y,
      width: boxes[0].width,
      height: boxes[0].height,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const box of boxes) {
    const absPos = getAbsolutePosition(box, allBoxes);
    minX = Math.min(minX, absPos.x);
    minY = Math.min(minY, absPos.y);
    maxX = Math.max(maxX, absPos.x + box.width);
    maxY = Math.max(maxY, absPos.y + box.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function calculateAlignmentPoints(
  bounds: { x: number; y: number; width: number; height: number },
  boxId: string
): AlignmentPoint[] {
  return [
    {
      type: "left",
      orientation: "vertical",
      value: bounds.x,
      boxId,
    },
    {
      type: "center",
      orientation: "vertical",
      value: bounds.x + bounds.width / 2,
      boxId,
    },
    {
      type: "right",
      orientation: "vertical",
      value: bounds.x + bounds.width,
      boxId,
    },
    {
      type: "top",
      orientation: "horizontal",
      value: bounds.y,
      boxId,
    },
    {
      type: "middle",
      orientation: "horizontal",
      value: bounds.y + bounds.height / 2,
      boxId,
    },
    {
      type: "bottom",
      orientation: "horizontal",
      value: bounds.y + bounds.height,
      boxId,
    },
  ];
}

export function mergeOverlappingGuides(guides: SmartGuide[]): SmartGuide[] {
  if (guides.length === 0) return [];

  const merged: SmartGuide[] = [];
  const tolerance = 0.5;

  for (const guide of guides) {
    const existing = merged.find(
      (g) =>
        g.type === guide.type &&
        Math.abs(g.position - guide.position) < tolerance
    );

    if (existing) {
      existing.matchedBoxIds = [
        ...new Set([...existing.matchedBoxIds, ...guide.matchedBoxIds]),
      ];
    } else {
      merged.push({ ...guide });
    }
  }

  return merged;
}

export function calculateSnapAdjustment(
  currentDelta: { x: number; y: number },
  draggedBounds: { x: number; y: number; width: number; height: number },
  guides: SmartGuide[]
): { x: number; y: number } | null {
  if (guides.length === 0) return null;

  let snapDeltaX = currentDelta.x;
  let snapDeltaY = currentDelta.y;
  let hasVerticalSnap = false;
  let hasHorizontalSnap = false;

  const draggedPoints = calculateAlignmentPoints(draggedBounds, "dragged");

  for (const guide of guides) {
    const matchingPoint = draggedPoints.find(
      (p) => p.orientation === guide.type && p.type === guide.alignmentPoint
    );

    if (!matchingPoint) continue;

    const adjustment = guide.position - matchingPoint.value;

    if (guide.type === "vertical" && !hasVerticalSnap) {
      snapDeltaX = currentDelta.x + adjustment;
      hasVerticalSnap = true;
    } else if (guide.type === "horizontal" && !hasHorizontalSnap) {
      snapDeltaY = currentDelta.y + adjustment;
      hasHorizontalSnap = true;
    }

    if (hasVerticalSnap && hasHorizontalSnap) break;
  }

  if (hasVerticalSnap || hasHorizontalSnap) {
    return { x: snapDeltaX, y: snapDeltaY };
  }

  return null;
}

export function detectAlignmentGuides(
  draggedBounds: { x: number; y: number; width: number; height: number },
  staticBoxes: Box[],
  allBoxes: Box[],
  threshold: number = ALIGNMENT_CONSTANTS.GUIDE_SNAP_THRESHOLD
): SmartGuide[] {
  const guides: SmartGuide[] = [];

  const draggedPoints = calculateAlignmentPoints(draggedBounds, "dragged");

  for (const staticBox of staticBoxes) {
    const staticAbsPos = getAbsolutePosition(staticBox, allBoxes);
    const staticBounds = {
      x: staticAbsPos.x,
      y: staticAbsPos.y,
      width: staticBox.width,
      height: staticBox.height,
    };
    const staticPoints = calculateAlignmentPoints(staticBounds, staticBox.id);

    for (const draggedPoint of draggedPoints) {
      for (const staticPoint of staticPoints) {
        if (draggedPoint.orientation !== staticPoint.orientation) continue;

        const distance = Math.abs(draggedPoint.value - staticPoint.value);

        if (distance <= threshold) {
          guides.push({
            type: draggedPoint.orientation,
            position: staticPoint.value,
            matchedBoxIds: [staticBox.id],
            alignmentPoint: draggedPoint.type,
          });
        }
      }
    }
  }

  return mergeOverlappingGuides(guides);
}

function calculateSpacing(
  bounds1: { x: number; y: number; width: number; height: number },
  bounds2: { x: number; y: number; width: number; height: number }
): {
  horizontal: number;
  vertical: number;
  nearestAxis: "horizontal" | "vertical";
  nearestDistance: number;
} {
  const horizontalSpacing = Math.max(
    0,
    bounds1.x > bounds2.x
      ? bounds1.x - (bounds2.x + bounds2.width)
      : bounds2.x - (bounds1.x + bounds1.width)
  );

  const verticalSpacing = Math.max(
    0,
    bounds1.y > bounds2.y
      ? bounds1.y - (bounds2.y + bounds2.height)
      : bounds2.y - (bounds1.y + bounds1.height)
  );

  const nearestAxis =
    horizontalSpacing <= verticalSpacing ? "horizontal" : "vertical";
  const nearestDistance =
    nearestAxis === "horizontal" ? horizontalSpacing : verticalSpacing;

  return {
    horizontal: horizontalSpacing,
    vertical: verticalSpacing,
    nearestAxis,
    nearestDistance,
  };
}

function calculateGuideEndpoints(
  bounds1: { x: number; y: number; width: number; height: number },
  bounds2: { x: number; y: number; width: number; height: number },
  axis: "horizontal" | "vertical"
): {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
} {
  if (axis === "horizontal") {
    const leftBox = bounds1.x < bounds2.x ? bounds1 : bounds2;
    const rightBox = bounds1.x < bounds2.x ? bounds2 : bounds1;

    const centerY = Math.max(
      leftBox.y,
      Math.min(leftBox.y + leftBox.height, rightBox.y + rightBox.height / 2)
    );

    return {
      startPoint: { x: leftBox.x + leftBox.width, y: centerY },
      endPoint: { x: rightBox.x, y: centerY },
    };
  } else {
    const topBox = bounds1.y < bounds2.y ? bounds1 : bounds2;
    const bottomBox = bounds1.y < bounds2.y ? bounds2 : bounds1;

    const centerX = Math.max(
      topBox.x,
      Math.min(topBox.x + topBox.width, bottomBox.x + bottomBox.width / 2)
    );

    return {
      startPoint: { x: centerX, y: topBox.y + topBox.height },
      endPoint: { x: centerX, y: bottomBox.y },
    };
  }
}

export function detectSpacingGuides(
  draggedBounds: { x: number; y: number; width: number; height: number },
  staticBoxes: Box[],
  allBoxes: Box[],
  maxDistance: number = ALIGNMENT_CONSTANTS.SPACING_GUIDE_MAX_DISTANCE
): SpacingGuide[] {
  const spacingGuides: SpacingGuide[] = [];

  for (const staticBox of staticBoxes) {
    const staticAbsPos = getAbsolutePosition(staticBox, allBoxes);
    const staticBounds = {
      x: staticAbsPos.x,
      y: staticAbsPos.y,
      width: staticBox.width,
      height: staticBox.height,
    };

    const spacing = calculateSpacing(draggedBounds, staticBounds);

    if (spacing.nearestDistance > 0 && spacing.nearestDistance <= maxDistance) {
      const { startPoint, endPoint } = calculateGuideEndpoints(
        draggedBounds,
        staticBounds,
        spacing.nearestAxis
      );

      spacingGuides.push({
        type: spacing.nearestAxis,
        fromBoxId: "dragged",
        toBoxId: staticBox.id,
        distance: spacing.nearestDistance,
        startPoint,
        endPoint,
      });
    }
  }

  return spacingGuides.sort((a, b) => a.distance - b.distance).slice(0, 3);
}
