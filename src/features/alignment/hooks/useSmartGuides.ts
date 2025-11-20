import { useState, useEffect, useMemo, useRef } from "react";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import type {
  SmartGuide,
  SpacingGuide,
} from "@/features/alignment/types/alignment";
import {
  calculateBoundingBox,
  detectAlignmentGuides,
  detectSpacingGuides,
  calculateSnapAdjustment,
} from "@/features/alignment/lib/guideDetection";

interface UseSmartGuidesOptions {
  isDragging: boolean;
  draggedBoxIds: string[];
  currentDelta: { x: number; y: number };
  enabled?: boolean;
}

interface SmartGuidesResult {
  alignmentGuides: SmartGuide[];
  spacingGuides: SpacingGuide[];
  snappedDelta: { x: number; y: number } | null;
}

export function useSmartGuides(
  options: UseSmartGuidesOptions
): SmartGuidesResult {
  const {
    isDragging,
    draggedBoxIds,
    currentDelta,
    enabled = true,
  } = options;

  const allBoxes = useBoxStore((state) => state.boxes);
  const showSmartGuides = useCanvasStore(
    (state) => state.viewport.showSmartGuides ?? true
  );
  const snapToGrid = useCanvasStore((state) => state.viewport.snapToGrid);

  const [guides, setGuides] = useState<SmartGuidesResult>({
    alignmentGuides: [],
    spacingGuides: [],
    snappedDelta: null,
  });

  const rafRef = useRef<number | undefined>(undefined);

  const staticBoxes = useMemo(() => {
    return allBoxes.filter((box) => !draggedBoxIds.includes(box.id));
  }, [allBoxes, draggedBoxIds]);

  const draggedBoxes = useMemo(() => {
    return allBoxes.filter((box) => draggedBoxIds.includes(box.id));
  }, [allBoxes, draggedBoxIds]);

  useEffect(() => {
    if (!isDragging || !enabled || !showSmartGuides) {
      setGuides({
        alignmentGuides: [],
        spacingGuides: [],
        snappedDelta: null,
      });
      return;
    }

    if (draggedBoxes.length === 0) {
      setGuides({
        alignmentGuides: [],
        spacingGuides: [],
        snappedDelta: null,
      });
      return;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const draggedBoundsWithoutDelta = calculateBoundingBox(
        draggedBoxes,
        allBoxes
      );

      if (!currentDelta) {
        return;
      }

      const draggedBounds = {
        x: draggedBoundsWithoutDelta.x + currentDelta.x,
        y: draggedBoundsWithoutDelta.y + currentDelta.y,
        width: draggedBoundsWithoutDelta.width,
        height: draggedBoundsWithoutDelta.height,
      };

      const alignmentGuides = detectAlignmentGuides(
        draggedBounds,
        staticBoxes,
        allBoxes
      );

      const spacingGuides = detectSpacingGuides(
        draggedBounds,
        staticBoxes,
        allBoxes
      );

      let snappedDelta: { x: number; y: number } | null = null;
      if (alignmentGuides.length > 0 && !snapToGrid) {
        snappedDelta = calculateSnapAdjustment(
          currentDelta,
          draggedBounds,
          alignmentGuides
        );
      }

      setGuides({
        alignmentGuides,
        spacingGuides,
        snappedDelta,
      });
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    isDragging,
    enabled,
    showSmartGuides,
    draggedBoxIds,
    currentDelta,
    staticBoxes,
    draggedBoxes,
    allBoxes,
    snapToGrid,
  ]);

  return guides;
}
