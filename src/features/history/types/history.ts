import type { Box } from "@/types/box";
import type { Artboard } from "@/types/artboard";

export interface BoxSnapshot {
  boxes: Box[];
  selectedBoxIds: string[];
  artboards: Artboard[];
  selectedArtboardIds: string[];
  activeArtboardId: string | null;
  timestamp: number;
}

export interface HistoryState {
  past: BoxSnapshot[];
  future: BoxSnapshot[];
  maxHistory: number;

  // actions
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
