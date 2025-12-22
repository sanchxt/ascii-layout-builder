import { useMemo } from "react";
import { LayoutGrid, Columns } from "lucide-react";
import { SubPanelDrawer } from "@/components/ui/slide-over-drawer";
import { useSidebarUIStore } from "@/components/layout/store/sidebarUIStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { usePanelState } from "@/lib/store/panelCoordinatorStore";
import { useIsDesktop, useIsTablet } from "@/lib/useMediaQuery";
import { Z_INDEX } from "@/lib/zIndex";
import { LAYOUT_CONSTANTS } from "@/lib/constants";
import { LayoutControls } from "./LayoutControls";

export const LayoutPanel = () => {
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();

  // Desktop state from store
  const desktopIsOpen = useSidebarUIStore((state) => state.layoutPanelOpen);
  const boxId = useSidebarUIStore((state) => state.layoutPanelBoxId);
  const closeLayoutPanel = useSidebarUIStore((state) => state.closeLayoutPanel);
  const openLayoutPanel = useSidebarUIStore((state) => state.openLayoutPanel);

  // Unified panel state (coordinator for mobile/tablet, store for desktop)
  const { isOpen, close } = usePanelState(
    "layoutPanel",
    isDesktop,
    desktopIsOpen,
    (open) => {
      if (open && boxId) {
        openLayoutPanel(boxId);
      } else {
        closeLayoutPanel();
      }
    }
  );

  const boxes = useBoxStore((state) => state.boxes);

  const box = useMemo(() => {
    if (!boxId) return null;
    return boxes.find((b) => b.id === boxId) || null;
  }, [boxId, boxes]);

  const layoutType = box?.layout?.type;
  const title =
    layoutType === "flex"
      ? "Flex Layout"
      : layoutType === "grid"
      ? "Grid Layout"
      : "Layout Settings";

  const Icon = layoutType === "grid" ? LayoutGrid : Columns;

  // Responsive width
  const panelWidth = isTablet
    ? LAYOUT_CONSTANTS.LAYOUT_PANEL_WIDTH_TABLET
    : LAYOUT_CONSTANTS.LAYOUT_PANEL_WIDTH;

  return (
    <SubPanelDrawer
      isOpen={isOpen}
      onClose={close}
      width={panelWidth}
      zIndex={Z_INDEX.LAYOUT_PANEL}
      showGrabHandle={true}
      showBackdrop={false}
      closeOnEscape={true}
    >
      <div className="h-full flex flex-col">
        <div className="shrink-0 px-4 py-3 border-b border-border bg-gradient-to-b from-card to-background">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              {box && (
                <p className="text-[10px] text-muted-foreground font-mono">{box.id}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {box ? (
            <LayoutControls box={box} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <p className="text-sm">No box selected</p>
            </div>
          )}
        </div>
      </div>
    </SubPanelDrawer>
  );
};
