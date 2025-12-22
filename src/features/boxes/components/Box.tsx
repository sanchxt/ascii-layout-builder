import { useMemo } from "react";
import type { Box as BoxType } from "@/types/box";
import { BOX_CONSTANTS } from "@/lib/constants";
import { BoxResizeHandles } from "./BoxResizeHandles";
import { TextEditor } from "./TextEditor";
import { FormattedText } from "./FormattedText";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useBoxStore } from "../store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { useLayoutUIStore } from "@/features/layout-system/store/layoutStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import { Line } from "@/features/lines/components/Line";
import { getLinesInBox } from "@/features/lines/utils/lineHierarchy";
import { useStateRendering } from "@/features/animation/hooks/useStateRendering";
import { useAnimationStore } from "@/features/animation/store/animationStore";
import {
  getChildBoxes,
  getNestingDepth,
  getAbsolutePosition,
  getBorderWidth,
  getAncestors,
} from "../utils/boxHierarchy";
import { Lock, AlertTriangle, X } from "lucide-react";
import {
  LayoutIndicator,
  GridLinesOverlay,
  FlexDirectionOverlay,
} from "@/features/layout-system/components/LayoutIndicator";

interface BoxProps {
  box: BoxType;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onUpdate: (id: string, updates: Partial<BoxType>) => void;
  getCanvasBounds: () => DOMRect | null;
  parentBox?: BoxType;
  onDragStart?: (boxId: string, clientX: number, clientY: number) => void;
  isDragging?: boolean;
  dragPreviewPosition?: { x: number; y: number };
  onLineDragStart?: (
    lineId: string,
    clientX: number,
    clientY: number,
    handle: "line" | "start" | "end"
  ) => void;
  lineDragState?: {
    draggedLineId: string | null;
  };
  isDraggingLine?: boolean;
  getLinePreviewPosition?: (
    lineId: string
  ) => { startX: number; startY: number; endX: number; endY: number } | null;
}

