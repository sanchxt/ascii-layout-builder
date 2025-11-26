import { type FC, useMemo } from "react";
import type { Artboard as ArtboardType } from "@/types/artboard";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "../store/artboardStore";
import { getBoxesInArtboard, getBoxOverflow } from "../utils/artboardHelpers";
import { cn } from "@/lib/utils";

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

  if (!artboard.visible) return null;

  const displayX = dragPreviewPosition?.x ?? artboard.x;
  const displayY = dragPreviewPosition?.y ?? artboard.y;

  return (
    <div
      data-artboard-id={artboard.id}
      onClick={handleArtboardClick}
      onMouseDown={handleMouseDown}
      className="absolute pointer-events-auto group"
      style={{
        left: displayX,
        top: displayY,
        width: artboard.width,
        height: artboard.height,
        pointerEvents: artboard.locked ? "none" : "auto",
        opacity: artboard.locked ? 0.6 : isDragging ? 0.8 : 1,
        transition: isDragging ? "none" : "opacity 0.2s",
        zIndex: artboard.zIndex,
      }}
    >
      {/* Artboard Label */}
      <div
        data-artboard-label
        className={cn(
          "absolute bottom-full left-0 mb-1 px-2 py-0.5 rounded-t-sm text-[10px] font-semibold tracking-wide transition-colors flex items-center gap-2 select-none",
          isSelected
            ? "bg-blue-500 text-white shadow-sm"
            : "text-zinc-500 group-hover:text-zinc-800"
        )}
        style={{
          cursor: artboard.locked
            ? "not-allowed"
            : isDragging
            ? "grabbing"
            : "grab",
        }}
      >
        <span>{artboard.name}</span>
        <span
          className={cn(
            "font-normal opacity-70",
            isSelected ? "text-blue-100" : "text-zinc-400"
          )}
        >
          {artboard.width}×{artboard.height}
        </span>
        {hasOverflow && (
          <div
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
            title="Content overflow"
          />
        )}
      </div>

      {/* Artboard Surface */}
      <div
        data-artboard-boundary
        className={cn(
          "absolute inset-0 bg-white transition-all",
          isSelected
            ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/10"
            : "shadow-sm border border-zinc-200 hover:border-zinc-300",
          artboard.locked && "bg-zinc-50/50"
        )}
        style={{
          cursor: artboard.locked
            ? "not-allowed"
            : isDragging
            ? "grabbing"
            : "default",
        }}
      >
        {/* Grid/Pattern for empty artboards could go here */}
        {artboard.locked && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              opacity: 0.5,
            }}
          />
        )}
      </div>
    </div>
  );
};
