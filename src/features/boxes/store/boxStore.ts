import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { BoxState, Box } from "@/types/box";
import { STORAGE_KEYS } from "@/lib/constants";

const initialState = {
  boxes: [] as Box[],
  selectedBoxIds: [] as string[],
  activeBoxId: null as string | null,
  creationMode: "idle" as const,
  resizeHandle: null,
  tempBox: null,
};

export const useBoxStore = create<BoxState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addBox: (box) =>
          set(
            (state) => ({
              boxes: [...state.boxes, box],
            }),
            false,
            "box/addBox"
          ),

        updateBox: (id, updates) =>
          set(
            (state) => ({
              boxes: state.boxes.map((box) =>
                box.id === id ? { ...box, ...updates } : box
              ),
            }),
            false,
            "box/updateBox"
          ),

        deleteBox: (id) =>
          set(
            (state) => ({
              boxes: state.boxes.filter((box) => box.id !== id),
              selectedBoxIds: state.selectedBoxIds.filter(
                (boxId) => boxId !== id
              ),
            }),
            false,
            "box/deleteBox"
          ),

        deleteBoxes: (ids) =>
          set(
            (state) => ({
              boxes: state.boxes.filter((box) => !ids.includes(box.id)),
              selectedBoxIds: state.selectedBoxIds.filter(
                (boxId) => !ids.includes(boxId)
              ),
            }),
            false,
            "box/deleteBoxes"
          ),

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

        duplicateBoxes: (ids) =>
          set(
            (state) => {
              const boxesToDuplicate = state.boxes.filter((box) =>
                ids.includes(box.id)
              );
              const duplicatedBoxes = boxesToDuplicate.map((box) => ({
                ...box,
                id: crypto.randomUUID(),
                x: box.x + 20,
                y: box.y + 20,
              }));

              return {
                boxes: [...state.boxes, ...duplicatedBoxes],
                selectedBoxIds: duplicatedBoxes.map((box) => box.id),
              };
            },
            false,
            "box/duplicateBoxes"
          ),

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
      }),
      {
        name: STORAGE_KEYS.BOX_STATE,
        partialize: (state) => ({ boxes: state.boxes }),
      }
    ),
    { name: "BoxStore" }
  )
);
