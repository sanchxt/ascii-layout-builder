import type { Box as BoxType } from "@/types/box";
import { BOX_CONSTANTS } from "@/lib/constants";
import { BoxResizeHandles } from "./BoxResizeHandles";
import { TextEditor } from "./TextEditor";
import { FormattedText } from "./FormattedText";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useBoxStore } from "../store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import {
  getChildBoxes,
  getNestingDepth,
  getAbsolutePosition,
  getBorderWidth,
  getAncestors,
} from "../utils/boxHierarchy";
import { Lock } from "lucide-react";

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
}: BoxProps) => {
  const editingBoxId = useCanvasStore(
    (state) => state.interaction.editingBoxId
  );
  const selectedTool = useCanvasStore(
    (state) => state.interaction.selectedTool
  );
  const enterEditMode = useCanvasStore((state) => state.enterEditMode);
  const isEditing = editingBoxId === box.id;

  const allBoxes = useBoxStore((state) => state.boxes);
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const artboards = useArtboardStore((state) => state.artboards);

  const isVisible = box.visible !== false;
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
    if (parentBox) {
      position = {
        left: box.x,
        top: box.y,
      };
    } else if (artboardOffset) {
      position = {
        left: artboardOffset.x + box.x,
        top: artboardOffset.y + box.y,
      };
    } else {
      position = {
        left: box.x,
        top: box.y,
      };
    }
  }

  return (
    <div
      className="absolute transition-opacity"
      style={{
        left: position.left,
        top: position.top,
        width: box.width,
        height: box.height,
        cursor: isLocked
          ? "not-allowed"
          : isEditing
          ? "text"
          : isDragging
          ? "grabbing"
          : "move",
        zIndex: box.zIndex,
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="w-full h-full bg-white/50 backdrop-blur-sm relative"
        style={{
          border: borderStyle,
          padding: box.padding,
        }}
      >
        {nestingDepth > 0 && (
          <div
            className="absolute top-1 right-1 text-xs font-mono text-gray-400 bg-white/70 px-1 rounded pointer-events-none"
            title={`Nesting depth: ${nestingDepth}`}
          >
            L{nestingDepth}
          </div>
        )}

        {isLocked && (
          <div
            className="absolute top-1 left-1 bg-gray-900/80 text-white px-1.5 py-0.5 rounded flex items-center gap-1 pointer-events-none"
            title="This box is locked"
          >
            <Lock className="w-3 h-3" />
            <span className="text-xs font-medium">Locked</span>
          </div>
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

        {isEditing && <TextEditor box={box} onUpdate={onUpdate} />}

        {!isEditing && box.text.value && (
          <FormattedText text={box.text} showOverflow={false} />
        )}

        {!isEditing && !box.text.value && isSelected && (
          <div className="text-xs text-gray-400 italic">
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
          />
        ))}
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
      return "2px solid #94a3b8";
    case "double":
      return "4px double #94a3b8";
    case "dashed":
      return "2px dashed #94a3b8";
  }
};
