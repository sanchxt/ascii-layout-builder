import { useMemo } from "react";
import { useArtboardStore } from "../store/artboardStore";
import { findArtboardAtPoint } from "../utils/artboardHelpers";

export interface ArtboardDropZoneState {
  potentialArtboardId: string | null;
  isValidDropZone: boolean;
  validationMessage?: string;
}

interface UseArtboardDropZoneOptions {
  draggedBoxIds: string[];
  currentMousePos: { x: number; y: number };
  isDragging: boolean;
}

export const useArtboardDropZone = ({
  draggedBoxIds,
  currentMousePos,
  isDragging,
}: UseArtboardDropZoneOptions): ArtboardDropZoneState => {
  const artboards = useArtboardStore((state) => state.artboards);

  return useMemo(() => {
    if (!isDragging || draggedBoxIds.length === 0) {
      return {
        potentialArtboardId: null,
        isValidDropZone: false,
      };
    }

    const targetArtboard = findArtboardAtPoint(currentMousePos, artboards);

    if (!targetArtboard) {
      return {
        potentialArtboardId: null,
        isValidDropZone: false,
      };
    }

    if (targetArtboard.locked) {
      return {
        potentialArtboardId: targetArtboard.id,
        isValidDropZone: false,
        validationMessage: "Artboard is locked",
      };
    }

    return {
      potentialArtboardId: targetArtboard.id,
      isValidDropZone: true,
      validationMessage: `Attach to ${targetArtboard.name}`,
    };
  }, [isDragging, draggedBoxIds.length, currentMousePos, artboards]);
};
