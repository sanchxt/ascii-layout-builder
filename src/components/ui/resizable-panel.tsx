import { useRef, useCallback, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSidebarUIStore,
  PANEL_CONSTRAINTS,
} from "@/components/layout/store/sidebarUIStore";

interface ResizablePanelProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  collapsible?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  showDivider?: boolean;
  badge?: number | string;
}

export const ResizablePanel = ({
  id,
  title,
  icon: Icon,
  collapsible = true,
  headerActions,
  children,
  className,
  showDivider = true,
  badge,
}: ResizablePanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const panelHeight = useSidebarUIStore(
    (state) => state.panelHeights[id] || PANEL_CONSTRAINTS[id]?.height || 200
  );
  const isCollapsed = useSidebarUIStore((state) =>
    state.collapsedPanels.has(id)
  );
  const togglePanel = useSidebarUIStore((state) => state.togglePanel);
  const setPanelHeight = useSidebarUIStore((state) => state.setPanelHeight);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) return;

      e.preventDefault();
      setIsDragging(true);

      const startY = e.clientY;
      const startHeight = panelHeight;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientY - startY;
        setPanelHeight(id, startHeight + delta);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    },
    [id, isCollapsed, panelHeight, setPanelHeight]
  );

  const handleHeaderClick = () => {
    if (collapsible) {
      togglePanel(id);
    }
  };

  return (
    <div
      ref={panelRef}
      className={cn("flex flex-col bg-white/80 backdrop-blur-sm", className)}
      style={{
        height: isCollapsed ? "auto" : panelHeight,
        transition: isDragging ? "none" : "height 200ms ease-out",
      }}
    >
      {/* Panel Header */}
      <div
        onClick={handleHeaderClick}
        className={cn(
          "h-11 px-3 flex items-center justify-between shrink-0",
          "border-b border-zinc-100",
          "bg-gradient-to-b from-zinc-50/80 to-white/60",
          collapsible && "cursor-pointer hover:bg-zinc-50/80 transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          {collapsible && (
            <div className="w-4 h-4 flex items-center justify-center text-zinc-400">
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          )}
          {Icon && (
            <Icon className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2} />
          )}
          <span className="text-xs font-semibold text-zinc-700 tracking-wide">
            {title}
          </span>
          {badge !== undefined && (
            <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>

        {headerActions && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {headerActions}
          </div>
        )}
      </div>

      {/* Panel Content */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      )}

      {/* Resize Handle */}
      {showDivider && !isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "h-1.5 shrink-0 cursor-ns-resize group relative",
            "bg-gradient-to-b from-zinc-100/50 to-zinc-200/50",
            "hover:from-blue-100 hover:to-blue-200",
            "transition-colors duration-150",
            isDragging && "from-blue-200 to-blue-300"
          )}
        >
          {/* Drag indicator */}
          <div
            className={cn(
              "absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 mx-auto w-8 rounded-full",
              "bg-zinc-300 group-hover:bg-blue-400 transition-colors",
              isDragging && "bg-blue-500"
            )}
          />
        </div>
      )}
    </div>
  );
};

// Header action button component for consistency
interface PanelActionProps {
  icon: LucideIcon;
  onClick: () => void;
  title?: string;
  active?: boolean;
}

export const PanelAction = ({
  icon: Icon,
  onClick,
  title,
  active,
}: PanelActionProps) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(
      "p-1.5 rounded-md transition-all duration-150",
      "hover:bg-zinc-100 active:scale-95",
      active
        ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
        : "text-zinc-400 hover:text-zinc-600"
    )}
  >
    <Icon className="w-3.5 h-3.5" />
  </button>
);
