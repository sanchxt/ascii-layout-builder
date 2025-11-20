import { type FC, useMemo } from "react";
import type { Artboard as ArtboardType } from "@/types/artboard";
import { ARTBOARD_CONSTANTS } from "@/lib/constants";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "../store/artboardStore";
import { getBoxesInArtboard, getBoxOverflow } from "../utils/artboardHelpers";

interface ArtboardProps {
  artboard: ArtboardType;
  zoom?: number;
  isSelected: boolean;
  onDragStart?: (artboardId: string, clientX: number, clientY: number) => void;
  dragPreviewPosition?: { x: number; y: number };
  isDragging?: boolean;
}

export const Artboard: FC<ArtboardProps> = ({
  artboard,
  isSelected,
  onDragStart,
  dragPreviewPosition,
  isDragging = false,
}) => {
  const selectArtboard = useArtboardStore((state) => state.selectArtboard);
  const boxes = useBoxStore((state) => state.boxes);

  const hasOverflow = useMemo(() => {
    const artboardBoxes = getBoxesInArtboard(artboard.id, boxes);
    return artboardBoxes.some((box) => getBoxOverflow(box, artboard) !== null);
  }, [artboard, boxes]);

  const handleArtboardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isArtboardFrame =
      target.hasAttribute("data-artboard-boundary") ||
      target.hasAttribute("data-artboard-label") ||
      target.closest("[data-artboard-label]") !== null;

    if (isArtboardFrame) {
      selectArtboard(artboard.id, e.shiftKey);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (artboard.locked) return;

    const target = e.target as HTMLElement;
    const isArtboardFrame =
      target.hasAttribute("data-artboard-boundary") ||
      target.hasAttribute("data-artboard-label") ||
      target.closest("[data-artboard-label]") !== null;

    if (isArtboardFrame && onDragStart) {
      e.stopPropagation();
      onDragStart(artboard.id, e.clientX, e.clientY);
    }
  };

  if (!artboard.visible) {
    return null;
  }

  const borderColor = isSelected
    ? ARTBOARD_CONSTANTS.SELECTED_BORDER_COLOR
    : ARTBOARD_CONSTANTS.BORDER_COLOR;

  const displayX = dragPreviewPosition?.x ?? artboard.x;
  const displayY = dragPreviewPosition?.y ?? artboard.y;

  return (
    <div
      data-artboard-id={artboard.id}
      onClick={handleArtboardClick}
      onMouseDown={handleMouseDown}
      className="absolute pointer-events-auto"
      style={{
        left: displayX,
        top: displayY,
        width: artboard.width,
        height: artboard.height,
        pointerEvents: artboard.locked ? "none" : "auto",
        opacity: artboard.locked ? 0.5 : isDragging ? 0.7 : 1,
        transition: isDragging ? "none" : "opacity 0.2s",
      }}
    >
      <div
        data-artboard-boundary
        className="absolute inset-0 bg-white"
        style={{
          border: `${ARTBOARD_CONSTANTS.BORDER_THICKNESS}px dashed ${borderColor}`,
          cursor: artboard.locked
            ? "not-allowed"
            : isDragging
            ? "grabbing"
            : "grab",
        }}
      />

      <div
        data-artboard-label
        className="absolute"
        style={{
          left: 0,
          top: -ARTBOARD_CONSTANTS.LABEL_HEIGHT,
          width: artboard.width,
          height: ARTBOARD_CONSTANTS.LABEL_HEIGHT,
          backgroundColor: isSelected
            ? ARTBOARD_CONSTANTS.SELECTED_BORDER_COLOR
            : ARTBOARD_CONSTANTS.LABEL_BG,
          border: `1px solid ${
            isSelected ? ARTBOARD_CONSTANTS.SELECTED_BORDER_COLOR : "#d1d5db"
          }`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          fontSize: ARTBOARD_CONSTANTS.LABEL_FONT_SIZE,
          fontWeight: 600,
          color: isSelected ? "#ffffff" : "#374151",
          cursor: artboard.locked
            ? "not-allowed"
            : isDragging
            ? "grabbing"
            : "grab",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>{artboard.name}</span>
          {hasOverflow && (
            <span
              title="Some boxes overflow artboard boundaries"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: isSelected ? "#ffffff" : "#f59e0b",
                color: isSelected ? "#f59e0b" : "#ffffff",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              !
            </span>
          )}
        </div>
        <span style={{ fontSize: "0.85em", opacity: 0.7, fontWeight: 500 }}>
          {artboard.width} × {artboard.height}
        </span>
      </div>
    </div>
  );
};
