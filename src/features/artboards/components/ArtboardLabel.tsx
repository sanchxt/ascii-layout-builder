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

  // Calculate positions relative to zoom
  const labelHeight = 24 / zoom;
  const labelY = artboard.y - labelHeight - 4 / zoom;
  const fontSize = 12 / zoom;
  const padding = 6 / zoom;

  const textColor = isSelected ? "#3b82f6" : "#71717a"; // blue-500 : zinc-500

  return (
    <g data-artboard-label>
      {isEditing ? (
        <foreignObject
          x={artboard.x}
          y={labelY}
          width={artboard.width}
          height={labelHeight}
        >
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            style={{
              width: "auto",
              minWidth: "50px",
              height: "100%",
              border: "none",
              outline: "2px solid #3b82f6",
              borderRadius: "2px",
              fontSize: `${fontSize}px`,
              fontWeight: 600,
              color: "#18181b",
              backgroundColor: "#ffffff",
              fontFamily: "Inter, sans-serif",
              padding: `0 ${padding}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </foreignObject>
      ) : (
        <text
          x={artboard.x}
          y={labelY + labelHeight / 2}
          fontSize={fontSize}
          fontWeight={600}
          fill={textColor}
          dominantBaseline="middle"
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: artboard.locked ? "not-allowed" : "text",
            userSelect: "none",
            textShadow: "0 1px 2px rgba(255,255,255,0.8)",
          }}
        >
          {artboard.name}
          <tspan
            fill="#a1a1aa"
            fontWeight={400}
            dx={8 / zoom}
            fontSize={fontSize * 0.9}
          >
            {artboard.width} × {artboard.height}
          </tspan>
        </text>
      )}
    </g>
  );
};
