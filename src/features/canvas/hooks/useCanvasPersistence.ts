import { useEffect } from "react";
import { useCanvasStore } from "../store/canvasStore";

export const useCanvasPersistence = () => {
  const { viewport, resetCanvas } = useCanvasStore();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug("[Canvas] State updated:", {
        position: viewport.position,
        zoom: viewport.zoom,
        showGrid: viewport.showGrid,
      });
    }
  }, [viewport]);

  const clearPersistedState = () => {
    resetCanvas();
    if (import.meta.env.DEV) {
      console.debug("[Canvas] Persisted state cleared");
    }
  };

  return {
    clearPersistedState,
  };
};
