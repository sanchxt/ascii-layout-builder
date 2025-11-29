import { useEffect, useRef, useState, useMemo } from "react";
import { useCanvasPan } from "../hooks/useCanvasPan";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { useToolShortcuts } from "../hooks/useToolShortcuts";
import { useSelectionRectangle } from "../hooks/useSelectionRectangle";
import { useCanvasStore } from "../store/canvasStore";
import {
  useBoxStore,
  setRecordSnapshotFn,
} from "@/features/boxes/store/boxStore";
import { useBoxCreation } from "@/features/boxes/hooks/useBoxCreation";
import { useBoxSelection } from "@/features/boxes/hooks/useBoxSelection";
import { useGrouping } from "@/features/boxes/hooks/useGrouping";
import { useBoxDrag } from "@/features/boxes/hooks/useBoxDrag";
import { useDropZone } from "@/features/boxes/hooks/useDropZone";
import { useHistory } from "@/features/history/hooks/useHistory";
import { useAlignment } from "@/features/alignment/hooks/useAlignment";
import { useDistribution } from "@/features/alignment/hooks/useDistribution";
import { useSmartGuides } from "@/features/alignment/hooks/useSmartGuides";
import { useLayerKeyboardShortcuts } from "@/features/boxes/hooks/useLayerKeyboardShortcuts";
import { recordSnapshot } from "@/features/history/store/historyStore";
import {
  useArtboardStore,
  setArtboardRecordSnapshotFn,
} from "@/features/artboards/store/artboardStore";
import { useArtboardDrag } from "@/features/artboards/hooks/useArtboardDrag";
import { useArtboardSelection } from "@/features/artboards/hooks/useArtboardSelection";
import { useArtboardShortcuts } from "@/features/artboards/hooks/useArtboardShortcuts";
import { useArtboardDropZone } from "@/features/artboards/hooks/useArtboardDropZone";
import { Artboard } from "@/features/artboards/components/Artboard";
import { ArtboardDropZoneIndicator } from "@/features/artboards/components/ArtboardDropZoneIndicator";
import { Box } from "@/features/boxes/components/Box";
import { DropZoneIndicator } from "@/features/boxes/components/DropZoneIndicator";
import { SmartGuides } from "@/features/alignment/components/SmartGuides";
import { SelectionRectangle } from "./SelectionRectangle";
import { CanvasGrid } from "./CanvasGrid";
import { CanvasControls } from "./CanvasControls";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { screenToCanvas } from "../utils/coordinateTransform";
import {
  getRootBoxes,
  convertToLocalPosition,
  getDeepestBoxAtPoint,
} from "@/features/boxes/utils/boxHierarchy";
import { snapToGrid } from "@/features/alignment/utils/coordinateHelpers";
import { CANVAS_CONSTANTS, BOX_CONSTANTS } from "@/lib/constants";
import { findArtboardAtPoint } from "@/features/artboards/utils/artboardHelpers";
import { canvasToArtboardRelative } from "@/features/artboards/utils/coordinateConversion";
import { MousePointer2, Square } from "lucide-react";

interface CanvasProps {
  children?: React.ReactNode;
}

