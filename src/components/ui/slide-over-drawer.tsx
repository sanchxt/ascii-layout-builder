import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { Z_INDEX } from "@/lib/zIndex";
import { LAYOUT_CONSTANTS } from "@/lib/constants";

interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  children: ReactNode;
  className?: string;
  /** Z-index for the drawer. Use Z_INDEX constants. */
  zIndex?: number;
  /** Show a grab handle at the top for slide-over discovery */
  showGrabHandle?: boolean;
  /** @deprecated Use SharedBackdrop component instead */
  showBackdrop?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  fullScreenOnMobile?: boolean;
}

export const SlideOverDrawer = ({
  isOpen,
  onClose,
  title,
  width = 320,
  children,
  className,
  zIndex = Z_INDEX.OUTPUT_DRAWER,
  showGrabHandle = false,
  showBackdrop = false,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  fullScreenOnMobile = false,
}: SlideOverDrawerProps) => {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const shouldFullScreen = fullScreenOnMobile && isMobile;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [closeOnEscape, isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
      {/* Legacy backdrop - prefer SharedBackdrop component instead */}
      {showBackdrop && (
        <div
          className={cn(
            "fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{ zIndex: Z_INDEX.PANEL_BACKDROP }}
          onClick={closeOnBackdropClick ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed flex flex-col",
          "bg-card border-l border-border",
          "shadow-[-8px_0_30px_-15px_rgba(0,0,0,0.2)]",
          "transition-all duration-300 ease-out",
          // Full screen on mobile
          shouldFullScreen
            ? cn(
                "inset-0 border-l-0",
                isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              )
            : cn(
                "right-0",
                isOpen ? "translate-x-0" : "translate-x-full"
              ),
          className
        )}
        style={{
          zIndex,
          ...(shouldFullScreen
            ? {}
            : {
                width,
                top: LAYOUT_CONSTANTS.TOOLBAR_HEIGHT,
                height: `calc(100vh - ${LAYOUT_CONSTANTS.TOOLBAR_HEIGHT}px)`,
              }),
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Grab handle for slide-over discovery */}
        {showGrabHandle && !shouldFullScreen && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-muted-foreground/30" />
        )}

        {/* Header - always show on mobile full screen, or when title is provided */}
        {(shouldFullScreen || title) && (
          <div className="shrink-0 h-12 px-4 flex items-center justify-between border-b border-border bg-card">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {title || "Output"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </div>
    </>
  );
};

interface SubPanelDrawerProps extends Omit<SlideOverDrawerProps, "width"> {
  width?: number;
}

export const SubPanelDrawer = ({
  width = 280,
  showBackdrop = false,
  zIndex = Z_INDEX.LAYOUT_PANEL,
  ...props
}: SubPanelDrawerProps) => {
  return (
    <SlideOverDrawer width={width} showBackdrop={showBackdrop} zIndex={zIndex} {...props} />
  );
};
