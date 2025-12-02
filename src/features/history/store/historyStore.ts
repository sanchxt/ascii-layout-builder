import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { HistoryState, BoxSnapshot } from "../types/history";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";

const MAX_HISTORY = 50;

const initialState = {
  past: [] as BoxSnapshot[],
  future: [] as BoxSnapshot[],
  maxHistory: MAX_HISTORY,
};

export const useHistoryStore = create<HistoryState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      undo: () => {
        const { past } = get();
        if (past.length === 0) return;

        const previousSnapshot = past[past.length - 1];
        const newPast = past.slice(0, -1);

        const boxStore = useBoxStore.getState();
        const lineStore = useLineStore.getState();
        const artboardStore = useArtboardStore.getState();

        const currentSnapshot: BoxSnapshot = {
          boxes: [...boxStore.boxes],
          selectedBoxIds: [...boxStore.selectedBoxIds],
          artboards: [...artboardStore.artboards],
          selectedArtboardIds: [...artboardStore.selectedArtboardIds],
          activeArtboardId: artboardStore.activeArtboardId,
          lines: [...lineStore.lines],
          selectedLineIds: [...lineStore.selectedLineIds],
          timestamp: Date.now(),
        };

        useBoxStore.setState({
          boxes: previousSnapshot.boxes,
          selectedBoxIds: previousSnapshot.selectedBoxIds,
        });

        useLineStore.setState({
          lines: previousSnapshot.lines || [],
          selectedLineIds: previousSnapshot.selectedLineIds || [],
        });

        useArtboardStore.setState({
          artboards: previousSnapshot.artboards,
          selectedArtboardIds: previousSnapshot.selectedArtboardIds,
          activeArtboardId: previousSnapshot.activeArtboardId,
        });

        set(
          (state) => ({
            past: newPast,
            future: [currentSnapshot, ...state.future],
          }),
          false,
          "history/undo"
        );
      },

      redo: () => {
        const { future } = get();
        if (future.length === 0) return;

        const nextSnapshot = future[0];
        const newFuture = future.slice(1);

        const boxStore = useBoxStore.getState();
        const lineStore = useLineStore.getState();
        const artboardStore = useArtboardStore.getState();

        const currentSnapshot: BoxSnapshot = {
          boxes: [...boxStore.boxes],
          selectedBoxIds: [...boxStore.selectedBoxIds],
          artboards: [...artboardStore.artboards],
          selectedArtboardIds: [...artboardStore.selectedArtboardIds],
          activeArtboardId: artboardStore.activeArtboardId,
          lines: [...lineStore.lines],
          selectedLineIds: [...lineStore.selectedLineIds],
          timestamp: Date.now(),
        };

        useBoxStore.setState({
          boxes: nextSnapshot.boxes,
          selectedBoxIds: nextSnapshot.selectedBoxIds,
        });

        useLineStore.setState({
          lines: nextSnapshot.lines || [],
          selectedLineIds: nextSnapshot.selectedLineIds || [],
        });

        useArtboardStore.setState({
          artboards: nextSnapshot.artboards,
          selectedArtboardIds: nextSnapshot.selectedArtboardIds,
          activeArtboardId: nextSnapshot.activeArtboardId,
        });

        set(
          (state) => ({
            past: [...state.past, currentSnapshot],
            future: newFuture,
          }),
          false,
          "history/redo"
        );
      },

      clearHistory: () =>
        set(
          () => ({
            past: [],
            future: [],
          }),
          false,
          "history/clearHistory"
        ),

      canUndo: () => get().past.length > 0,

      canRedo: () => get().future.length > 0,
    }),
    { name: "HistoryStore" }
  )
);

export const recordSnapshot = () => {
  const boxStore = useBoxStore.getState();
  const lineStore = useLineStore.getState();
  const artboardStore = useArtboardStore.getState();

  const snapshot: BoxSnapshot = {
    boxes: JSON.parse(JSON.stringify(boxStore.boxes)),
    selectedBoxIds: [...boxStore.selectedBoxIds],
    artboards: JSON.parse(JSON.stringify(artboardStore.artboards)),
    selectedArtboardIds: [...artboardStore.selectedArtboardIds],
    activeArtboardId: artboardStore.activeArtboardId,
    lines: JSON.parse(JSON.stringify(lineStore.lines)),
    selectedLineIds: [...lineStore.selectedLineIds],
    timestamp: Date.now(),
  };

  useHistoryStore.setState(
    (state) => ({
      past: [...state.past, snapshot].slice(-state.maxHistory),
      future: [],
    }),
    false,
    "history/recordSnapshot"
  );
};