export const Canvas = ({ children }: CanvasProps) => {
  const { viewport, interaction, exitEditMode } = useCanvasStore();

  const boxes = useBoxStore((state) => state.boxes);
  const updateBox = useBoxStore((state) => state.updateBox);
  const selectBox = useBoxStore((state) => state.selectBox);
  const artboards = useArtboardStore((state) => state.artboards);
  const { isArtboardSelected } = useArtboardSelection();
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
  const { selectionRect, startSelection, updateSelection, finishSelection } =
    useSelectionRectangle();
  const [isCreatingBox, setIsCreatingBox] = useState(false);
  const [isDrawingSelection, setIsDrawingSelection] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  useToolShortcuts();
  useLayerKeyboardShortcuts();
  useArtboardShortcuts();
  useGrouping();
  useHistory();
  useAlignment();
  useDistribution();

  const rootBoxes = useMemo(() => getRootBoxes(boxes), [boxes]);

  const {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    isDragging: isDraggingBox,
    getBoxPreviewPosition,
    initialAbsolutePositions,
  } = useBoxDrag({
    onDragEnd: (draggedBoxIds, finalDelta) => {
      draggedBoxIds.forEach((id) => {
        const box = boxes.find((b) => b.id === id);
        if (!box) return;
        if (box.parentId && draggedBoxIds.includes(box.parentId)) return;
        const initialAbs = initialAbsolutePositions.get(id);
        if (!initialAbs) return;
        let finalAbsX = initialAbs.x + finalDelta.x;
        let finalAbsY = initialAbs.y + finalDelta.y;
        if (viewport.snapToGrid) {
          finalAbsX = snapToGrid(finalAbsX, CANVAS_CONSTANTS.GRID_SIZE);
          finalAbsY = snapToGrid(finalAbsY, CANVAS_CONSTANTS.GRID_SIZE);
        }
        let targetParentId: string | null = null;
        if (dropZoneState.isValidDropZone && dropZoneState.potentialParentId) {
          targetParentId = dropZoneState.potentialParentId;
        } else {
          targetParentId = box.parentId || null;
        }
        if (targetParentId) {
          const targetParent =
            boxes.find((b) => b.id === targetParentId) || null;
          const newLocalPos = convertToLocalPosition(
            finalAbsX,
            finalAbsY,
            targetParent,
            boxes
          );
          updateBox(id, {
            parentId: targetParentId,
            artboardId: undefined,
            x: newLocalPos.x,
            y: newLocalPos.y,
          });
          return;
        }
        const boxCenterX = finalAbsX + box.width / 2;
        const boxCenterY = finalAbsY + box.height / 2;
        if (box.artboardId) {
          const currentArtboard = artboards.find(
            (a) => a.id === box.artboardId
          );
          if (currentArtboard) {
            const threshold = BOX_CONSTANTS.AUTO_DETACH_THRESHOLD;
            const isOutside =
              boxCenterX < currentArtboard.x - threshold ||
              boxCenterX >
                currentArtboard.x + currentArtboard.width + threshold ||
              boxCenterY < currentArtboard.y - threshold ||
              boxCenterY >
                currentArtboard.y + currentArtboard.height + threshold;
            if (isOutside) {
              updateBox(id, {
                artboardId: undefined,
                parentId: undefined,
                x: finalAbsX,
                y: finalAbsY,
              });
              return;
            }
          }
        }
        const targetArtboard = findArtboardAtPoint(
          { x: boxCenterX, y: boxCenterY },
          artboards
        );
        if (targetArtboard && targetArtboard.id !== box.artboardId) {
          const relativePos = canvasToArtboardRelative(
            finalAbsX,
            finalAbsY,
            targetArtboard
          );
          updateBox(id, {
            artboardId: targetArtboard.id,
            parentId: undefined,
            x: relativePos.x,
            y: relativePos.y,
          });
          return;
        }
        if (box.artboardId) {
          const artboard = artboards.find((a) => a.id === box.artboardId);
          if (artboard) {
            const relativePos = canvasToArtboardRelative(
              finalAbsX,
              finalAbsY,
              artboard
            );
            updateBox(id, { x: relativePos.x, y: relativePos.y });
          }
        } else {
          updateBox(id, { x: finalAbsX, y: finalAbsY });
        }
      });
    },
  });

  const {
    dragState: artboardDragState,
    startDrag: startArtboardDrag,
    updateDrag: updateArtboardDrag,
    endDrag: endArtboardDrag,
    cancelDrag: cancelArtboardDrag,
    isDragging: isDraggingArtboard,
    getArtboardPreviewPosition,
  } = useArtboardDrag();

  useEffect(() => {
    setRecordSnapshotFn(recordSnapshot);
    setArtboardRecordSnapshotFn(recordSnapshot);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDraggingBox) {
          cancelDrag();
        } else if (isDraggingArtboard) {
          cancelArtboardDrag();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDraggingBox, cancelDrag, isDraggingArtboard, cancelArtboardDrag]);

  const getCanvasMousePosition = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const bounds = canvasRef.current.getBoundingClientRect();
    return screenToCanvas(clientX, clientY, bounds, viewport);
  };

  const [canvasMousePos, setCanvasMousePos] = useState({ x: 0, y: 0 });

  const dropZoneState = useDropZone({
    draggedBoxIds: dragState.draggedBoxIds,
    currentMousePos: canvasMousePos,
    isDragging: isDraggingBox,
  });

  const artboardDropZoneState = useArtboardDropZone({
    draggedBoxIds: dragState.draggedBoxIds,
    currentMousePos: canvasMousePos,
    isDragging: isDraggingBox,
  });

  const currentDelta = useMemo(
    () => ({
      x: dragState.currentCanvasPos.x - dragState.startCanvasPos.x,
      y: dragState.currentCanvasPos.y - dragState.startCanvasPos.y,
    }),
    [
      dragState.currentCanvasPos.x,
      dragState.currentCanvasPos.y,
      dragState.startCanvasPos.x,
      dragState.startCanvasPos.y,
    ]
  );

  const { alignmentGuides, spacingGuides, snappedDelta } = useSmartGuides({
    isDragging: isDraggingBox,
    draggedBoxIds: dragState.draggedBoxIds,
    currentDelta,
  });

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
      const clickedBox = getDeepestBoxAtPoint(canvasPoint, boxes);

      if (clickedBox) {
        handleCanvasClick(canvasPoint, e.shiftKey);
      } else {
        setIsDrawingSelection(true);
        startSelection(canvasPoint.x, canvasPoint.y);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasPos = getCanvasMousePosition(e.clientX, e.clientY);
    setCanvasMousePos(canvasPos);

    if (isDraggingArtboard) {
      updateArtboardDrag(canvasPos.x, canvasPos.y);
      return;
    }

    if (isDraggingBox) {
      updateDrag(canvasPos.x, canvasPos.y);
      return;
    }

    if (isDrawingSelection) {
      updateSelection(canvasPos.x, canvasPos.y);
      return;
    }

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

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDraggingArtboard) {
      endArtboardDrag();
      return;
    }

    if (isDraggingBox) {
      endDrag();
      return;
    }

    if (isDrawingSelection) {
      finishSelection(e.shiftKey);
      setIsDrawingSelection(false);
      return;
    }

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
    if (isDraggingArtboard || isDraggingBox) return "grabbing";
    if (isSpacebarPressed) return "grab";
    if (interaction.selectedTool === "box") return "crosshair";
    if (interaction.selectedTool === "text") return "text";
    return "default";
  };

  const handleBoxDragStart = (
    boxId: string,
    clientX: number,
    clientY: number
  ) => {
    if (interaction.selectedTool !== "select" || interaction.editingBoxId) {
      return;
    }

    const canvasPos = getCanvasMousePosition(clientX, clientY);
    startDrag(boxId, canvasPos.x, canvasPos.y);
  };

  const handleArtboardDragStart = (
    artboardId: string,
    clientX: number,
    clientY: number
  ) => {
    const canvasPos = getCanvasMousePosition(clientX, clientY);
    startArtboardDrag(artboardId, canvasPos.x, canvasPos.y);
  };

  const getSnappedPreviewPosition = (
    boxId: string
  ): { x: number; y: number } | undefined => {
    const basePosition = getBoxPreviewPosition(boxId);
    if (!basePosition) return undefined;

    if (snappedDelta) {
      const initialAbs = initialAbsolutePositions.get(boxId);
      if (initialAbs) {
        return {
          x: initialAbs.x + snappedDelta.x,
          y: initialAbs.y + snappedDelta.y,
        };
      }
    }

    return basePosition;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-50/50">
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
          {artboards
            .filter((ab) => ab.visible)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((artboard) => (
              <Artboard
                key={artboard.id}
                artboard={artboard}
                zoom={viewport.zoom}
                isSelected={isArtboardSelected(artboard.id)}
                onDragStart={handleArtboardDragStart}
                isDragging={artboardDragState.draggedArtboardIds.includes(
                  artboard.id
                )}
                dragPreviewPosition={
                  isDraggingArtboard
                    ? getArtboardPreviewPosition(artboard.id) || undefined
                    : undefined
                }
              />
            ))}

          {rootBoxes.map((box) => {
            let boxDragPreview = isDraggingBox
              ? getSnappedPreviewPosition(box.id)
              : undefined;

            if (!boxDragPreview && box.artboardId && isDraggingArtboard) {
              const artboardPreview = getArtboardPreviewPosition(
                box.artboardId
              );
              if (artboardPreview) {
                boxDragPreview = {
                  x: artboardPreview.x + box.x,
                  y: artboardPreview.y + box.y,
                };
              }
            }

            return (
              <Box
                key={box.id}
                box={box}
                isSelected={isBoxSelected(box.id)}
                onSelect={(boxId, multi) => {
                  selectBox(boxId, multi);
                }}
                onUpdate={updateBox}
                getCanvasBounds={() =>
                  canvasRef.current?.getBoundingClientRect() || null
                }
                onDragStart={handleBoxDragStart}
                isDragging={dragState.draggedBoxIds.includes(box.id)}
                dragPreviewPosition={boxDragPreview}
              />
            );
          })}

          {isDraggingBox && dropZoneState.potentialParentId && (
            <DropZoneIndicator
              targetBoxId={dropZoneState.potentialParentId}
              isValid={dropZoneState.isValidDropZone}
              validationMessage={dropZoneState.validationMessage}
            />
          )}

          {isDraggingBox &&
            !dropZoneState.potentialParentId &&
            artboardDropZoneState.potentialArtboardId && (
              <ArtboardDropZoneIndicator
                targetArtboardId={artboardDropZoneState.potentialArtboardId}
                isValid={artboardDropZoneState.isValidDropZone}
                validationMessage={artboardDropZoneState.validationMessage}
              />
            )}

          {isDraggingBox && (
            <SmartGuides
              alignmentGuides={alignmentGuides}
              spacingGuides={spacingGuides}
            />
          )}

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

          {selectionRect && (
            <SelectionRectangle selectionRect={selectionRect} />
          )}

          {boxes.length === 0 && !tempBox && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
              <div className="flex flex-col items-center gap-4 text-zinc-400">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
                      <Square className="w-6 h-6 text-zinc-400" />
                    </div>
                    <span className="text-xs font-medium">Box Tool (B)</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
                      <MousePointer2 className="w-6 h-6 text-zinc-400" />
                    </div>
                    <span className="text-xs font-medium">Select (V)</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mt-2">
                  Start by selecting a tool or dragging on the canvas
                </p>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>

      <LeftSidebar />
      <CanvasControls />
    </div>
  );
};
