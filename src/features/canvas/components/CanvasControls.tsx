import { useState, useRef, useEffect } from "react";
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
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    getZoomPercentage,
    canZoomIn,
    canZoomOut,
  } = useCanvasZoom();
  const { viewport, toggleGrid, toggleSnapToGrid, toggleSmartGuides } =
    useCanvasStore();

  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInputValue, setZoomInputValue] = useState("");
  const zoomInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingZoom && zoomInputRef.current) {
      zoomInputRef.current.focus();
      zoomInputRef.current.select();
    }
  }, [isEditingZoom]);

  const handleZoomClick = () => {
    setZoomInputValue(Math.round(zoom * 100).toString());
    setIsEditingZoom(true);
  };

  const handleZoomSubmit = () => {
    const parsed = parseInt(zoomInputValue, 10);
    if (!isNaN(parsed) && parsed >= 10 && parsed <= 500) {
      setZoom(parsed / 100);
    }
    setIsEditingZoom(false);
  };

  const handleZoomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleZoomSubmit();
    } else if (e.key === "Escape") {
      setIsEditingZoom(false);
    }
  };

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
          ? "bg-canvas-selection/10 text-canvas-selection"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-40">
      <div className="bg-card rounded-xl shadow-lg border border-border p-1.5 flex flex-col gap-1 backdrop-blur-sm">
        <ControlButton onClick={zoomIn} disabled={!canZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </ControlButton>

        <div className="relative h-5 w-8 flex items-center justify-center">
          {isEditingZoom ? (
            <input
              ref={zoomInputRef}
              type="text"
              value={zoomInputValue}
              onChange={(e) =>
                setZoomInputValue(e.target.value.replace(/[^0-9]/g, ""))
              }
              onBlur={handleZoomSubmit}
              onKeyDown={handleZoomKeyDown}
              className="absolute inset-0 text-[10px] font-bold text-foreground bg-accent text-center font-mono border-none outline-none rounded"
              title="Enter zoom percentage (10-500)"
              maxLength={3}
            />
          ) : (
            <button
              onClick={handleZoomClick}
              title="Click to set custom zoom"
              className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors text-center font-mono"
            >
              {getZoomPercentage()}
            </button>
          )}
        </div>

        <ControlButton
          onClick={zoomOut}
          disabled={!canZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </ControlButton>
      </div>

      <div className="bg-card rounded-xl shadow-lg border border-border p-1.5 flex flex-col gap-1 backdrop-blur-sm">
        <ControlButton onClick={resetZoom} title="Fit to Screen">
          <Maximize2 className="h-4 w-4" />
        </ControlButton>

        <div className="h-px bg-border my-0.5" />

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
