import { create } from "zustand";
import { persist } from "zustand/middleware";

type OutputTab = "ascii" | "code";

interface OutputDrawerState {
  isOpen: boolean;
  activeTab: OutputTab;

  open: () => void;
  close: () => void;
  toggle: () => void;
  setActiveTab: (tab: OutputTab) => void;
}

export const useOutputDrawerStore = create<OutputDrawerState>()(
  persist(
    (set) => ({
      isOpen: false,
      activeTab: "ascii",

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "output-drawer-storage",
      partialize: (state) => ({
        activeTab: state.activeTab,
      }),
    }
  )
);
