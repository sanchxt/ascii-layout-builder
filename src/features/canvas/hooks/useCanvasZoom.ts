import { useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { CANVAS_CONSTANTS } from "@/lib/constants";

export const useCanvasZoom = () => {
  const { viewport, setZoom, zoomIn, zoomOut, resetZoom } = useCanvasStore();

  const handleWheel = useCallback(
    (deltaY: number) => {
      if (deltaY > 0) {
        zoomOut();
      } else {
        zoomIn();
      }
    },
    [zoomIn, zoomOut]
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
