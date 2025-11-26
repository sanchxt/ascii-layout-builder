import type { Artboard } from "@/types/artboard";

export const canvasToArtboardRelative = (
  canvasX: number,
  canvasY: number,
  artboard: Artboard
): { x: number; y: number } => {
  return {
    x: canvasX - artboard.x,
    y: canvasY - artboard.y,
  };
};

export const artboardToCanvasAbsolute = (
  artboardX: number,
  artboardY: number,
  artboard: Artboard
): { x: number; y: number } => {
  return {
    x: artboard.x + artboardX,
    y: artboard.y + artboardY,
  };
};
