import { useEffect } from "react";
import { Toolbar } from "./Toolbar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { SharedBackdrop } from "@/components/ui/shared-backdrop";
import { ThemeEditorModal } from "@/features/theme/components/ThemeEditorModal";
import {
  Timeline,
  TimelineMiniBar,
  TimelineBottomSheet,
  StateEditorDrawer,
} from "@/features/animation/components";
import { useAnimationStore } from "@/features/animation/store/animationStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { useCommandStore } from "@/features/commands/store/commandStore";
import { useSidebarUIStore } from "./store/sidebarUIStore";
import { useIsMobile } from "@/lib/useMediaQuery";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const setEditorMode = useAnimationStore((s) => s.setEditorMode);
  const activeArtboardId = useArtboardStore((s) => s.activeArtboardId);
  const isAnimationMode = editorMode === "animation";
  const isMobile = useIsMobile();
  const leftSidebarExpanded = useSidebarUIStore((s) => s.leftSidebarExpanded);

  // Calculate left margin based on sidebar state (only on non-mobile)
  const leftMargin = isMobile ? 0 : leftSidebarExpanded ? 160 : 44;

  // Global shortcut: Ctrl/Cmd+M to toggle animation mode
  useEffect(() => {
    const handleModeToggle = (e: KeyboardEvent) => {
      // Don't handle shortcuts when command palette is open
      if (useCommandStore.getState().isOpen) {
        return;
      }

      // Don't handle when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Ctrl/Cmd + M: Toggle mode
      if ((e.ctrlKey || e.metaKey) && key === "m") {
        e.preventDefault();
        setEditorMode(editorMode === "layout" ? "animation" : "layout");
      }
    };

    window.addEventListener("keydown", handleModeToggle);

    return () => {
      window.removeEventListener("keydown", handleModeToggle);
    };
  }, [editorMode, setEditorMode]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground font-sans">
      <Toolbar />

      {/* Left Sidebar - tools, zoom, canvas settings */}
      <LeftSidebar />

      {/* Shared backdrop for all slide-over panels on mobile/tablet */}
      <SharedBackdrop />

      <div
        className="flex-1 flex overflow-hidden relative transition-[margin] duration-200 ease-out"
        style={{ marginLeft: leftMargin }}
      >
        {/* Main canvas area with optional timeline */}
        <div className="flex-1 flex flex-col relative h-full w-full overflow-hidden">
          {/* Canvas content */}
          <div className="flex-1 relative overflow-hidden">
            {children}
          </div>

          {/* Timeline - only visible in animation mode */}
          {isAnimationMode && (
            isMobile ? (
              // Mobile: Compact mini-bar with bottom sheet for full view
              <TimelineMiniBar artboardId={activeArtboardId} />
            ) : (
              // Desktop/Tablet: Full timeline
              <Timeline artboardId={activeArtboardId} />
            )
          )}
        </div>

        <RightSidebar />
      </div>

      <ThemeEditorModal />
      <StateEditorDrawer />

      {/* Mobile timeline bottom sheet - uses coordinator for state */}
      {isMobile && isAnimationMode && (
        <TimelineBottomSheet artboardId={activeArtboardId} />
      )}
    </div>
  );
};
