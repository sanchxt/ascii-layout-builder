import { type FC, useMemo } from "react";
import type { Artboard as ArtboardType } from "@/types/artboard";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useArtboardStore } from "../store/artboardStore";
import { useAnimationStore } from "@/features/animation/store/animationStore";
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
  const setActiveArtboard = useArtboardStore((state) => state.setActiveArtboard);
  const boxes = useBoxStore((state) => state.boxes);
  const clearBoxSelection = useBoxStore((state) => state.clearSelection);
  const clearLineSelection = useLineStore((state) => state.clearLineSelection);
  const isSpacebarPressed = useCanvasStore(
    (state) => state.interaction.isSpacebarPressed
  );
  const editorMode = useAnimationStore((s) => s.editorMode);
  const isPreviewMode = editorMode === "preview";

  const hasOverflow = useMemo(() => {
    const artboardBoxes = getBoxesInArtboard(artboard.id, boxes);
    return artboardBoxes.some((box) => getBoxOverflow(box, artboard) !== null);
  }, [artboard, boxes]);

  const handleArtboardClick = (e: React.MouseEvent) => {
    // Block interactions in preview mode
    if (isPreviewMode) {
      return;
    }

    const target = e.target as HTMLElement;
    const isArtboardFrame =
      target.hasAttribute("data-artboard-boundary") ||
      target.hasAttribute("data-artboard-label") ||
      target.closest("[data-artboard-label]") !== null;

    if (isArtboardFrame) {
      // Clear box/line selection when selecting artboard (unless shift is pressed)
      if (!e.shiftKey) {
        clearBoxSelection();
        clearLineSelection();
      }
      selectArtboard(artboard.id, e.shiftKey);
      // Also set as active artboard for Navigator/States context
      setActiveArtboard(artboard.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Block interactions in preview mode
    if (isPreviewMode) {
      return;
    }

    if (isSpacebarPressed) return;

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
      <div
        data-artboard-label
        className={cn(
          "absolute bottom-full left-0 mb-1 px-2 py-0.5 rounded-t-sm text-[10px] font-semibold tracking-wide transition-colors flex items-center gap-2 select-none",
          isSelected
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground group-hover:text-foreground"
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
            isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {artboard.width}×{artboard.height}
        </span>
        {hasOverflow && (
          <div
            className="w-1.5 h-1.5 rounded-full bg-canvas-warning"
            title="Content overflow"
          />
        )}
      </div>

      <div
        data-artboard-boundary
        className={cn(
          "absolute inset-0 bg-card transition-all",
          isSelected
            ? "ring-2 ring-primary shadow-lg shadow-primary/10"
            : "shadow-sm border border-border hover:border-muted-foreground/30",
          artboard.locked && "bg-muted/50"
        )}
        style={{
          cursor: artboard.locked
            ? "not-allowed"
            : isDragging
            ? "grabbing"
            : "default",
        }}
      >
        {artboard.locked && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(var(--border) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              opacity: 0.5,
            }}
          />
        )}
      </div>
    </div>
  );
};
