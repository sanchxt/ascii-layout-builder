import { useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { CANVAS_CONSTANTS } from "@/lib/constants";

export const useCanvasZoom = () => {
  const { viewport, setZoom, zoomIn, zoomOut, resetZoom } = useCanvasStore();

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const delta =
          e.deltaY > 0
            ? -CANVAS_CONSTANTS.ZOOM_STEP
            : CANVAS_CONSTANTS.ZOOM_STEP;
        const newZoom = viewport.zoom + delta;

        setZoom(newZoom);
      }
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
