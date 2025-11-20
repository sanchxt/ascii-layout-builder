import { type FC, useState, useCallback, useEffect, useRef } from "react";
import type { Artboard } from "@/types/artboard";
import { ARTBOARD_CONSTANTS } from "@/lib/constants";
import { useArtboardStore } from "../store/artboardStore";

interface ArtboardLabelProps {
  artboard: Artboard;
  zoom: number;
  isSelected: boolean;
}

export const ArtboardLabel: FC<ArtboardLabelProps> = ({
  artboard,
  zoom,
  isSelected,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(artboard.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateName = useArtboardStore((state) => state.updateName);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (artboard.locked) return;
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(artboard.name);
    },
    [artboard.locked, artboard.name]
  );

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== artboard.name) {
      updateName(artboard.id, trimmed);
    }
    setIsEditing(false);
  }, [editValue, artboard.id, artboard.name, updateName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(artboard.name);
      }
    },
    [handleSave, artboard.name]
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const labelY = artboard.y - ARTBOARD_CONSTANTS.LABEL_HEIGHT / zoom;
  const fontSize = ARTBOARD_CONSTANTS.LABEL_FONT_SIZE / zoom;
  const padding = 8 / zoom;

  const backgroundColor = isSelected
    ? ARTBOARD_CONSTANTS.SELECTED_BORDER_COLOR
    : ARTBOARD_CONSTANTS.LABEL_BG;

  const textColor = isSelected ? "#ffffff" : "#374151";

  return (
    <g data-artboard-label>
      <rect
        x={artboard.x}
        y={labelY}
        width={artboard.width}
        height={ARTBOARD_CONSTANTS.LABEL_HEIGHT / zoom}
        fill={backgroundColor}
        stroke={
          isSelected ? ARTBOARD_CONSTANTS.SELECTED_BORDER_COLOR : "#d1d5db"
        }
        strokeWidth={1 / zoom}
      />

      {isEditing ? (
        <foreignObject
          x={artboard.x + padding}
          y={labelY + padding}
          width={artboard.width - padding * 2}
          height={ARTBOARD_CONSTANTS.LABEL_HEIGHT / zoom - padding * 2}
        >
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              outline: "none",
              fontSize: `${fontSize}px`,
              fontWeight: 600,
              color: textColor,
              backgroundColor: "transparent",
              fontFamily: "Inter, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </foreignObject>
      ) : (
        <>
          <text
            x={artboard.x + padding}
            y={labelY + ARTBOARD_CONSTANTS.LABEL_HEIGHT / zoom / 2}
            fontSize={fontSize}
            fontWeight={600}
            fill={textColor}
            dominantBaseline="middle"
            onDoubleClick={handleDoubleClick}
            style={{
              cursor: artboard.locked ? "not-allowed" : "text",
              userSelect: "none",
            }}
          >
            {artboard.name}
          </text>

          <text
            x={artboard.x + artboard.width - padding}
            y={labelY + ARTBOARD_CONSTANTS.LABEL_HEIGHT / zoom / 2}
            fontSize={fontSize * 0.85}
            fontWeight={500}
            fill={textColor}
            dominantBaseline="middle"
            textAnchor="end"
            style={{ userSelect: "none", opacity: 0.7 }}
          >
            {artboard.width} × {artboard.height}
          </text>
        </>
      )}
    </g>
  );
};
