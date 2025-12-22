import { Code2, Braces, Play } from "lucide-react";
import { SlideOverDrawer } from "@/components/ui/slide-over-drawer";
import { useOutputDrawerStore, type OutputTab } from "../store/outputDrawerStore";
import { AsciiPreviewContent } from "@/features/ascii-output/components/AsciiPreviewContent";
import { CodePreview } from "@/features/code-output/components/CodePreview";
import { AnimationOutputPanel } from "@/features/animation/output/components/AnimationOutputPanel";
import { usePanelState } from "@/lib/store/panelCoordinatorStore";
import { useIsDesktop, useIsMobile, useIsTablet } from "@/lib/useMediaQuery";
import { Z_INDEX } from "@/lib/zIndex";
import { LAYOUT_CONSTANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TABS: { id: OutputTab; label: string; icon: React.ReactNode }[] = [
  { id: "ascii", label: "ASCII", icon: <Code2 className="w-4 h-4" /> },
  { id: "code", label: "Code", icon: <Braces className="w-4 h-4" /> },
  { id: "animation", label: "Animation", icon: <Play className="w-4 h-4" /> },
];

export const OutputDrawer = () => {
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();

  // Desktop state from store (persisted)
  const desktopIsOpen = useOutputDrawerStore((state) => state.isOpen);
  const desktopClose = useOutputDrawerStore((state) => state.close);
  const desktopOpen = useOutputDrawerStore((state) => state.open);

  // Unified panel state (coordinator for mobile/tablet, store for desktop)
  const { isOpen, close } = usePanelState(
    "outputDrawer",
    isDesktop,
    desktopIsOpen,
    (open) => open ? desktopOpen() : desktopClose()
  );

  // Tab state (always from store - content state, not open/close state)
  const activeTab = useOutputDrawerStore((state) => state.activeTab);
  const setActiveTab = useOutputDrawerStore((state) => state.setActiveTab);

  // Responsive width
  const drawerWidth = isTablet
    ? LAYOUT_CONSTANTS.OUTPUT_DRAWER_WIDTH_TABLET
    : LAYOUT_CONSTANTS.OUTPUT_DRAWER_WIDTH;

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={close}
      width={drawerWidth}
      zIndex={Z_INDEX.OUTPUT_DRAWER}
      showGrabHandle={!isMobile}
      showBackdrop={false}
      closeOnEscape={true}
      fullScreenOnMobile={true}
      title="Output"
    >
      <div className="h-full flex flex-col">
        <div className="shrink-0 border-b border-border bg-card">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3",
                  "text-sm font-medium transition-all duration-200",
                  "border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "text-foreground border-foreground bg-background"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === "ascii" && <AsciiPreviewContent />}
          {activeTab === "code" && <CodePreview />}
          {activeTab === "animation" && <AnimationOutputPanel />}
        </div>
      </div>
    </SlideOverDrawer>
  );
};
