import { useEffect } from "react";
import { Settings, Sliders, X, Code2 } from "lucide-react";
import { ResizablePanel, PanelAction } from "@/components/ui/resizable-panel";
import { Navigator } from "./Navigator";
import { PropertiesContent } from "@/features/boxes/components/PropertiesContent";
import { LinePropertiesContent } from "@/features/lines/components/LinePropertiesContent";
import { TransitionEditorPanel } from "@/features/animation/components";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import { useAnimationStore } from "@/features/animation/store/animationStore";
import { useOutputDrawerStore } from "@/features/output-drawer/store/outputDrawerStore";
import { useSidebarUIStore } from "./store/sidebarUIStore";
import { usePanelState } from "@/lib/store/panelCoordinatorStore";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsDesktop } from "@/lib/useMediaQuery";
import { Z_INDEX } from "@/lib/zIndex";
import { LAYOUT_CONSTANTS } from "@/lib/constants";

export const RightSidebar = () => {
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const selectedLineIds = useLineStore((state) => state.selectedLineIds);
  const hasBoxSelection = selectedBoxIds.length > 0;
  const hasLineSelection = selectedLineIds.length > 0;
  const hasSelection = hasBoxSelection || hasLineSelection;
  const selectionCount = selectedBoxIds.length + selectedLineIds.length;

  const editorMode = useAnimationStore((state) => state.editorMode);
  const isAnimationMode = editorMode === "animation";

  // Desktop state from store
  const desktopIsOpen = useSidebarUIStore((state) => state.rightSidebarOpen);
  const setDesktopOpen = useSidebarUIStore((state) => state.setRightSidebarOpen);

  // Responsive breakpoints
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  // Unified panel state (coordinator for mobile/tablet, store for desktop)
  const { isOpen, close } = usePanelState(
    "rightSidebar",
    isDesktop,
    desktopIsOpen,
    setDesktopOpen
  );

  // Output drawer state
  const desktopOutputOpen = useOutputDrawerStore((state) => state.isOpen);
  const desktopOutputOpen_ = useOutputDrawerStore((state) => state.open);
  const desktopOutputClose = useOutputDrawerStore((state) => state.close);

  const { isOpen: isOutputOpen, toggle: toggleOutput } = usePanelState(
    "outputDrawer",
    isDesktop,
    desktopOutputOpen,
    (open) => open ? desktopOutputOpen_() : desktopOutputClose()
  );

  // Auto-open sidebar on desktop
  useEffect(() => {
    if (isDesktop) {
      setDesktopOpen(true);
    }
  }, [isDesktop, setDesktopOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

  const handleClose = () => {
    if (!isDesktop) {
      close();
    }
  };

  // Desktop: Always visible fixed panel
  if (isDesktop) {
    return (
      <aside
        className="flex flex-col border-l border-border bg-gradient-to-b from-sidebar to-sidebar/80 overflow-hidden"
        style={{ width: LAYOUT_CONSTANTS.RIGHT_SIDEBAR_WIDTH }}
      >
        <SidebarHeader
          showCloseButton={false}
          isOutputOpen={isOutputOpen}
          onToggleOutput={toggleOutput}
        />
        <SidebarContent
          hasSelection={hasSelection}
          hasLineSelection={hasLineSelection}
          selectionCount={selectionCount}
          isAnimationMode={isAnimationMode}
        />
      </aside>
    );
  }

  // Mobile & Tablet: Slide-over panel (backdrop handled by SharedBackdrop)
  return (
    <aside
      className={cn(
        "fixed top-12 right-0 flex flex-col",
        "bg-gradient-to-b from-sidebar to-sidebar/95 border-l border-border",
        "shadow-[-4px_0_20px_-8px_rgba(0,0,0,0.2)]",
        "transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        // Height: Full minus toolbar
        "h-[calc(100vh-48px)]"
      )}
      style={{
        zIndex: Z_INDEX.RIGHT_SIDEBAR_MOBILE,
        width: isMobile
          ? "calc(100vw - 48px)"
          : LAYOUT_CONSTANTS.RIGHT_SIDEBAR_WIDTH_TABLET,
      }}
      role="complementary"
      aria-label="Design sidebar"
    >
      {/* Grab handle for slide-over discovery */}
      <div className="flex justify-center py-2 shrink-0">
        <div className="w-8 h-1 rounded-full bg-muted-foreground/20" />
      </div>

      <SidebarHeader
        showCloseButton={true}
        onClose={handleClose}
        isOutputOpen={isOutputOpen}
        onToggleOutput={toggleOutput}
      />
      <SidebarContent
        hasSelection={hasSelection}
        hasLineSelection={hasLineSelection}
        selectionCount={selectionCount}
        isAnimationMode={isAnimationMode}
      />
    </aside>
  );
};

// Extracted header component
interface SidebarHeaderProps {
  showCloseButton: boolean;
  onClose?: () => void;
  isOutputOpen?: boolean;
  onToggleOutput?: () => void;
}

const SidebarHeader = ({
  showCloseButton,
  onClose,
  isOutputOpen,
  onToggleOutput,
}: SidebarHeaderProps) => (
  <div className="shrink-0 h-10 px-3 flex items-center justify-between border-b border-sidebar-border bg-card/60">
    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
      Design
    </span>
    <div className="flex items-center gap-1">
      {onToggleOutput && (
        <button
          onClick={onToggleOutput}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            isOutputOpen
              ? "text-primary bg-accent hover:bg-accent/80"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          title={isOutputOpen ? "Hide Output (Cmd+/)" : "Show Output (Cmd+/)"}
        >
          <Code2 className="w-4 h-4" />
        </button>
      )}
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

// Extracted content component
interface SidebarContentProps {
  hasSelection: boolean;
  hasLineSelection: boolean;
  selectionCount: number;
  isAnimationMode: boolean;
}

const SidebarContent = ({
  hasSelection,
  hasLineSelection,
  selectionCount,
  isAnimationMode,
}: SidebarContentProps) => (
  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
    <Navigator />

    <ResizablePanel
      id="properties"
      title="Properties"
      icon={Sliders}
      collapsible={true}
      showDivider={false}
      badge={hasSelection ? selectionCount : undefined}
      headerActions={
        hasSelection ? (
          <PanelAction
            icon={Settings}
            onClick={() => {}}
            title="More options"
          />
        ) : null
      }
    >
      {hasLineSelection ? <LinePropertiesContent /> : <PropertiesContent />}
    </ResizablePanel>

    {isAnimationMode && <TransitionEditorPanel />}
  </div>
);