export const Box = ({
  box,
  isSelected,
  onSelect,
  onUpdate,
  getCanvasBounds,
  parentBox,
  onDragStart,
  isDragging = false,
  dragPreviewPosition,
  onLineDragStart,
  lineDragState,
  isDraggingLine = false,
  getLinePreviewPosition,
}: BoxProps) => {
  const editingBoxId = useCanvasStore(
    (state) => state.interaction.editingBoxId
  );
  const selectedTool = useCanvasStore(
    (state) => state.interaction.selectedTool
  );
  const isSpacebarPressed = useCanvasStore(
    (state) => state.interaction.isSpacebarPressed
  );
  const enterEditMode = useCanvasStore((state) => state.enterEditMode);
  const isEditing = editingBoxId === box.id;

  const allBoxes = useBoxStore((state) => state.boxes);
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const deleteBox = useBoxStore((state) => state.deleteBox);
  const artboards = useArtboardStore((state) => state.artboards);
  const zoom = useCanvasStore((state) => state.viewport.zoom);
  const overflowBoxIds = useLayoutUIStore((state) => state.overflowBoxIds);
  const clearOverflowBoxIds = useLayoutUIStore(
    (state) => state.clearOverflowBoxIds
  );
  const isOverflowing = overflowBoxIds.includes(box.id);

  const allLines = useLineStore((state) => state.lines);
  const selectLine = useLineStore((state) => state.selectLine);
  const selectedLineIds = useLineStore((state) => state.selectedLineIds);

  const childLines = useMemo(
    () => getLinesInBox(box.id, allLines),
    [box.id, allLines]
  );

  // Get animation state element data (returns null if not in animation mode)
  const stateElement = useStateRendering(box.id);

  // Preview mode - block interactions
  const editorMode = useAnimationStore((s) => s.editorMode);
  const isPreviewMode = editorMode === "preview";

  const handleDeleteAllOverflow = (e: React.MouseEvent) => {
    e.stopPropagation();
    overflowBoxIds.forEach((id) => {
      deleteBox(id);
    });
    clearOverflowBoxIds();
  };

  // Use state element visibility when in animation mode
  const isVisible = stateElement
    ? stateElement.visible !== false
    : box.visible !== false;
  const ancestors = getAncestors(box.id, allBoxes);
  const hasHiddenAncestor = ancestors.some(
    (ancestor) => ancestor.visible === false
  );

  if (!isVisible || hasHiddenAncestor) {
    return null;
  }

  const isLocked = box.locked === true;
  const childBoxes = getChildBoxes(box.id, allBoxes);
  const nestingDepth = getNestingDepth(box.id, allBoxes);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Block interactions in preview mode
    if (isPreviewMode) {
      e.stopPropagation();
      return;
    }

    if (isSpacebarPressed) {
      return;
    }

    e.stopPropagation();

    if (isLocked) {
      return;
    }

    if (isEditing) return;

    if (selectedTool === "text") {
      enterEditMode(box.id);
      return;
    }

    if (selectedTool === "select" && onDragStart) {
      onDragStart(box.id, e.clientX, e.clientY);
    }

    onSelect(box.id, e.shiftKey);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Block interactions in preview mode
    if (isPreviewMode) {
      e.stopPropagation();
      return;
    }

    e.stopPropagation();
    enterEditMode(box.id);
  };

  const borderStyle = getBorderStyleCSS(box.borderStyle);

  const artboardOffset =
    !parentBox && box.artboardId
      ? artboards.find((a) => a.id === box.artboardId)
      : null;

  let position: { left: number; top: number };

  if (isDragging && dragPreviewPosition) {
    if (parentBox) {
      const parentAbsPos = getAbsolutePosition(parentBox, allBoxes);
      const parentBorder = getBorderWidth(parentBox.borderStyle);
      position = {
        left:
          dragPreviewPosition.x -
          parentAbsPos.x -
          parentBorder -
          parentBox.padding,
        top:
          dragPreviewPosition.y -
          parentAbsPos.y -
          parentBorder -
          parentBox.padding,
      };
    } else {
      position = {
        left: dragPreviewPosition.x,
        top: dragPreviewPosition.y,
      };
    }
  } else {
    // Use state element position when in animation mode, otherwise use box position
    const effectiveX = stateElement ? stateElement.x : box.x;
    const effectiveY = stateElement ? stateElement.y : box.y;

    if (parentBox) {
      position = {
        left: effectiveX,
        top: effectiveY,
      };
    } else if (artboardOffset) {
      position = {
        left: artboardOffset.x + effectiveX,
        top: artboardOffset.y + effectiveY,
      };
    } else {
      position = {
        left: effectiveX,
        top: effectiveY,
      };
    }
  }

  // Calculate effective opacity and transforms from state element
  const effectiveOpacity = stateElement
    ? stateElement.opacity * (isDragging ? 0.5 : 1)
    : isDragging
    ? 0.5
    : 1;
  const effectiveScale = stateElement?.scale ?? 1;
  const effectiveRotation = stateElement?.rotation ?? 0;
  const hasTransform = effectiveScale !== 1 || effectiveRotation !== 0;

  return (
    <div
      className="absolute transition-opacity"
      style={{
        left: position.left,
        top: position.top,
        width: stateElement?.width ?? box.width,
        height: stateElement?.height ?? box.height,
        cursor: isLocked
          ? "not-allowed"
          : isEditing
          ? "text"
          : isDragging
          ? "grabbing"
          : "move",
        zIndex: box.zIndex,
        opacity: effectiveOpacity,
        transform: hasTransform
          ? `scale(${effectiveScale}) rotate(${effectiveRotation}deg)`
          : undefined,
        transformOrigin: hasTransform ? "center center" : undefined,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="w-full h-full bg-canvas-box-bg backdrop-blur-sm relative"
        style={{
          border: borderStyle,
          padding: box.padding,
        }}
      >
        {nestingDepth > 0 && (
          <div
            className="absolute top-1 right-1 text-xs font-mono text-muted-foreground bg-card/70 px-1 rounded pointer-events-none"
            title={`Nesting depth: ${nestingDepth}`}
          >
            L{nestingDepth}
          </div>
        )}

        {isLocked && (
          <div
            className="absolute top-1 left-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded flex items-center gap-1 pointer-events-none"
            title="This box is locked"
          >
            <Lock className="w-3 h-3" />
            <span className="text-xs font-medium">Locked</span>
          </div>
        )}

        {box.layout && box.layout.type !== "none" && (
          <>
            <LayoutIndicator box={box} zoom={zoom} />
            {box.layout.type === "grid" && isSelected && (
              <GridLinesOverlay box={box} zoom={zoom} />
            )}
            {box.layout.type === "flex" && isSelected && (
              <FlexDirectionOverlay box={box} zoom={zoom} />
            )}
          </>
        )}

        {isSelected && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              outline: `${BOX_CONSTANTS.SELECTION_OUTLINE_WIDTH}px solid ${BOX_CONSTANTS.SELECTION_OUTLINE_COLOR}`,
              outlineOffset: "-1px",
            }}
          />
        )}

        {isOverflowing && (
          <>
            <div
              className="absolute inset-0 pointer-events-none animate-pulse"
              style={{
                outline: "3px solid #f97316",
                outlineOffset: "-1px",
                borderRadius: "2px",
              }}
            />
            <div
              className="absolute -top-7 left-0 flex items-center gap-1 bg-orange-500 text-white text-[10px] font-medium rounded overflow-hidden"
              title="This box is outside the grid bounds"
            >
              <div className="flex items-center gap-1 px-1.5 py-0.5 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                Out of bounds
              </div>
              <button
                onClick={handleDeleteAllOverflow}
                className="px-1.5 py-0.5 bg-orange-600 hover:bg-orange-700 transition-colors flex items-center gap-0.5 border-l border-orange-400"
                title={`Delete all ${overflowBoxIds.length} overflow boxes`}
              >
                <X className="w-3 h-3" />
                <span>Delete all ({overflowBoxIds.length})</span>
              </button>
            </div>
          </>
        )}

        {isEditing && <TextEditor box={box} onUpdate={onUpdate} />}

        {!isEditing && box.text.value && (
          <FormattedText text={box.text} showOverflow={false} />
        )}

        {!isEditing && !box.text.value && isSelected && (
          <div className="text-xs text-muted-foreground italic">
            Double-click to add text
          </div>
        )}

        {childBoxes.map((childBox) => (
          <Box
            key={childBox.id}
            box={childBox}
            isSelected={selectedBoxIds.includes(childBox.id)}
            onSelect={onSelect}
            onUpdate={onUpdate}
            getCanvasBounds={getCanvasBounds}
            parentBox={box}
            onDragStart={onDragStart}
            isDragging={false}
            dragPreviewPosition={undefined}
            onLineDragStart={onLineDragStart}
            lineDragState={lineDragState}
            isDraggingLine={isDraggingLine}
            getLinePreviewPosition={getLinePreviewPosition}
          />
        ))}

        {childLines.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{
              width: "100%",
              height: "100%",
              overflow: "visible",
            }}
          >
            <g style={{ pointerEvents: "auto" }}>
              {childLines
                .filter((line) => line.visible !== false)
                .filter((line) => lineDragState?.draggedLineId !== line.id)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((line) => (
                  <Line
                    key={line.id}
                    line={line}
                    isSelected={selectedLineIds.includes(line.id)}
                    onSelect={(id, multi) => selectLine(id, multi)}
                    onDragStart={onLineDragStart}
                    isDragging={lineDragState?.draggedLineId === line.id}
                    dragPreviewPosition={
                      isDraggingLine && getLinePreviewPosition
                        ? getLinePreviewPosition(line.id) || undefined
                        : undefined
                    }
                    zoom={zoom}
                    isNested={true}
                  />
                ))}
            </g>
          </svg>
        )}
      </div>

      {isSelected && !isLocked && (
        <BoxResizeHandles
          box={box}
          onUpdate={onUpdate}
          getCanvasBounds={getCanvasBounds}
        />
      )}
    </div>
  );
};

const getBorderStyleCSS = (borderStyle: BoxType["borderStyle"]): string => {
  switch (borderStyle) {
    case "single":
      return "2px solid var(--canvas-box-border)";
    case "double":
      return "4px double var(--canvas-box-border)";
    case "dashed":
      return "2px dashed var(--canvas-box-border)";
  }
};
