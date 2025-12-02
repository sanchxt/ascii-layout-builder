import { useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { CANVAS_CONSTANTS } from "@/lib/constants";

const TRACKPAD_ZOOM_SENSITIVITY = 0.005;

export const useCanvasZoom = () => {
  const { viewport, setZoom, zoomIn, zoomOut, resetZoom } = useCanvasStore();

  const handleWheel = useCallback(
    (deltaY: number) => {
      const zoomFactor = 1 - deltaY * TRACKPAD_ZOOM_SENSITIVITY;
      const newZoom = Math.max(
        CANVAS_CONSTANTS.MIN_ZOOM,
        Math.min(CANVAS_CONSTANTS.MAX_ZOOM, viewport.zoom * zoomFactor)
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
