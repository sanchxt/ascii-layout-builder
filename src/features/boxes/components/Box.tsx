import type { Box as BoxType } from "@/types/box";
import { BOX_CONSTANTS } from "@/lib/constants";
import { BoxResizeHandles } from "./BoxResizeHandles";
import { TextEditor } from "./TextEditor";
import { FormattedText } from "./FormattedText";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useBoxStore } from "../store/boxStore";
import {
  getChildBoxes,
  getNestingDepth,
  getAbsolutePosition,
  getBorderWidth,
} from "../utils/boxHierarchy";

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

  const childBoxes = getChildBoxes(box.id, allBoxes);
  const nestingDepth = getNestingDepth(box.id, allBoxes);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

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
        cursor: isEditing ? "text" : isDragging ? "grabbing" : "move",
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
            isDragging={isDragging}
            dragPreviewPosition={dragPreviewPosition}
          />
        ))}
      </div>

      {isSelected && (
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
