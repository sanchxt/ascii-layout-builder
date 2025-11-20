import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface LayersUIState {
  expandedBoxIds: Set<string>;
  isPanelCollapsed: boolean;
  searchQuery: string;

  toggleExpanded: (id: string) => void;
  expandAll: (allBoxIds: string[]) => void;
  collapseAll: () => void;
  togglePanel: () => void;
  setSearchQuery: (query: string) => void;
  isExpanded: (id: string) => boolean;
}

export const useLayersUIStore = create<LayersUIState>()(
  devtools(
    (set, get) => ({
      expandedBoxIds: new Set<string>(),
      isPanelCollapsed: false,
      searchQuery: "",

      toggleExpanded: (id) =>
        set(
          (state) => {
            const newExpandedIds = new Set(state.expandedBoxIds);
            if (newExpandedIds.has(id)) {
              newExpandedIds.delete(id);
            } else {
              newExpandedIds.add(id);
            }
            return { expandedBoxIds: newExpandedIds };
          },
          false,
          "layers/toggleExpanded"
        ),

      expandAll: (allBoxIds) =>
        set(
          () => ({
            expandedBoxIds: new Set(allBoxIds),
          }),
          false,
          "layers/expandAll"
        ),

      collapseAll: () =>
        set(
          () => ({
            expandedBoxIds: new Set<string>(),
          }),
          false,
          "layers/collapseAll"
        ),

      togglePanel: () =>
        set(
          (state) => ({
            isPanelCollapsed: !state.isPanelCollapsed,
          }),
          false,
          "layers/togglePanel"
        ),

      setSearchQuery: (query) =>
        set(
          () => ({
            searchQuery: query,
          }),
          false,
          "layers/setSearchQuery"
        ),

      isExpanded: (id) => {
        const state = get();
        return state.expandedBoxIds.has(id);
      },
    }),
    { name: "LayersUIStore" }
  )
);
