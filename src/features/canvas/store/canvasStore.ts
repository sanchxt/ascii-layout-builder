import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { CanvasState } from "@/types/canvas";
import { CANVAS_CONSTANTS, STORAGE_KEYS } from "@/lib/constants";

const initialState = {
  viewport: {
    position: { x: 0, y: 0 },
    zoom: CANVAS_CONSTANTS.DEFAULT_ZOOM,
    showGrid: true,
  },
  interaction: {
    isPanning: false,
    lastMousePosition: null,
    isSpacebarPressed: false,
    selectedTool: "select" as const,
    editingBoxId: null,
  },
};

export const useCanvasStore = create<CanvasState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setPan: (position) =>
          set(
            (state) => ({
              viewport: { ...state.viewport, position },
            }),
            false,
            "canvas/setPan"
          ),

        updatePan: (deltaX, deltaY) =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                position: {
                  x: state.viewport.position.x + deltaX,
                  y: state.viewport.position.y + deltaY,
                },
              },
            }),
            false,
            "canvas/updatePan"
          ),

        setZoom: (zoom) =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                zoom: Math.max(
                  CANVAS_CONSTANTS.MIN_ZOOM,
                  Math.min(CANVAS_CONSTANTS.MAX_ZOOM, zoom)
                ),
              },
            }),
            false,
            "canvas/setZoom"
          ),

        zoomIn: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                zoom: Math.min(
                  CANVAS_CONSTANTS.MAX_ZOOM,
                  state.viewport.zoom + CANVAS_CONSTANTS.ZOOM_STEP
                ),
              },
            }),
            false,
            "canvas/zoomIn"
          ),

        zoomOut: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                zoom: Math.max(
                  CANVAS_CONSTANTS.MIN_ZOOM,
                  state.viewport.zoom - CANVAS_CONSTANTS.ZOOM_STEP
                ),
              },
            }),
            false,
            "canvas/zoomOut"
          ),

        resetZoom: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                zoom: CANVAS_CONSTANTS.DEFAULT_ZOOM,
              },
            }),
            false,
            "canvas/resetZoom"
          ),

        toggleGrid: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                showGrid: !state.viewport.showGrid,
              },
            }),
            false,
            "canvas/toggleGrid"
          ),

        setIsPanning: (isPanning) =>
          set(
            (state) => ({
              interaction: { ...state.interaction, isPanning },
            }),
            false,
            "canvas/setIsPanning"
          ),

        setLastMousePosition: (lastMousePosition) =>
          set(
            (state) => ({
              interaction: { ...state.interaction, lastMousePosition },
            }),
            false,
            "canvas/setLastMousePosition"
          ),

        setIsSpacebarPressed: (isSpacebarPressed) =>
          set(
            (state) => ({
              interaction: { ...state.interaction, isSpacebarPressed },
            }),
            false,
            "canvas/setIsSpacebarPressed"
          ),

        setSelectedTool: (selectedTool) =>
          set(
            (state) => ({
              interaction: { ...state.interaction, selectedTool },
            }),
            false,
            "canvas/setSelectedTool"
          ),

        enterEditMode: (boxId) =>
          set(
            (state) => ({
              interaction: { ...state.interaction, editingBoxId: boxId },
            }),
            false,
            "canvas/enterEditMode"
          ),

        exitEditMode: () =>
          set(
            (state) => ({
              interaction: { ...state.interaction, editingBoxId: null },
            }),
            false,
            "canvas/exitEditMode"
          ),

        resetCanvas: () =>
          set(
            () => ({
              ...initialState,
            }),
            false,
            "canvas/resetCanvas"
          ),
      }),
      {
        name: STORAGE_KEYS.CANVAS_STATE,
        partialize: (state) => ({ viewport: state.viewport }),
      }
    ),
    { name: "CanvasStore" }
  )
);
