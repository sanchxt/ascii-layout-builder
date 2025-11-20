import { useCallback } from "react";
import { useArtboardStore } from "../store/artboardStore";
import type { ArtboardPreset } from "@/types/artboard";
import type { CanvasPosition } from "@/types/canvas";

export const useArtboardCreation = () => {
  const addArtboard = useArtboardStore((state) => state.addArtboard);
  const addCustomArtboard = useArtboardStore(
    (state) => state.addCustomArtboard
  );
  const setActiveArtboard = useArtboardStore(
    (state) => state.setActiveArtboard
  );

  const createFromPreset = useCallback(
    (preset: ArtboardPreset, position?: CanvasPosition) => {
      const id = addArtboard(preset, position);
      setActiveArtboard(id);
      return id;
    },
    [addArtboard, setActiveArtboard]
  );

  const createCustom = useCallback(
    (width: number, height: number, position?: CanvasPosition) => {
      const id = addCustomArtboard(width, height, position);
      setActiveArtboard(id);
      return id;
    },
    [addCustomArtboard, setActiveArtboard]
  );

  const createMobile = useCallback(
    (position?: CanvasPosition) => {
      return createFromPreset("mobile", position);
    },
    [createFromPreset]
  );

  const createTablet = useCallback(
    (position?: CanvasPosition) => {
      return createFromPreset("tablet", position);
    },
    [createFromPreset]
  );

  const createDesktop = useCallback(
    (position?: CanvasPosition) => {
      return createFromPreset("desktop", position);
    },
    [createFromPreset]
  );

  return {
    createFromPreset,
    createCustom,
    createMobile,
    createTablet,
    createDesktop,
  };
};
