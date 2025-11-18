import { useEffect, useRef, useState } from "react";
import { useCanvasPan } from "../hooks/useCanvasPan";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { useToolShortcuts } from "../hooks/useToolShortcuts";
import { useCanvasStore } from "../store/canvasStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useBoxCreation } from "@/features/boxes/hooks/useBoxCreation";
import { useBoxSelection } from "@/features/boxes/hooks/useBoxSelection";
import { Box } from "@/features/boxes/components/Box";
import { CanvasGrid } from "./CanvasGrid";
import { CanvasControls } from "./CanvasControls";
import { screenToCanvas } from "../utils/coordinateTransform";

interface CanvasProps {
  children?: React.ReactNode;
}

export const Canvas = ({ children }: CanvasProps) => {
  const { viewport, interaction, exitEditMode } = useCanvasStore();
  const { boxes, updateBox } = useBoxStore();
  const {
    handleMouseDown: handlePanMouseDown,
    handleMouseMove: handlePanMouseMove,
    handleMouseUp: handlePanMouseUp,
    handleWheelPan,
    isSpacebarPressed,
  } = useCanvasPan();
  const { handleWheel } = useCanvasZoom();
  const {
    startCreating,
    updateCreating,
    finishCreating,
    createBoxAtPoint,
    tempBox,
  } = useBoxCreation();
  const { handleCanvasClick, isBoxSelected } = useBoxSelection();
  const [isCreatingBox, setIsCreatingBox] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  useToolShortcuts();

  useEffect(() => {
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", preventBrowserZoom, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("wheel", preventBrowserZoom, {
        capture: true,
      });
    };
  }, []);

  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();

      handleWheel(e.deltaY);
    } else {
      e.preventDefault();
      e.stopPropagation();

      const nativeEvent = e.nativeEvent;
      handleWheelPan(nativeEvent);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (interaction.editingBoxId) {
      exitEditMode();
    }

    if (isSpacebarPressed) {
      handlePanMouseDown(e);
      return;
    }

    if (!canvasRef.current) return;
    const bounds = canvasRef.current.getBoundingClientRect();
    const canvasPoint = screenToCanvas(e.clientX, e.clientY, bounds, viewport);

    if (interaction.selectedTool === "box") {
      setIsCreatingBox(true);
      startCreating(canvasPoint);
    } else if (interaction.selectedTool === "select") {
      handleCanvasClick(canvasPoint, e.shiftKey);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSpacebarPressed) {
      handlePanMouseMove(e);
      return;
    }

    if (isCreatingBox && interaction.selectedTool === "box") {
      if (!canvasRef.current) return;
      const bounds = canvasRef.current.getBoundingClientRect();
      const canvasPoint = screenToCanvas(
        e.clientX,
        e.clientY,
        bounds,
        viewport
      );
      updateCreating(canvasPoint);
    } else {
      handlePanMouseMove(e);
    }
  };

  const handleMouseUp = () => {
    handlePanMouseUp();

    if (isCreatingBox) {
      finishCreating();
      setIsCreatingBox(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (interaction.selectedTool === "box") {
      if (!canvasRef.current) return;
      const bounds = canvasRef.current.getBoundingClientRect();
      const canvasPoint = screenToCanvas(
        e.clientX,
        e.clientY,
        bounds,
        viewport
      );
      createBoxAtPoint(canvasPoint);
    }
  };

  const getCursor = () => {
    if (isSpacebarPressed) return "grab";
    if (interaction.selectedTool === "box") return "crosshair";
    if (interaction.selectedTool === "text") return "text";
    return "default";
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      <div
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleCanvasWheel}
        style={{
          cursor: getCursor(),
        }}
      >
        <CanvasGrid />

        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${viewport.position.x}px, ${viewport.position.y}px) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {boxes.map((box) => (
            <Box
              key={box.id}
              box={box}
              isSelected={isBoxSelected(box.id)}
              onSelect={(_boxId, multi) => {
                handleCanvasClick(
                  { x: box.x + box.width / 2, y: box.y + box.height / 2 },
                  multi
                );
              }}
              onUpdate={updateBox}
              getCanvasBounds={() =>
                canvasRef.current?.getBoundingClientRect() || null
              }
            />
          ))}

          {tempBox && (
            <div
              className="absolute border-2 border-dashed border-blue-500 bg-blue-50/30 pointer-events-none"
              style={{
                left: tempBox.x,
                top: tempBox.y,
                width: tempBox.width,
                height: tempBox.height,
              }}
            />
          )}

          {boxes.length === 0 && !tempBox && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Welcome to ASCII Layout Builder
                </h2>
                <p className="text-sm text-gray-500">
                  Press{" "}
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">
                    B
                  </kbd>{" "}
                  to activate box tool, then drag to create boxes
                  <br />
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">
                    Space
                  </kbd>{" "}
                  + drag or scroll to pan •{" "}
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">
                    Shift
                  </kbd>{" "}
                  + scroll for horizontal pan
                  <br />
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">
                    Ctrl/Cmd
                  </kbd>{" "}
                  + scroll to zoom
                </p>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>

      <CanvasControls />
    </div>
  );
};
