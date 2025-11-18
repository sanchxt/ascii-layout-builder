import type { CanvasViewport } from "@/types/canvas";

export const screenToCanvas = (
  screenX: number,
  screenY: number,
  canvasBounds: DOMRect,
  viewport: CanvasViewport
): { x: number; y: number } => {
  return {
    x: (screenX - canvasBounds.left - viewport.position.x) / viewport.zoom,
    y: (screenY - canvasBounds.top - viewport.position.y) / viewport.zoom,
  };
};

export const canvasToScreen = (
  canvasX: number,
  canvasY: number,
  canvasBounds: DOMRect,
  viewport: CanvasViewport
): { x: number; y: number } => {
  return {
    x: canvasX * viewport.zoom + viewport.position.x + canvasBounds.left,
    y: canvasY * viewport.zoom + viewport.position.y + canvasBounds.top,
  };
};
