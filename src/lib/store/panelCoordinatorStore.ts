/**
 * Panel Coordinator Store
 *
 * Manages which panel is active on mobile/tablet to ensure panels
 * are mutually exclusive (only one open at a time).
 *
 * On desktop, this coordinator is not used - panels can be open independently.
 */
import { create } from "zustand";

export type PanelId =
  | "rightSidebar"
  | "outputDrawer"
  | "layoutPanel"
  | "timeline"
  | null;

interface PanelCoordinatorState {
  /** Currently active panel on mobile/tablet (null if none) */
  activeMobilePanel: PanelId;

  /** Open a specific panel, closing any currently open panel */
  openPanel: (panelId: PanelId) => void;

  /** Close the currently active panel */
  closePanel: () => void;

  /** Toggle a panel (open if closed, close if open) */
  togglePanel: (panelId: PanelId) => void;

  /** Check if a specific panel is the active one */
  isPanelActive: (panelId: PanelId) => boolean;
}

export const usePanelCoordinator = create<PanelCoordinatorState>(
  (set, get) => ({
    activeMobilePanel: null,

    openPanel: (panelId) => {
      set({ activeMobilePanel: panelId });
    },

    closePanel: () => {
      set({ activeMobilePanel: null });
    },

    togglePanel: (panelId) => {
      const current = get().activeMobilePanel;
      set({ activeMobilePanel: current === panelId ? null : panelId });
    },

    isPanelActive: (panelId) => {
      return get().activeMobilePanel === panelId;
    },
  })
);

/**
 * Hook to get panel state for a specific panel with mobile coordination
 *
 * @param panelId - The panel identifier
 * @param isDesktop - Whether we're on desktop (bypasses coordinator)
 * @param desktopIsOpen - The desktop open state (from component's own store)
 * @returns Object with isOpen state and toggle/open/close functions
 */
export function usePanelState(
  panelId: PanelId,
  isDesktop: boolean,
  desktopIsOpen: boolean,
  desktopSetOpen: (open: boolean) => void
) {
  const { activeMobilePanel, openPanel, closePanel, togglePanel } =
    usePanelCoordinator();

  // On desktop, use the component's own state
  if (isDesktop) {
    return {
      isOpen: desktopIsOpen,
      open: () => desktopSetOpen(true),
      close: () => desktopSetOpen(false),
      toggle: () => desktopSetOpen(!desktopIsOpen),
    };
  }

  // On mobile/tablet, use the coordinator
  const isOpen = activeMobilePanel === panelId;

  return {
    isOpen,
    open: () => openPanel(panelId),
    close: () => closePanel(),
    toggle: () => togglePanel(panelId),
  };
}
