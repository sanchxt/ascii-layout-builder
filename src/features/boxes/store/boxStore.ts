import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { BoxState, Box } from "@/types/box";
import { STORAGE_KEYS, BOX_CONSTANTS } from "@/lib/constants";
import {
  getAllDescendants,
  canNestBox,
  convertToParentRelative,
  convertToCanvasAbsolute,
} from "../utils/boxHierarchy";
import { getMaxZIndex } from "../utils/boxHelpers";
import { calculateAlignedPositions } from "@/features/alignment/utils/alignmentCalculations";
import { calculateDistributedPositions } from "@/features/alignment/utils/distributionCalculations";

let recordSnapshotFn: (() => void) | null = null;
export const setRecordSnapshotFn = (fn: () => void) => {
  recordSnapshotFn = fn;
};
const recordSnapshot = () => {
  if (recordSnapshotFn) recordSnapshotFn();
};

const initialState = {
  boxes: [] as Box[],
  selectedBoxIds: [] as string[],
  activeBoxId: null as string | null,
  creationMode: "idle" as const,
  resizeHandle: null,
  tempBox: null,
  clipboardBoxIds: [] as string[],
};

export const useBoxStore = create<BoxState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addBox: (box) => {
          recordSnapshot();
          set(
            (state) => ({
              boxes: [...state.boxes, box],
            }),
            false,
            "box/addBox"
          );
        },

        updateBox: (id, updates) => {
          recordSnapshot();
          set(
            (state) => ({
              boxes: state.boxes.map((box) =>
                box.id === id ? { ...box, ...updates } : box
              ),
            }),
            false,
            "box/updateBox"
          );
        },

        deleteBox: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const descendants = getAllDescendants(id, state.boxes);
              const idsToDelete = [id, ...descendants.map((box) => box.id)];

              const boxToDelete = state.boxes.find((box) => box.id === id);
              let updatedBoxes = state.boxes.filter(
                (box) => !idsToDelete.includes(box.id)
              );

              if (boxToDelete?.parentId) {
                updatedBoxes = updatedBoxes.map((box) =>
                  box.id === boxToDelete.parentId
                    ? {
                        ...box,
                        children: box.children.filter(
                          (childId) => childId !== id
                        ),
                      }
                    : box
                );
              }

              return {
                boxes: updatedBoxes,
                selectedBoxIds: state.selectedBoxIds.filter(
                  (boxId) => !idsToDelete.includes(boxId)
                ),
              };
            },
            false,
            "box/deleteBox"
          );
        },

        deleteBoxes: (ids) => {
          recordSnapshot();
          set(
            (state) => {
              const allIdsToDelete = new Set(ids);
              ids.forEach((id) => {
                const descendants = getAllDescendants(id, state.boxes);
                descendants.forEach((desc) => allIdsToDelete.add(desc.id));
              });

              const idsToDeleteArray = Array.from(allIdsToDelete);

              let updatedBoxes = state.boxes.filter(
                (box) => !allIdsToDelete.has(box.id)
              );

              const deletedBoxesWithParents = state.boxes.filter(
                (box) => idsToDeleteArray.includes(box.id) && box.parentId
              );

              deletedBoxesWithParents.forEach((deletedBox) => {
                updatedBoxes = updatedBoxes.map((box) =>
                  box.id === deletedBox.parentId
                    ? {
                        ...box,
                        children: box.children.filter(
                          (childId) => !allIdsToDelete.has(childId)
                        ),
                      }
                    : box
                );
              });

              return {
                boxes: updatedBoxes,
                selectedBoxIds: state.selectedBoxIds.filter(
                  (boxId) => !allIdsToDelete.has(boxId)
                ),
              };
            },
            false,
            "box/deleteBoxes"
          );
        },

        selectBox: (id, multi = false) =>
          set(
            (state) => {
              if (multi) {
                const isSelected = state.selectedBoxIds.includes(id);
                return {
                  selectedBoxIds: isSelected
                    ? state.selectedBoxIds.filter((boxId) => boxId !== id)
                    : [...state.selectedBoxIds, id],
                };
              } else {
                return {
                  selectedBoxIds: [id],
                };
              }
            },
            false,
            "box/selectBox"
          ),

        clearSelection: () =>
          set(
            () => ({
              selectedBoxIds: [],
              activeBoxId: null,
            }),
            false,
            "box/clearSelection"
          ),

        selectAll: () =>
          set(
            (state) => {
              const rootBoxes = state.boxes.filter((box) => !box.parentId);
              return {
                selectedBoxIds: rootBoxes.map((box) => box.id),
              };
            },
            false,
            "box/selectAll"
          ),

        setCreationMode: (creationMode) =>
          set(
            () => ({
              creationMode,
            }),
            false,
            "box/setCreationMode"
          ),

        setResizeHandle: (resizeHandle) =>
          set(
            () => ({
              resizeHandle,
            }),
            false,
            "box/setResizeHandle"
          ),

        setTempBox: (tempBox) =>
          set(
            () => ({
              tempBox,
            }),
            false,
            "box/setTempBox"
          ),

        duplicateBoxes: (ids) => {
          recordSnapshot();
          set(
            (state) => {
              const idMap = new Map<string, string>();
              const allBoxesToDuplicate: Box[] = [];

              const collectBoxesWithDescendants = (boxId: string) => {
                const box = state.boxes.find((b) => b.id === boxId);
                if (!box || allBoxesToDuplicate.some((b) => b.id === boxId))
                  return;

                allBoxesToDuplicate.push(box);
                const descendants = getAllDescendants(boxId, state.boxes);
                descendants.forEach((desc) => {
                  if (!allBoxesToDuplicate.some((b) => b.id === desc.id)) {
                    allBoxesToDuplicate.push(desc);
                  }
                });
              };

              ids.forEach((id) => collectBoxesWithDescendants(id));

              allBoxesToDuplicate.forEach((box) => {
                idMap.set(box.id, crypto.randomUUID());
              });

              const duplicatedBoxes = allBoxesToDuplicate.map((box) => {
                const newId = idMap.get(box.id)!;
                const newParentId = box.parentId
                  ? idMap.get(box.parentId)
                  : undefined;
                const newChildren = box.children
                  .map((childId) => idMap.get(childId))
                  .filter((id): id is string => id !== undefined);

                const shouldOffset =
                  !box.parentId || !ids.includes(box.parentId);

                return {
                  ...box,
                  id: newId,
                  parentId: newParentId,
                  children: newChildren,
                  x: shouldOffset ? box.x + 20 : box.x,
                  y: shouldOffset ? box.y + 20 : box.y,
                };
              });

              const topLevelDuplicatedIds = ids
                .map((id) => idMap.get(id))
                .filter((id): id is string => id !== undefined);

              return {
                boxes: [...state.boxes, ...duplicatedBoxes],
                selectedBoxIds: topLevelDuplicatedIds,
              };
            },
            false,
            "box/duplicateBoxes"
          );
        },

        copyBoxes: () =>
          set(
            (state) => ({
              clipboardBoxIds: [...state.selectedBoxIds],
            }),
            false,
            "box/copyBoxes"
          ),

        pasteBoxes: () => {
          recordSnapshot();
          set(
            (state) => {
              if (state.clipboardBoxIds.length === 0) {
                return state;
              }

              const idMap = new Map<string, string>();
              const allBoxesToDuplicate: Box[] = [];

              const collectBoxesWithDescendants = (boxId: string) => {
                const box = state.boxes.find((b) => b.id === boxId);
                if (!box || allBoxesToDuplicate.some((b) => b.id === boxId))
                  return;

                allBoxesToDuplicate.push(box);
                const descendants = getAllDescendants(boxId, state.boxes);
                descendants.forEach((desc) => {
                  if (!allBoxesToDuplicate.some((b) => b.id === desc.id)) {
                    allBoxesToDuplicate.push(desc);
                  }
                });
              };

              state.clipboardBoxIds.forEach((id) =>
                collectBoxesWithDescendants(id)
              );

              allBoxesToDuplicate.forEach((box) => {
                idMap.set(box.id, crypto.randomUUID());
              });

              const pastedBoxes = allBoxesToDuplicate.map((box) => {
                const newId = idMap.get(box.id)!;
                const newParentId = box.parentId
                  ? idMap.get(box.parentId)
                  : undefined;
                const newChildren = box.children
                  .map((childId) => idMap.get(childId))
                  .filter((id): id is string => id !== undefined);

                const shouldOffset =
                  !box.parentId ||
                  !state.clipboardBoxIds.includes(box.parentId);

                return {
                  ...box,
                  id: newId,
                  parentId: newParentId,
                  children: newChildren,
                  x: shouldOffset ? box.x + 20 : box.x,
                  y: shouldOffset ? box.y + 20 : box.y,
                };
              });

              const topLevelPastedIds = state.clipboardBoxIds
                .map((id) => idMap.get(id))
                .filter((id): id is string => id !== undefined);

              return {
                boxes: [...state.boxes, ...pastedBoxes],
                selectedBoxIds: topLevelPastedIds,
              };
            },
            false,
            "box/pasteBoxes"
          );
        },

        getBox: (id) => {
          const state = get();
          return state.boxes.find((box) => box.id === id);
        },

        getSelectedBoxes: () => {
          const state = get();
          return state.boxes.filter((box) =>
            state.selectedBoxIds.includes(box.id)
          );
        },

        resetBoxes: () =>
          set(
            () => ({
              ...initialState,
            }),
            false,
            "box/resetBoxes"
          ),

        setParent: (childId, parentId) => {
          recordSnapshot();
          set(
            (state) => {
              const validation = canNestBox(childId, parentId, state.boxes);
              if (!validation.canNest) {
                console.warn(`Cannot nest box: ${validation.reason}`);
                return state;
              }

              const childBox = state.boxes.find((b) => b.id === childId);
              const parentBox = state.boxes.find((b) => b.id === parentId);

              if (!childBox || !parentBox) return state;

              const relativePos = convertToParentRelative(
                childBox.x,
                childBox.y,
                parentBox
              );

              const updatedBoxes = state.boxes.map((box) => {
                if (box.id === childId) {
                  return {
                    ...box,
                    parentId,
                    x: relativePos.x,
                    y: relativePos.y,
                  };
                } else if (box.id === parentId) {
                  return {
                    ...box,
                    children: [...box.children, childId],
                  };
                } else if (box.id === childBox.parentId) {
                  return {
                    ...box,
                    children: box.children.filter((id) => id !== childId),
                  };
                }
                return box;
              });

              return { boxes: updatedBoxes };
            },
            false,
            "box/setParent"
          );
        },

        detachFromParent: (childId) => {
          recordSnapshot();
          set(
            (state) => {
              const childBox = state.boxes.find((b) => b.id === childId);
              if (!childBox || !childBox.parentId) return state;

              const parentBox = state.boxes.find(
                (b) => b.id === childBox.parentId
              );
              if (!parentBox) return state;

              const absolutePos = convertToCanvasAbsolute(
                childBox.x,
                childBox.y,
                parentBox
              );

              const updatedBoxes = state.boxes.map((box) => {
                if (box.id === childId) {
                  return {
                    ...box,
                    parentId: undefined,
                    x: absolutePos.x,
                    y: absolutePos.y,
                  };
                } else if (box.id === childBox.parentId) {
                  return {
                    ...box,
                    children: box.children.filter((id) => id !== childId),
                  };
                }
                return box;
              });

              return { boxes: updatedBoxes };
            },
            false,
            "box/detachFromParent"
          );
        },

        groupBoxes: (boxIds) => {
          recordSnapshot();
          set(
            (state) => {
              if (boxIds.length === 0) return state;

              const boxesToGroup = state.boxes.filter((box) =>
                boxIds.includes(box.id)
              );
              if (boxesToGroup.length === 0) return state;

              const minX = Math.min(...boxesToGroup.map((b) => b.x));
              const minY = Math.min(...boxesToGroup.map((b) => b.y));
              const maxX = Math.max(...boxesToGroup.map((b) => b.x + b.width));
              const maxY = Math.max(...boxesToGroup.map((b) => b.y + b.height));

              const padding = BOX_CONSTANTS.GROUP_PADDING;

              const parentId = crypto.randomUUID();
              const parentBox: Box = {
                id: parentId,
                x: minX - padding,
                y: minY - padding,
                width: maxX - minX + padding * 2,
                height: maxY - minY + padding * 2,
                borderStyle: "single",
                padding: BOX_CONSTANTS.DEFAULT_PADDING,
                text: {
                  value: "",
                  alignment: "left",
                  fontSize: "medium",
                  formatting: [],
                },
                children: [...boxIds],
                parentId: undefined,
                zIndex: getMaxZIndex(state.boxes) + 1,
              };

              const oldParentIds = new Set(
                boxesToGroup
                  .map((box) => box.parentId)
                  .filter((id): id is string => id !== undefined)
              );

              let updatedBoxes = state.boxes.map((box) => {
                if (boxIds.includes(box.id)) {
                  const relativePos = convertToParentRelative(
                    box.x,
                    box.y,
                    parentBox
                  );
                  return {
                    ...box,
                    parentId,
                    x: relativePos.x,
                    y: relativePos.y,
                  };
                }
                return box;
              });

              updatedBoxes = updatedBoxes.map((box) => {
                if (oldParentIds.has(box.id)) {
                  return {
                    ...box,
                    children: box.children.filter(
                      (childId) => !boxIds.includes(childId)
                    ),
                  };
                }
                return box;
              });

              return {
                boxes: [...updatedBoxes, parentBox],
                selectedBoxIds: [parentId],
              };
            },
            false,
            "box/groupBoxes"
          );
        },

        ungroupBox: (parentId) => {
          recordSnapshot();
          set(
            (state) => {
              const parentBox = state.boxes.find((b) => b.id === parentId);
              if (!parentBox || parentBox.children.length === 0) return state;

              const childIds = [...parentBox.children];

              const updatedBoxes = state.boxes
                .filter((box) => box.id !== parentId)
                .map((box) => {
                  if (childIds.includes(box.id)) {
                    const absolutePos = convertToCanvasAbsolute(
                      box.x,
                      box.y,
                      parentBox
                    );
                    return {
                      ...box,
                      parentId: undefined,
                      x: absolutePos.x,
                      y: absolutePos.y,
                    };
                  }
                  return box;
                });

              return {
                boxes: updatedBoxes,
                selectedBoxIds: childIds,
              };
            },
            false,
            "box/ungroupBox"
          );
        },

        alignBoxes: (boxIds, alignment) => {
          recordSnapshot();
          set(
            (state) => {
              const updates = calculateAlignedPositions(
                boxIds,
                alignment,
                state.boxes
              );

              if (updates.length === 0) return state;

              const updatedBoxes = state.boxes.map((box) => {
                const update = updates.find((u) => u.id === box.id);
                if (update) {
                  return {
                    ...box,
                    x: update.x,
                    y: update.y,
                  };
                }
                return box;
              });

              return { boxes: updatedBoxes };
            },
            false,
            "box/alignBoxes"
          );
        },

        distributeBoxes: (boxIds, distribution) => {
          recordSnapshot();
          set(
            (state) => {
              const updates = calculateDistributedPositions(
                boxIds,
                distribution,
                state.boxes
              );

              if (updates.length === 0) {
                return state;
              }

              const updatedBoxes = state.boxes.map((box) => {
                const update = updates.find((u) => u.id === box.id);
                if (update) {
                  return { ...box, x: update.x, y: update.y };
                }
                return box;
              });

              return { boxes: updatedBoxes };
            },
            false,
            "box/distributeBoxes"
          );
        },

        updateBoxPosition: (id, x, y) => {
          recordSnapshot();
          set(
            (state) => {
              const box = state.boxes.find((b) => b.id === id);
              if (!box) return state;

              if (box.parentId) {
                const parent = state.boxes.find((b) => b.id === box.parentId);
                if (parent) {
                  const tempBox = { ...box, x, y };
                  const isInside =
                    tempBox.x >= 0 &&
                    tempBox.y >= 0 &&
                    tempBox.x + tempBox.width <= parent.width &&
                    tempBox.y + tempBox.height <= parent.height;

                  if (!isInside) {
                    const absolutePos = convertToCanvasAbsolute(x, y, parent);

                    const updatedBoxes = state.boxes.map((b) => {
                      if (b.id === id) {
                        return {
                          ...b,
                          parentId: undefined,
                          x: absolutePos.x,
                          y: absolutePos.y,
                        };
                      } else if (b.id === box.parentId) {
                        return {
                          ...b,
                          children: b.children.filter(
                            (childId) => childId !== id
                          ),
                        };
                      }
                      return b;
                    });

                    return { boxes: updatedBoxes };
                  }
                }
              }

              const updatedBoxes = state.boxes.map((b) =>
                b.id === id ? { ...b, x, y } : b
              );

              return { boxes: updatedBoxes };
            },
            false,
            "box/updateBoxPosition"
          );
        },

        toggleBoxVisibility: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const box = state.boxes.find((b) => b.id === id);
              if (!box) return state;

              const newVisibility = box.visible === false ? true : false;

              const descendants = getAllDescendants(id, state.boxes);
              const affectedIds = [id, ...descendants.map((d) => d.id)];

              const updatedBoxes = state.boxes.map((b) =>
                affectedIds.includes(b.id)
                  ? { ...b, visible: newVisibility }
                  : b
              );

              return { boxes: updatedBoxes };
            },
            false,
            "box/toggleBoxVisibility"
          );
        },

        toggleBoxLock: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const box = state.boxes.find((b) => b.id === id);
              if (!box) return state;

              const updatedBoxes = state.boxes.map((b) =>
                b.id === id ? { ...b, locked: !b.locked } : b
              );

              return { boxes: updatedBoxes };
            },
            false,
            "box/toggleBoxLock"
          );
        },

        updateBoxName: (id, name) => {
          recordSnapshot();
          set(
            (state) => {
              const updatedBoxes = state.boxes.map((b) =>
                b.id === id ? { ...b, name } : b
              );

              return { boxes: updatedBoxes };
            },
            false,
            "box/updateBoxName"
          );
        },

        reorderBox: (id, newZIndex) => {
          recordSnapshot();
          set(
            (state) => {
              const updatedBoxes = state.boxes.map((b) =>
                b.id === id ? { ...b, zIndex: newZIndex } : b
              );

              return { boxes: updatedBoxes };
            },
            false,
            "box/reorderBox"
          );
        },

        moveBoxToFront: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const box = state.boxes.find((b) => b.id === id);
              if (!box) return state;

              const siblings = state.boxes.filter(
                (b) => b.parentId === box.parentId
              );
              const maxZ = Math.max(...siblings.map((b) => b.zIndex));

              const updatedBoxes = state.boxes.map((b) =>
                b.id === id ? { ...b, zIndex: maxZ + 1 } : b
              );

              return { boxes: updatedBoxes };
            },
            false,
            "box/moveBoxToFront"
          );
        },

        moveBoxToBack: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const box = state.boxes.find((b) => b.id === id);
              if (!box) return state;

              const siblings = state.boxes.filter(
                (b) => b.parentId === box.parentId
              );
              const minZ = Math.min(...siblings.map((b) => b.zIndex));

              const updatedBoxes = state.boxes.map((b) =>
                b.id === id ? { ...b, zIndex: minZ - 1 } : b
              );

              return { boxes: updatedBoxes };
            },
            false,
            "box/moveBoxToBack"
          );
        },

        moveBoxForward: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const box = state.boxes.find((b) => b.id === id);
              if (!box) return state;

              const siblings = state.boxes
                .filter((b) => b.parentId === box.parentId)
                .sort((a, b) => a.zIndex - b.zIndex);

              const currentIndex = siblings.findIndex((b) => b.id === id);
              if (currentIndex === siblings.length - 1) return state;

              const nextBox = siblings[currentIndex + 1];
              const newZIndex = nextBox.zIndex + 1;

              const updatedBoxes = state.boxes.map((b) =>
                b.id === id ? { ...b, zIndex: newZIndex } : b
              );

              return { boxes: updatedBoxes };
            },
            false,
            "box/moveBoxForward"
          );
        },

        moveBoxBackward: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const box = state.boxes.find((b) => b.id === id);
              if (!box) return state;

              const siblings = state.boxes
                .filter((b) => b.parentId === box.parentId)
                .sort((a, b) => a.zIndex - b.zIndex);

              const currentIndex = siblings.findIndex((b) => b.id === id);
              if (currentIndex === 0) return state;

              const prevBox = siblings[currentIndex - 1];
              const newZIndex = prevBox.zIndex - 1;

              const updatedBoxes = state.boxes.map((b) =>
                b.id === id ? { ...b, zIndex: newZIndex } : b
              );

              return { boxes: updatedBoxes };
            },
            false,
            "box/moveBoxBackward"
          );
        },
      }),
      {
        name: STORAGE_KEYS.BOX_STATE,
        partialize: (state) => ({ boxes: state.boxes }),
      }
    ),
    { name: "BoxStore" }
  )
);
