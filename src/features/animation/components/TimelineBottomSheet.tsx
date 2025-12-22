/**
 * TimelineBottomSheet Component
 *
 * Mobile bottom sheet that slides up to show the full Timeline.
 * Features improved sizing (80vh), smooth transitions, and touch-friendly controls.
 * Integrates with panel coordinator for mutual exclusivity on mobile.
 */

import { useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/zIndex";
import { usePanelCoordinator } from "@/lib/store/panelCoordinatorStore";
import { Timeline } from "./Timeline";

interface TimelineBottomSheetProps {
  artboardId: string | null;
}

const MAX_HEIGHT = "80vh";
const HEADER_HEIGHT = 56; // px

export function TimelineBottomSheet({
  artboardId,
}: TimelineBottomSheetProps) {
  // Use coordinator directly (mobile-only component)
  const { activeMobilePanel, closePanel } = usePanelCoordinator();
  const isOpen = activeMobilePanel === "timeline";

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closePanel();
      }
    },
    [isOpen, closePanel]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-[3px]",
          "transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ zIndex: Z_INDEX.PANEL_BACKDROP }}
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed left-0 right-0 bottom-0",
          "bg-background",
          "rounded-t-2xl",
          "shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.3)]",
          "border-t border-border/40",
          "transition-transform duration-300 ease-out",
          "will-change-transform",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          zIndex: Z_INDEX.OUTPUT_DRAWER,
          maxHeight: MAX_HEIGHT,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Timeline"
      >
        {/* Header with drag handle */}
        <div
          className={cn(
            "flex flex-col",
            "border-b border-border/40",
            "bg-gradient-to-b from-muted/20 to-transparent"
          )}
        >
          {/* Drag handle indicator */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div
              className={cn(
                "w-10 h-1 rounded-full",
                "bg-muted-foreground/25",
                "transition-colors duration-150",
                "hover:bg-muted-foreground/40"
              )}
            />
          </div>

          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-2">
            <h2
              className={cn(
                "text-sm font-semibold text-foreground",
                "tracking-tight"
              )}
            >
              Animation Timeline
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closePanel}
              className={cn(
                "h-8 w-8 p-0 rounded-full",
                "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Timeline content */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: `calc(${MAX_HEIGHT} - ${HEADER_HEIGHT}px)` }}
        >
          <Timeline artboardId={artboardId} className="border-t-0" />
        </div>
      </div>
    </>
  );
}
