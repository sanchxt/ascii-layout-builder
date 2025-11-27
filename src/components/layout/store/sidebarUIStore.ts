import { create } from "zustand";
import { persist } from "zustand/middleware";

type NavigatorTab = "artboards" | "layers";

interface PanelConfig {
  height: number;
  minHeight: number;
  maxHeight: number;
}

interface SidebarUIState {
  // Panel heights (percentage-based for flexibility)
  panelHeights: Record<string, number>;

  // Collapsed state
  collapsedPanels: Set<string>;

  // Navigator tab
  activeNavigatorTab: NavigatorTab;

  // Actions
  setPanelHeight: (id: string, height: number) => void;
  togglePanel: (id: string) => void;
  setCollapsed: (id: string, collapsed: boolean) => void;
  setNavigatorTab: (tab: NavigatorTab) => void;
  isPanelCollapsed: (id: string) => boolean;
}

// Default panel heights (in pixels)
const DEFAULT_HEIGHTS: Record<string, number> = {
  preview: 280,
  navigator: 300,
  properties: 320,
};

// Panel constraints
export const PANEL_CONSTRAINTS: Record<string, PanelConfig> = {
  preview: { height: 280, minHeight: 120, maxHeight: 500 },
  navigator: { height: 300, minHeight: 150, maxHeight: 600 },
  properties: { height: 320, minHeight: 200, maxHeight: 500 },
};

export const useSidebarUIStore = create<SidebarUIState>()(
  persist(
    (set, get) => ({
      panelHeights: DEFAULT_HEIGHTS,
      collapsedPanels: new Set<string>(),
      activeNavigatorTab: "layers",

      setPanelHeight: (id, height) => {
        const constraints = PANEL_CONSTRAINTS[id];
        if (!constraints) return;

        const clampedHeight = Math.max(
          constraints.minHeight,
          Math.min(constraints.maxHeight, height)
        );

        set((state) => ({
          panelHeights: {
            ...state.panelHeights,
            [id]: clampedHeight,
          },
        }));
      },

      togglePanel: (id) => {
        set((state) => {
          const newCollapsed = new Set(state.collapsedPanels);
          if (newCollapsed.has(id)) {
            newCollapsed.delete(id);
          } else {
            newCollapsed.add(id);
          }
          return { collapsedPanels: newCollapsed };
        });
      },

      setCollapsed: (id, collapsed) => {
        set((state) => {
          const newCollapsed = new Set(state.collapsedPanels);
          if (collapsed) {
            newCollapsed.add(id);
          } else {
            newCollapsed.delete(id);
          }
          return { collapsedPanels: newCollapsed };
        });
      },

      setNavigatorTab: (tab) => {
        set({ activeNavigatorTab: tab });
      },

      isPanelCollapsed: (id) => {
        return get().collapsedPanels.has(id);
      },
    }),
    {
      name: "sidebar-ui-storage",
      partialize: (state) => ({
        panelHeights: state.panelHeights,
        collapsedPanels: Array.from(state.collapsedPanels),
        activeNavigatorTab: state.activeNavigatorTab,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        collapsedPanels: new Set(persisted?.collapsedPanels || []),
      }),
    }
  )
);
