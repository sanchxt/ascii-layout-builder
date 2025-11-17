import { useMemo } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { CANVAS_CONSTANTS } from "@/lib/constants";

export const CanvasGrid = () => {
  const { viewport } = useCanvasStore();

  const gridStyle = useMemo(() => {
    if (!viewport.showGrid) {
      return {};
    }

    const gridSize = CANVAS_CONSTANTS.GRID_SIZE * viewport.zoom;
    const dotSize = CANVAS_CONSTANTS.GRID_DOT_SIZE;

    return {
      backgroundImage: `radial-gradient(circle, ${CANVAS_CONSTANTS.GRID_COLOR} ${dotSize}px, transparent ${dotSize}px)`,
      backgroundSize: `${gridSize}px ${gridSize}px`,
      backgroundPosition: `${viewport.position.x}px ${viewport.position.y}px`,
    };
  }, [viewport.showGrid, viewport.zoom, viewport.position]);

  if (!viewport.showGrid) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={gridStyle}
      aria-hidden="true"
    />
  );
};
