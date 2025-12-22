import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/zIndex";
import { usePanelCoordinator } from "@/lib/store/panelCoordinatorStore";
import { useIsDesktop } from "@/lib/useMediaQuery";

/**
 * SharedBackdrop - A single backdrop component for all slide-over panels
 *
 * Shows when any panel is open on mobile/tablet (non-desktop).
 * Clicking the backdrop closes the currently active panel.
 *
 * This replaces individual backdrops in each drawer component to prevent
 * backdrop stacking and ensure consistent behavior.
 */
export const SharedBackdrop = () => {
  const isDesktop = useIsDesktop();
  const { activeMobilePanel, closePanel } = usePanelCoordinator();

  // Only show backdrop on mobile/tablet when a panel is open
  const isVisible = !isDesktop && activeMobilePanel !== null;

  if (isDesktop) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/25 backdrop-blur-[2px]",
        "transition-opacity duration-200 ease-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{ zIndex: Z_INDEX.PANEL_BACKDROP }}
      onClick={closePanel}
      aria-hidden="true"
    />
  );
};
