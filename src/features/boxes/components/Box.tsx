import type { Box as BoxType } from "@/types/box";
import { BOX_CONSTANTS } from "@/lib/constants";
import { BoxResizeHandles } from "./BoxResizeHandles";
import { TextEditor } from "./TextEditor";
import { FormattedText } from "./FormattedText";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";

interface BoxProps {
  box: BoxType;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onUpdate: (id: string, updates: Partial<BoxType>) => void;
  getCanvasBounds: () => DOMRect | null;
}

export const Box = ({
  box,
  isSelected,
  onSelect,
  onUpdate,
  getCanvasBounds,
}: BoxProps) => {
  const editingBoxId = useCanvasStore(
    (state) => state.interaction.editingBoxId
  );
  const selectedTool = useCanvasStore(
    (state) => state.interaction.selectedTool
  );
  const enterEditMode = useCanvasStore((state) => state.enterEditMode);
  const isEditing = editingBoxId === box.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (selectedTool === "text") {
      enterEditMode(box.id);
      return;
    }

    onSelect(box.id, e.shiftKey);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    enterEditMode(box.id);
  };

  const borderStyle = getBorderStyleCSS(box.borderStyle);

  return (
    <div
      className="absolute"
      style={{
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        cursor: isEditing ? "text" : "move",
      }}
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
