import { useCanvasPan } from "../hooks/useCanvasPan";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { useCanvasStore } from "../store/canvasStore";
import { CanvasGrid } from "./CanvasGrid";
import { CanvasControls } from "./CanvasControls";

interface CanvasProps {
  children?: React.ReactNode;
}

export const Canvas = ({ children }: CanvasProps) => {
  const { viewport } = useCanvasStore();
  const { handleMouseDown, handleMouseMove, handleMouseUp, isSpacebarPressed } =
    useCanvasPan();
  const { handleWheel } = useCanvasZoom();

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      {/* canvas container */}
      <div
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isSpacebarPressed ? "grab" : "default",
        }}
      >
        {/* grid background */}
        <CanvasGrid />

        {/* canvas content */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${viewport.position.x}px, ${viewport.position.y}px) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {children || (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Welcome to ASCII Layout Builder
                </h2>
                <p className="text-sm text-gray-500">
                  Press{" "}
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">
                    Space
                  </kbd>{" "}
                  + drag to pan
                  <br />
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">
                    Ctrl/Cmd
                  </kbd>{" "}
                  + scroll to zoom
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CanvasControls />
    </div>
  );
};
