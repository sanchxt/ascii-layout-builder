import { useCallback, useEffect, useRef } from "react";
import type { Box, ResizeHandle } from "@/types/box";
import type { CanvasPosition } from "@/types/canvas";
import { calculateResizedBox } from "../utils/boxGeometry";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { screenToCanvas } from "@/features/canvas/utils/coordinateTransform";

export const useBoxResize = (
  box: Box,
  onUpdate: (id: string, updates: Partial<Box>) => void,
  getCanvasBounds: () => DOMRect | null
) => {
  const { viewport } = useCanvasStore();
  const resizingRef = useRef<{
    handle: ResizeHandle;
    startPoint: CanvasPosition;
    startBox: Box;
  } | null>(null);

  const handleMouseDown = useCallback(
    (handle: ResizeHandle, e: React.MouseEvent) => {
      e.stopPropagation();

      const bounds = getCanvasBounds();
      if (!bounds) return;

      const startPoint = screenToCanvas(e.clientX, e.clientY, bounds, viewport);

      resizingRef.current = {
        handle,
        startPoint,
        startBox: { ...box },
      };
    },
    [box, viewport, getCanvasBounds]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingRef.current) return;

      const bounds = getCanvasBounds();
      if (!bounds) return;

      const currentPoint = screenToCanvas(
        e.clientX,
        e.clientY,
        bounds,
        viewport
      );

      const resizedBox = calculateResizedBox(
        resizingRef.current.startBox,
        resizingRef.current.handle,
        currentPoint
      );

      onUpdate(box.id, resizedBox);
    },
    [box.id, onUpdate, viewport, getCanvasBounds]
  );

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
  }, []);

  useEffect(() => {
    if (resizingRef.current) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  return {
    handleMouseDown,
  };
};
