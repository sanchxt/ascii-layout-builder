import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  children: ReactNode;
  className?: string;
  showBackdrop?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export const SlideOverDrawer = ({
  isOpen,
  onClose,
  title,
  width = 320,
  children,
  className,
  showBackdrop = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: SlideOverDrawerProps) => {
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
      {showBackdrop && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={closeOnBackdropClick ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full flex flex-col",
          "bg-white border-l border-zinc-200",
          "shadow-[-8px_0_30px_-15px_rgba(0,0,0,0.15)]",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && (
          <div className="shrink-0 h-14 px-4 flex items-center justify-between border-b border-zinc-200 bg-linear-to-b from-zinc-50 to-white">
            <h2 className="text-sm font-semibold text-zinc-800 tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
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
  showBackdrop = true,
  ...props
}: SubPanelDrawerProps) => {
  return (
    <SlideOverDrawer width={width} showBackdrop={showBackdrop} {...props} />
  );
};
