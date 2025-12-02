import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { LineState, Line, LineCreationMode } from "@/types/line";
import { STORAGE_KEYS } from "@/lib/constants";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { getLineAbsolutePosition } from "../utils/lineHierarchy";

let recordSnapshotFn: (() => void) | null = null;
export const setLineRecordSnapshotFn = (fn: () => void) => {
  recordSnapshotFn = fn;
};
const recordSnapshot = () => {
  if (recordSnapshotFn) recordSnapshotFn();
};

const initialState = {
  lines: [] as Line[],
  selectedLineIds: [] as string[],
  creationMode: "idle" as LineCreationMode,
  tempLine: null as Partial<Line> | null,
  clipboardLineIds: [] as string[],
};

export const useLineStore = create<LineState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addLine: (line) => {
          recordSnapshot();
          useBoxStore.getState().clearSelection();
          set(
            (state) => ({
              lines: [...state.lines, line],
              selectedLineIds: [line.id],
            }),
            false,
            "line/addLine"
          );
        },

        addLines: (newLines) => {
          if (newLines.length === 0) return;
          recordSnapshot();
          set(
            (state) => ({
              lines: [...state.lines, ...newLines],
            }),
            false,
            "line/addLines"
          );
        },

        updateLine: (id, updates) => {
          recordSnapshot();
          set(
            (state) => ({
              lines: state.lines.map((line) =>
                line.id === id ? { ...line, ...updates } : line
              ),
            }),
            false,
            "line/updateLine"
          );
        },

        deleteLine: (id) => {
          recordSnapshot();
          set(
            (state) => ({
              lines: state.lines.filter((line) => line.id !== id),
              selectedLineIds: state.selectedLineIds.filter(
                (lineId) => lineId !== id
              ),
            }),
            false,
            "line/deleteLine"
          );
        },

        deleteLines: (ids) => {
          recordSnapshot();
          const idsToDelete = new Set(ids);
          set(
            (state) => ({
              lines: state.lines.filter((line) => !idsToDelete.has(line.id)),
              selectedLineIds: state.selectedLineIds.filter(
                (lineId) => !idsToDelete.has(lineId)
              ),
            }),
            false,
            "line/deleteLines"
          );
        },

        selectLine: (id, multi = false, skipBoxClear = false) => {
          if (!skipBoxClear) {
            useBoxStore.getState().clearSelection();
          }

          set(
            (state) => {
              if (multi) {
                const isSelected = state.selectedLineIds.includes(id);
                return {
                  selectedLineIds: isSelected
                    ? state.selectedLineIds.filter((lineId) => lineId !== id)
                    : [...state.selectedLineIds, id],
                };
              } else {
                return {
                  selectedLineIds: [id],
                };
              }
            },
            false,
            "line/selectLine"
          );
        },

        clearLineSelection: () =>
          set(
            () => ({
              selectedLineIds: [],
            }),
            false,
            "line/clearLineSelection"
          ),

        selectAllLines: () =>
          set(
            (state) => ({
              selectedLineIds: state.lines.map((line) => line.id),
            }),
            false,
            "line/selectAllLines"
          ),

        setLineCreationMode: (creationMode) =>
          set(
            () => ({
              creationMode,
            }),
            false,
            "line/setLineCreationMode"
          ),

        setTempLine: (tempLine) =>
          set(
            () => ({
              tempLine,
            }),
            false,
            "line/setTempLine"
          ),

        duplicateLines: (ids) => {
          recordSnapshot();
          set(
            (state) => {
              const linesToDuplicate = state.lines.filter((line) =>
                ids.includes(line.id)
              );

              const duplicatedLines = linesToDuplicate.map((line) => ({
                ...line,
                id: crypto.randomUUID(),
                startX: line.startX + 20,
                startY: line.startY + 20,
                endX: line.endX + 20,
                endY: line.endY + 20,
                startConnection: undefined,
                endConnection: undefined,
              }));

              const duplicatedIds = duplicatedLines.map((line) => line.id);

              return {
                lines: [...state.lines, ...duplicatedLines],
                selectedLineIds: duplicatedIds,
              };
            },
            false,
            "line/duplicateLines"
          );
        },

        copyLines: () =>
          set(
            (state) => ({
              clipboardLineIds: [...state.selectedLineIds],
            }),
            false,
            "line/copyLines"
          ),

        pasteLines: () => {
          recordSnapshot();
          set(
            (state) => {
              if (state.clipboardLineIds.length === 0) {
                return state;
              }

              const artboardStore = useArtboardStore.getState();
              const activeArtboardId = artboardStore.activeArtboardId;
              const boxes = useBoxStore.getState().boxes;

              const linesToPaste = state.lines.filter((line) =>
                state.clipboardLineIds.includes(line.id)
              );

              const pastedLines = linesToPaste.map((line) => {
                let coords = {
                  startX: line.startX,
                  startY: line.startY,
                  endX: line.endX,
                  endY: line.endY,
                };

                if (line.parentId) {
                  coords = getLineAbsolutePosition(line, boxes);
                }

                return {
                  ...line,
                  id: crypto.randomUUID(),
                  startX: coords.startX + 20,
                  startY: coords.startY + 20,
                  endX: coords.endX + 20,
                  endY: coords.endY + 20,
                  parentId: undefined,
                  artboardId: activeArtboardId || undefined,
                  startConnection: undefined,
                  endConnection: undefined,
                };
              });

              const pastedIds = pastedLines.map((line) => line.id);

              useBoxStore.getState().clearSelection();

              return {
                lines: [...state.lines, ...pastedLines],
                selectedLineIds: pastedIds,
              };
            },
            false,
            "line/pasteLines"
          );
        },

        getLine: (id) => {
          const state = get();
          return state.lines.find((line) => line.id === id);
        },

        getSelectedLines: () => {
          const state = get();
          return state.lines.filter((line) =>
            state.selectedLineIds.includes(line.id)
          );
        },

        getLinesInArtboard: (artboardId) => {
          const state = get();
          return state.lines.filter((line) => line.artboardId === artboardId);
        },

        getLinesConnectedToBox: (boxId) => {
          const state = get();
          return state.lines.filter(
            (line) =>
              line.startConnection?.boxId === boxId ||
              line.endConnection?.boxId === boxId
          );
        },

        getLinesInBox: (boxId) => {
          const state = get();
          return state.lines.filter((line) => line.parentId === boxId);
        },

        setParent: (lineId, parentId) => {
          recordSnapshot();
          set(
            (state) => ({
              lines: state.lines.map((line) =>
                line.id === lineId
                  ? {
                      ...line,
                      parentId,
                      artboardId: parentId ? undefined : line.artboardId,
                    }
                  : line
              ),
            }),
            false,
            "line/setParent"
          );
        },

        detachFromParent: (lineId) => {
          recordSnapshot();
          set(
            (state) => ({
              lines: state.lines.map((line) =>
                line.id === lineId
                  ? {
                      ...line,
                      parentId: undefined,
                    }
                  : line
              ),
            }),
            false,
            "line/detachFromParent"
          );
        },

        moveLineToFront: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const maxZ = Math.max(...state.lines.map((l) => l.zIndex), 0);
              return {
                lines: state.lines.map((line) =>
                  line.id === id ? { ...line, zIndex: maxZ + 1 } : line
                ),
              };
            },
            false,
            "line/moveLineToFront"
          );
        },

        moveLineToBack: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const minZ = Math.min(...state.lines.map((l) => l.zIndex), 0);
              return {
                lines: state.lines.map((line) =>
                  line.id === id ? { ...line, zIndex: minZ - 1 } : line
                ),
              };
            },
            false,
            "line/moveLineToBack"
          );
        },

        moveLineForward: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const line = state.lines.find((l) => l.id === id);
              if (!line) return state;

              const higherLines = state.lines
                .filter((l) => l.zIndex > line.zIndex)
                .sort((a, b) => a.zIndex - b.zIndex);

              if (higherLines.length === 0) return state;

              const nextHigher = higherLines[0];
              return {
                lines: state.lines.map((l) => {
                  if (l.id === id) return { ...l, zIndex: nextHigher.zIndex };
                  if (l.id === nextHigher.id)
                    return { ...l, zIndex: line.zIndex };
                  return l;
                }),
              };
            },
            false,
            "line/moveLineForward"
          );
        },

        moveLineBackward: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const line = state.lines.find((l) => l.id === id);
              if (!line) return state;

              const lowerLines = state.lines
                .filter((l) => l.zIndex < line.zIndex)
                .sort((a, b) => b.zIndex - a.zIndex);

              if (lowerLines.length === 0) return state;

              const nextLower = lowerLines[0];
              return {
                lines: state.lines.map((l) => {
                  if (l.id === id) return { ...l, zIndex: nextLower.zIndex };
                  if (l.id === nextLower.id)
                    return { ...l, zIndex: line.zIndex };
                  return l;
                }),
              };
            },
            false,
            "line/moveLineBackward"
          );
        },

        toggleLineLock: (id) => {
          recordSnapshot();
          set(
            (state) => ({
              lines: state.lines.map((line) =>
                line.id === id ? { ...line, locked: !line.locked } : line
              ),
            }),
            false,
            "line/toggleLineLock"
          );
        },

        resetLines: () =>
          set(
            () => ({
              ...initialState,
            }),
            false,
            "line/resetLines"
          ),
      }),
      {
        name: STORAGE_KEYS.LINE_STATE,
        partialize: (state) => ({ lines: state.lines }),
      }
    ),
    { name: "LineStore" }
  )
);

export const getMaxZIndexAcrossAll = (): number => {
  const boxStore = useBoxStore.getState();
  const lineStore = useLineStore.getState();

  const boxMaxZ =
    boxStore.boxes.length > 0
      ? Math.max(...boxStore.boxes.map((b) => b.zIndex))
      : 0;

  const lineMaxZ =
    lineStore.lines.length > 0
      ? Math.max(...lineStore.lines.map((l) => l.zIndex))
      : 0;

  return Math.max(boxMaxZ, lineMaxZ);
};
