/**
 * LeftSidebar - Minimal collapsible sidebar with tools and canvas toggles
 *
 * Design: Clean, compact tool palette similar to Figma's left toolbar.
 */

import { useEffect } from "react";
import {
  MousePointer2,
  Square,
  Type,
  Frame,
  Minus,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Magnet,
  Ruler,
} from "lucide-react";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useSidebarUIStore } from "./store/sidebarUIStore";
import type { ToolType } from "@/types/canvas";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsTablet } from "@/lib/useMediaQuery";
import { Z_INDEX } from "@/lib/zIndex";

// Tool definitions
const tools: { id: ToolType; icon: typeof MousePointer2; label: string; shortcut: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { id: "box", icon: Square, label: "Box", shortcut: "B" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "artboard", icon: Frame, label: "Artboard", shortcut: "A" },
  { id: "line", icon: Minus, label: "Line", shortcut: "L" },
];

export const LeftSidebar = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Sidebar state
  const isExpanded = useSidebarUIStore((s) => s.leftSidebarExpanded);
  const setExpanded = useSidebarUIStore((s) => s.setLeftSidebarExpanded);

  // Tool state
  const { interaction, setSelectedTool, viewport, toggleGrid, toggleSnapToGrid, toggleSmartGuides } = useCanvasStore();
  const selectedTool = interaction.selectedTool;

  // Auto-collapse on mobile/tablet
  useEffect(() => {
    if (isMobile || isTablet) {
      setExpanded(false);
    }
  }, [isMobile, isTablet, setExpanded]);

  // Mobile: hidden
  if (isMobile) {
    return null;
  }

  const sidebarWidth = isExpanded ? 160 : 44;

  return (
    <aside
      className={cn(
        "fixed top-12 left-0 h-[calc(100vh-48px)]",
        "flex flex-col",
        "bg-sidebar border-r border-sidebar-border",
        "transition-all duration-200 ease-out"
      )}
      style={{
        width: sidebarWidth,
        zIndex: Z_INDEX.LEFT_SIDEBAR
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setExpanded(!isExpanded)}
        className={cn(
          "absolute -right-2.5 top-3 z-10",
          "w-5 h-5 rounded-full",
          "bg-sidebar border border-sidebar-border",
          "flex items-center justify-center",
          "text-muted-foreground hover:text-foreground",
          "shadow-sm hover:shadow",
          "transition-all duration-150"
        )}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <ChevronLeft className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>

      {/* Tools Section */}
      <div className="p-1.5">
        {isExpanded && (
          <div className="px-2 py-1 mb-0.5">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tools
            </span>
          </div>
        )}
        <div className={cn("flex flex-col gap-0.5", !isExpanded && "items-center")}>
          {tools.map((tool) => {
            const isActive = selectedTool === tool.id;
            return (
              <ToolButton
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                shortcut={tool.shortcut}
                isActive={isActive}
                isExpanded={isExpanded}
                onClick={() => setSelectedTool(tool.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Canvas Toggles */}
      <div className="p-1.5 border-t border-sidebar-border">
        {isExpanded && (
          <div className="px-2 py-1 mb-0.5">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              Canvas
            </span>
          </div>
        )}
        <div className={cn("flex flex-col gap-0.5", !isExpanded && "items-center")}>
          <ToolButton
            icon={Grid3x3}
            label="Grid"
            isActive={viewport.showGrid}
            isExpanded={isExpanded}
            onClick={toggleGrid}
          />
          <ToolButton
            icon={Magnet}
            label="Snap"
            isActive={viewport.snapToGrid}
            isExpanded={isExpanded}
            onClick={toggleSnapToGrid}
          />
          <ToolButton
            icon={Ruler}
            label="Guides"
            isActive={viewport.showSmartGuides}
            isExpanded={isExpanded}
            onClick={toggleSmartGuides}
          />
        </div>
      </div>
    </aside>
  );
};

// Reusable tool button component
interface ToolButtonProps {
  icon: typeof MousePointer2;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

const ToolButton = ({
  icon: Icon,
  label,
  shortcut,
  isActive = false,
  isExpanded,
  onClick,
}: ToolButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2 rounded transition-all duration-100",
        isExpanded ? "w-full px-2 h-7" : "w-8 h-8 justify-center",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
      title={isExpanded ? undefined : `${label}${shortcut ? ` (${shortcut})` : ""}`}
    >
      <Icon className="w-4 h-4 shrink-0" />

      {isExpanded && (
        <>
          <span className="flex-1 text-left text-xs truncate">{label}</span>
          {shortcut && (
            <kbd className="text-[9px] font-mono text-muted-foreground/70">
              {shortcut}
            </kbd>
          )}
        </>
      )}

      {/* Tooltip for collapsed state */}
      {!isExpanded && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border shadow-md">
          {label}
          {shortcut && <span className="text-muted-foreground ml-1.5">{shortcut}</span>}
        </div>
      )}
    </button>
  );
};
