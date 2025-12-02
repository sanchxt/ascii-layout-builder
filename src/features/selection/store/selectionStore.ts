import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  SelectionState,
  SelectionItem,
  SelectableItemType,
} from "@/types/selection";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";

const initialState = {
  selectedIds: [] as SelectionItem[],
  activeItemId: null as string | null,
  activeItemType: null as SelectableItemType | null,
};

export const useSelectionStore = create<SelectionState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      select: (id, type, multi = false) => {
        set(
          (state) => {
            if (multi) {
              const existingIndex = state.selectedIds.findIndex(
                (item) => item.id === id && item.type === type
              );

              if (existingIndex >= 0) {
                const newSelectedIds = state.selectedIds.filter(
                  (_, index) => index !== existingIndex
                );
                return {
                  selectedIds: newSelectedIds,
                  activeItemId:
                    state.activeItemId === id ? null : state.activeItemId,
                  activeItemType:
                    state.activeItemId === id ? null : state.activeItemType,
                };
              } else {
                return {
                  selectedIds: [...state.selectedIds, { id, type }],
                  activeItemId: id,
                  activeItemType: type,
                };
              }
            } else {
              return {
                selectedIds: [{ id, type }],
                activeItemId: id,
                activeItemType: type,
              };
            }
          },
          false,
          "selection/select"
        );
      },

      deselect: (id, type) => {
        set(
          (state) => {
            const newSelectedIds = state.selectedIds.filter(
              (item) => !(item.id === id && item.type === type)
            );
            return {
              selectedIds: newSelectedIds,
              activeItemId:
                state.activeItemId === id ? null : state.activeItemId,
              activeItemType:
                state.activeItemId === id ? null : state.activeItemType,
            };
          },
          false,
          "selection/deselect"
        );
      },

      clearSelection: () => {
        set(
          () => ({
            selectedIds: [],
            activeItemId: null,
            activeItemType: null,
          }),
          false,
          "selection/clearSelection"
        );
      },

      selectAll: () => {
        const boxStore = useBoxStore.getState();
        const lineStore = useLineStore.getState();

        const rootBoxes = boxStore.boxes.filter(
          (box) => !box.parentId && box.visible !== false && !box.locked
        );

        const rootLines = lineStore.lines.filter(
          (line) => !line.parentId && line.visible !== false && !line.locked
        );

        const allItems: SelectionItem[] = [
          ...rootBoxes.map((box) => ({ id: box.id, type: "box" as const })),
          ...rootLines.map((line) => ({ id: line.id, type: "line" as const })),
        ];

        set(
          () => ({
            selectedIds: allItems,
            activeItemId: allItems.length > 0 ? allItems[0].id : null,
            activeItemType: allItems.length > 0 ? allItems[0].type : null,
          }),
          false,
          "selection/selectAll"
        );
      },

      setActive: (id, type) => {
        set(
          () => ({
            activeItemId: id,
            activeItemType: type,
          }),
          false,
          "selection/setActive"
        );
      },

      clearActive: () => {
        set(
          () => ({
            activeItemId: null,
            activeItemType: null,
          }),
          false,
          "selection/clearActive"
        );
      },

      selectMultiple: (items, addToSelection = false) => {
        set(
          (state) => {
            if (addToSelection) {
              const existingIds = new Set(
                state.selectedIds.map((item) => `${item.type}:${item.id}`)
              );
              const newItems = items.filter(
                (item) => !existingIds.has(`${item.type}:${item.id}`)
              );
              const allItems = [...state.selectedIds, ...newItems];
              return {
                selectedIds: allItems,
                activeItemId:
                  newItems.length > 0 ? newItems[0].id : state.activeItemId,
                activeItemType:
                  newItems.length > 0 ? newItems[0].type : state.activeItemType,
              };
            } else {
              return {
                selectedIds: items,
                activeItemId: items.length > 0 ? items[0].id : null,
                activeItemType: items.length > 0 ? items[0].type : null,
              };
            }
          },
          false,
          "selection/selectMultiple"
        );
      },

      getSelectedBoxIds: () => {
        const state = get();
        return state.selectedIds
          .filter((item) => item.type === "box")
          .map((item) => item.id);
      },

      getSelectedLineIds: () => {
        const state = get();
        return state.selectedIds
          .filter((item) => item.type === "line")
          .map((item) => item.id);
      },

      isSelected: (id) => {
        const state = get();
        return state.selectedIds.some((item) => item.id === id);
      },

      getSelectionCount: () => {
        const state = get();
        return state.selectedIds.length;
      },

      hasSelection: () => {
        const state = get();
        return state.selectedIds.length > 0;
      },

      getActiveItem: () => {
        const state = get();
        if (!state.activeItemId || !state.activeItemType) return null;
        return {
          id: state.activeItemId,
          type: state.activeItemType,
        };
      },
    }),
    { name: "SelectionStore" }
  )
);

export const useSelectedBoxIds = () =>
  useSelectionStore((state) => state.getSelectedBoxIds());

export const useSelectedLineIds = () =>
  useSelectionStore((state) => state.getSelectedLineIds());

export const useIsSelected = (id: string) =>
  useSelectionStore((state) => state.isSelected(id));

export const useHasSelection = () =>
  useSelectionStore((state) => state.hasSelection());
