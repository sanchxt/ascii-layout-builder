import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Magnet,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { useCanvasStore } from "../store/canvasStore";
import { cn } from "@/lib/utils";

export const CanvasControls = () => {
  const {
    zoomIn,
    zoomOut,
    resetZoom,
    getZoomPercentage,
    canZoomIn,
    canZoomOut,
  } = useCanvasZoom();
  const { viewport, toggleGrid, toggleSnapToGrid, toggleSmartGuides } =
    useCanvasStore();

  const ControlButton = ({
    onClick,
    active = false,
    disabled = false,
    children,
    title,
  }: any) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 rounded-md transition-all",
        active
          ? "bg-blue-50 text-blue-600"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-40">
      {/* View Controls */}
      <div className="bg-white rounded-xl shadow-lg border border-zinc-200/80 p-1.5 flex flex-col gap-1 backdrop-blur-sm">
        <ControlButton onClick={zoomIn} disabled={!canZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </ControlButton>

        <button
          onClick={resetZoom}
          title="Reset Zoom"
          className="py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors text-center font-mono"
        >
          {getZoomPercentage()}
        </button>

        <ControlButton
          onClick={zoomOut}
          disabled={!canZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </ControlButton>
      </div>

      {/* Toggle Controls */}
      <div className="bg-white rounded-xl shadow-lg border border-zinc-200/80 p-1.5 flex flex-col gap-1 backdrop-blur-sm">
        <ControlButton onClick={resetZoom} title="Fit to Screen">
          <Maximize2 className="h-4 w-4" />
        </ControlButton>

        <div className="h-px bg-zinc-100 my-0.5" />

        <ControlButton
          active={viewport.showGrid}
          onClick={toggleGrid}
          title="Toggle Grid"
        >
          <Grid3x3 className="h-4 w-4" />
        </ControlButton>

        <ControlButton
          active={viewport.snapToGrid}
          onClick={toggleSnapToGrid}
          title="Snap to Grid"
        >
          <Magnet className="h-4 w-4" />
        </ControlButton>

        <ControlButton
          active={viewport.showSmartGuides}
          onClick={toggleSmartGuides}
          title="Smart Guides"
        >
          <Ruler className="h-4 w-4" />
        </ControlButton>
      </div>
    </div>
  );
};
