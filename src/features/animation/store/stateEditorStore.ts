import { create } from "zustand";

/**
 * Store for managing the State Editor Drawer UI state.
 * This is a simple UI-only store that tracks whether the drawer is open
 * and which state is being edited.
 */
export interface StateEditorStore {
  /** Whether the state editor drawer is open */
  isOpen: boolean;
  /** ID of the state being edited (null if drawer is closed) */
  editingStateId: string | null;

  /** Open the editor drawer for a specific state */
  openEditor: (stateId: string) => void;
  /** Close the editor drawer */
  closeEditor: () => void;
  /** Toggle the editor drawer for a specific state */
  toggleEditor: (stateId: string) => void;
}

export const useStateEditorStore = create<StateEditorStore>()((set, get) => ({
  isOpen: false,
  editingStateId: null,

  openEditor: (stateId) =>
    set({
      isOpen: true,
      editingStateId: stateId,
    }),

  closeEditor: () =>
    set({
      isOpen: false,
      editingStateId: null,
    }),

  toggleEditor: (stateId) => {
    const { isOpen, editingStateId } = get();
    if (isOpen && editingStateId === stateId) {
      set({ isOpen: false, editingStateId: null });
    } else {
      set({ isOpen: true, editingStateId: stateId });
    }
  },
}));
