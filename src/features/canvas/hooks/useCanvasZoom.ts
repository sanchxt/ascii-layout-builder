import { useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { CANVAS_CONSTANTS } from "@/lib/constants";

const WHEEL_ZOOM_STEP = 0.05;
const MOUSE_WHEEL_THRESHOLD = 50;
const TRACKPAD_ZOOM_SENSITIVITY = 0.002;

export const useCanvasZoom = () => {
  const { viewport, setZoom, zoomIn, zoomOut, resetZoom } = useCanvasStore();

  const handleWheel = useCallback(
    (deltaY: number) => {
      const absDelta = Math.abs(deltaY);
      let newZoom: number;

      if (absDelta >= MOUSE_WHEEL_THRESHOLD) {
        const direction = deltaY > 0 ? -1 : 1;
        newZoom = viewport.zoom + direction * WHEEL_ZOOM_STEP;
      } else {
        const zoomFactor = 1 - deltaY * TRACKPAD_ZOOM_SENSITIVITY;
        newZoom = viewport.zoom * zoomFactor;
      }

      newZoom = Math.max(
        CANVAS_CONSTANTS.MIN_ZOOM,
        Math.min(CANVAS_CONSTANTS.MAX_ZOOM, newZoom)
      );
      setZoom(newZoom);
    },
    [viewport.zoom, setZoom]
  );

  const getZoomPercentage = useCallback(() => {
    return `${Math.round(viewport.zoom * 100)}%`;
  }, [viewport.zoom]);

  const canZoomIn = viewport.zoom < CANVAS_CONSTANTS.MAX_ZOOM;

  const canZoomOut = viewport.zoom > CANVAS_CONSTANTS.MIN_ZOOM;

  return {
    handleWheel,
    zoom: viewport.zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    getZoomPercentage,
    canZoomIn,
    canZoomOut,
  };
};
