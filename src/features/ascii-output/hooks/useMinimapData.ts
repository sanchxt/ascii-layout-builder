import { useMemo, useCallback } from "react";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { getAbsolutePosition } from "@/features/boxes/utils/boxHierarchy";
import { getLineAbsolutePosition } from "@/features/lines/utils/lineHierarchy";
import type {
  MinimapData,
  MinimapElement,
  MinimapBounds,
  MinimapViewport,
} from "../types/ascii";
import type { Box } from "@/types/box";
import type { Line } from "@/types/line";
import type { Artboard } from "@/types/artboard";

const DEFAULT_BOUNDS: MinimapBounds = {
  minX: 0,
  minY: 0,
  maxX: 800,
  maxY: 600,
  width: 800,
  height: 600,
};

const PADDING = 40;

function calculateCanvasBounds(
  boxes: Box[],
  lines: Line[],
  artboards: Artboard[]
): MinimapBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Include artboards
  for (const artboard of artboards) {
    if (!artboard.visible) continue;
    minX = Math.min(minX, artboard.x);
    minY = Math.min(minY, artboard.y);
    maxX = Math.max(maxX, artboard.x + artboard.width);
    maxY = Math.max(maxY, artboard.y + artboard.height);
  }

  // Include all boxes (using absolute positions)
  for (const box of boxes) {
    if (box.visible === false) continue;
    const absPos = getAbsolutePosition(box, boxes);
    minX = Math.min(minX, absPos.x);
    minY = Math.min(minY, absPos.y);
    maxX = Math.max(maxX, absPos.x + box.width);
    maxY = Math.max(maxY, absPos.y + box.height);
  }

  // Include all lines
  for (const line of lines) {
    if (line.visible === false) continue;
    const absPos = getLineAbsolutePosition(line, boxes);
    minX = Math.min(minX, absPos.startX, absPos.endX);
    minY = Math.min(minY, absPos.startY, absPos.endY);
    maxX = Math.max(maxX, absPos.startX, absPos.endX);
    maxY = Math.max(maxY, absPos.startY, absPos.endY);
  }

  // Handle empty canvas
  if (minX === Infinity) {
    return DEFAULT_BOUNDS;
  }

  // Add padding
  minX -= PADDING;
  minY -= PADDING;
  maxX += PADDING;
  maxY += PADDING;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function calculateScale(
  bounds: MinimapBounds,
  maxWidth: number,
  maxHeight: number
): number {
  const scaleX = maxWidth / bounds.width;
  const scaleY = maxHeight / bounds.height;
  // Never scale up beyond 1
  return Math.min(scaleX, scaleY, 1);
}

function transformElements(
  boxes: Box[],
  lines: Line[],
  artboards: Artboard[],
  bounds: MinimapBounds,
  scale: number,
  selectedBoxIds: string[],
  selectedLineIds: string[]
): MinimapElement[] {
  const elements: MinimapElement[] = [];

  // Artboards first (background)
  for (const artboard of artboards) {
    if (!artboard.visible) continue;
    elements.push({
      id: artboard.id,
      type: "artboard",
      x: (artboard.x - bounds.minX) * scale,
      y: (artboard.y - bounds.minY) * scale,
      width: artboard.width * scale,
      height: artboard.height * scale,
      color: "var(--muted)",
    });
  }

  // Boxes (with absolute positions)
  for (const box of boxes) {
    if (box.visible === false) continue;
    const absPos = getAbsolutePosition(box, boxes);
    const isSelected = selectedBoxIds.includes(box.id);
    elements.push({
      id: box.id,
      type: "box",
      x: (absPos.x - bounds.minX) * scale,
      y: (absPos.y - bounds.minY) * scale,
      width: box.width * scale,
      height: box.height * scale,
      color: isSelected ? "var(--primary)" : "var(--foreground)",
      isSelected,
      isNested: !!box.parentId,
    });
  }

  // Lines
  for (const line of lines) {
    if (line.visible === false) continue;
    const absPos = getLineAbsolutePosition(line, boxes);
    const isSelected = selectedLineIds.includes(line.id);
    elements.push({
      id: line.id,
      type: "line",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      startX: (absPos.startX - bounds.minX) * scale,
      startY: (absPos.startY - bounds.minY) * scale,
      endX: (absPos.endX - bounds.minX) * scale,
      endY: (absPos.endY - bounds.minY) * scale,
      color: isSelected ? "var(--primary)" : "var(--muted-foreground)",
      isSelected,
    });
  }

  return elements;
}

interface UseMinimapDataOptions {
  containerWidth?: number;
  containerHeight?: number;
}

export function useMinimapData(options: UseMinimapDataOptions = {}): MinimapData {
  const { containerWidth = 200, containerHeight = 100 } = options;

  const boxes = useBoxStore((state) => state.boxes);
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const lines = useLineStore((state) => state.lines);
  const selectedLineIds = useLineStore((state) => state.selectedLineIds);
  const artboards = useArtboardStore((state) => state.artboards);
  const viewport = useCanvasStore((state) => state.viewport);

  const minimapData = useMemo(() => {
    // Calculate canvas bounds from all elements
    const bounds = calculateCanvasBounds(boxes, lines, artboards);

    // Calculate scale to fit minimap
    const scale = calculateScale(bounds, containerWidth, containerHeight);

    // Transform elements to minimap coordinates
    const elements = transformElements(
      boxes,
      lines,
      artboards,
      bounds,
      scale,
      selectedBoxIds,
      selectedLineIds
    );

    // Calculate visible viewport rectangle
    // Note: We need to get container dimensions for accurate viewport calculation
    // For now, use a reasonable default
    const canvasContainerWidth =
      typeof window !== "undefined" ? window.innerWidth * 0.7 : 1200;
    const canvasContainerHeight =
      typeof window !== "undefined" ? window.innerHeight - 200 : 700;

    const visibleX = -viewport.position.x / viewport.zoom;
    const visibleY = -viewport.position.y / viewport.zoom;
    const visibleWidth = canvasContainerWidth / viewport.zoom;
    const visibleHeight = canvasContainerHeight / viewport.zoom;

    const minimapViewport: MinimapViewport = {
      x: (visibleX - bounds.minX) * scale,
      y: (visibleY - bounds.minY) * scale,
      width: visibleWidth * scale,
      height: visibleHeight * scale,
    };

    return {
      elements,
      bounds,
      viewport: minimapViewport,
      scale,
    };
  }, [
    boxes,
    lines,
    artboards,
    viewport,
    selectedBoxIds,
    selectedLineIds,
    containerWidth,
    containerHeight,
  ]);

  return minimapData;
}

// Helper hook for click-to-navigate functionality
export function useMinimapNavigation() {
  const setPan = useCanvasStore((state) => state.setPan);
  const zoom = useCanvasStore((state) => state.viewport.zoom);

  const navigateToPoint = useCallback(
    (canvasX: number, canvasY: number) => {
      // Get approximate container dimensions
      const containerWidth =
        typeof window !== "undefined" ? window.innerWidth * 0.7 : 1200;
      const containerHeight =
        typeof window !== "undefined" ? window.innerHeight - 200 : 700;

      // Calculate new pan position to center the clicked point
      const newPanX = -(canvasX * zoom - containerWidth / 2);
      const newPanY = -(canvasY * zoom - containerHeight / 2);

      setPan({ x: newPanX, y: newPanY });
    },
    [zoom, setPan]
  );

  return { navigateToPoint };
}
