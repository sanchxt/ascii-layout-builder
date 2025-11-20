import { useState, useCallback, useRef } from "react";
import { useArtboardStore } from "../store/artboardStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";

export interface ArtboardDragState {
  isDragging: boolean;
  draggedArtboardIds: string[];
  initialPositions: Map<string, { x: number; y: number }>;
  startCanvasPos: { x: number; y: number };
  currentCanvasPos: { x: number; y: number };
}

export interface UseArtboardDragOptions {
  onDragStart?: (artboardIds: string[]) => void;
  onDragMove?: (artboardIds: string[], delta: { x: number; y: number }) => void;
  onDragEnd?: (
    artboardIds: string[],
    finalDelta: { x: number; y: number }
  ) => void;
}

export const useArtboardDrag = (options: UseArtboardDragOptions = {}) => {
  const { onDragStart, onDragMove, onDragEnd } = options;

  const artboards = useArtboardStore((state) => state.artboards);
  const selectedArtboardIds = useArtboardStore(
    (state) => state.selectedArtboardIds
  );
  const updateArtboard = useArtboardStore((state) => state.updateArtboard);
  const boxes = useBoxStore((state) => state.boxes);
  const updateBox = useBoxStore((state) => state.updateBox);

  const [dragState, setDragState] = useState<ArtboardDragState>({
    isDragging: false,
    draggedArtboardIds: [],
    initialPositions: new Map(),
    startCanvasPos: { x: 0, y: 0 },
    currentCanvasPos: { x: 0, y: 0 },
  });

  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const startDrag = useCallback(
    (artboardId: string, canvasX: number, canvasY: number) => {
      let artboardsToDrag: string[];

      if (selectedArtboardIds.includes(artboardId)) {
        artboardsToDrag = selectedArtboardIds;
      } else {
        artboardsToDrag = [artboardId];
      }

      const initialPositions = new Map<string, { x: number; y: number }>();
      artboardsToDrag.forEach((id) => {
        const artboard = artboards.find((ab) => ab.id === id);
        if (artboard) {
          initialPositions.set(id, { x: artboard.x, y: artboard.y });
        }
      });

      const newDragState: ArtboardDragState = {
        isDragging: true,
        draggedArtboardIds: artboardsToDrag,
        initialPositions,
        startCanvasPos: { x: canvasX, y: canvasY },
        currentCanvasPos: { x: canvasX, y: canvasY },
      };

      setDragState(newDragState);

      if (onDragStart) {
        onDragStart(artboardsToDrag);
      }
    },
    [artboards, selectedArtboardIds, onDragStart]
  );

  const updateDrag = useCallback(
    (canvasX: number, canvasY: number) => {
      if (!dragStateRef.current.isDragging) return;

      const delta = {
        x: canvasX - dragStateRef.current.startCanvasPos.x,
        y: canvasY - dragStateRef.current.startCanvasPos.y,
      };

      setDragState((prev) => ({
        ...prev,
        currentCanvasPos: { x: canvasX, y: canvasY },
      }));

      if (onDragMove) {
        onDragMove(dragStateRef.current.draggedArtboardIds, delta);
      }
    },
    [onDragMove]
  );

  const endDrag = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;

    const { draggedArtboardIds, startCanvasPos, currentCanvasPos } =
      dragStateRef.current;

    const finalDelta = {
      x: currentCanvasPos.x - startCanvasPos.x,
      y: currentCanvasPos.y - startCanvasPos.y,
    };

    draggedArtboardIds.forEach((artboardId) => {
      const initialPos = dragStateRef.current.initialPositions.get(artboardId);
      if (!initialPos) return;

      const newX = initialPos.x + finalDelta.x;
      const newY = initialPos.y + finalDelta.y;

      updateArtboard(artboardId, { x: newX, y: newY });

      const artboardBoxes = boxes.filter(
        (box) => box.artboardId === artboardId
      );
      artboardBoxes.forEach((box) => {
        updateBox(box.id, {
          x: box.x + finalDelta.x,
          y: box.y + finalDelta.y,
        });
      });
    });

    if (onDragEnd) {
      onDragEnd(draggedArtboardIds, finalDelta);
    }

    setDragState({
      isDragging: false,
      draggedArtboardIds: [],
      initialPositions: new Map(),
      startCanvasPos: { x: 0, y: 0 },
      currentCanvasPos: { x: 0, y: 0 },
    });
  }, [onDragEnd, updateArtboard, boxes, updateBox]);

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedArtboardIds: [],
      initialPositions: new Map(),
      startCanvasPos: { x: 0, y: 0 },
      currentCanvasPos: { x: 0, y: 0 },
    });
  }, []);

  const getCurrentDelta = useCallback((): { x: number; y: number } => {
    if (!dragState.isDragging) return { x: 0, y: 0 };

    return {
      x: dragState.currentCanvasPos.x - dragState.startCanvasPos.x,
      y: dragState.currentCanvasPos.y - dragState.startCanvasPos.y,
    };
  }, [dragState]);

  const getArtboardPreviewPosition = useCallback(
    (artboardId: string): { x: number; y: number } | null => {
      if (
        !dragState.isDragging ||
        !dragState.draggedArtboardIds.includes(artboardId)
      ) {
        return null;
      }

      const initialPos = dragState.initialPositions.get(artboardId);
      if (!initialPos) return null;

      const delta = getCurrentDelta();

      return {
        x: initialPos.x + delta.x,
        y: initialPos.y + delta.y,
      };
    },
    [dragState, getCurrentDelta]
  );

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    getCurrentDelta,
    getArtboardPreviewPosition,
    isDragging: dragState.isDragging,
    initialPositions: dragState.initialPositions,
  };
};
