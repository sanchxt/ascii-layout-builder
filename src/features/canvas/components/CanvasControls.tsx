import { ZoomIn, ZoomOut, Maximize2, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { useCanvasStore } from "../store/canvasStore";

export const CanvasControls = () => {
  const {
    zoomIn,
    zoomOut,
    resetZoom,
    getZoomPercentage,
    canZoomIn,
    canZoomOut,
  } = useCanvasZoom();
  const { viewport, toggleGrid } = useCanvasStore();

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
      {/* zoom in */}
      <Button
        variant="ghost"
        size="icon"
        onClick={zoomIn}
        disabled={!canZoomIn}
        title="Zoom In (Ctrl/Cmd + Scroll Up)"
        className="h-8 w-8"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      {/* zoom percentage display */}
      <button
        onClick={resetZoom}
        title="Reset Zoom (Ctrl/Cmd + 0)"
        className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        {getZoomPercentage()}
      </button>

      {/* zoom out */}
      <Button
        variant="ghost"
        size="icon"
        onClick={zoomOut}
        disabled={!canZoomOut}
        title="Zoom Out (Ctrl/Cmd + Scroll Down)"
        className="h-8 w-8"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      {/* divider */}
      <div className="h-px bg-gray-200 my-1" />

      {/* fit to screen */}
      <Button
        variant="ghost"
        size="icon"
        onClick={resetZoom}
        title="Reset View (Ctrl/Cmd + 0)"
        className="h-8 w-8"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      {/* toggle grid */}
      <Button
        variant={viewport.showGrid ? "default" : "ghost"}
        size="icon"
        onClick={toggleGrid}
        title="Toggle Grid (Ctrl/Cmd + ')"
        className="h-8 w-8"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
    </div>
  );
};
