import type { Box } from "@/types/box";

export interface BoxSnapshot {
  boxes: Box[];
  selectedBoxIds: string[];
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
