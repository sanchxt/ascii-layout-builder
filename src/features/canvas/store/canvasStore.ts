import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { CanvasState } from "@/types/canvas";
import { CANVAS_CONSTANTS, STORAGE_KEYS } from "@/lib/constants";

const initialState = {
  viewport: {
    position: { x: 0, y: 0 },
    zoom: CANVAS_CONSTANTS.DEFAULT_ZOOM,
    showGrid: true,
    snapToGrid: false,
    showSmartGuides: true,
  },
  interaction: {
    isPanning: false,
    lastMousePosition: null,
    isSpacebarPressed: false,
    selectedTool: "select" as const,
    editingBoxId: null,
    selectionRect: null,
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

        toggleSnapToGrid: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                snapToGrid: !state.viewport.snapToGrid,
              },
            }),
            false,
            "canvas/toggleSnapToGrid"
          ),

        toggleSmartGuides: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                showSmartGuides: !state.viewport.showSmartGuides,
              },
            }),
            false,
            "canvas/toggleSmartGuides"
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

        startSelectionRect: (startX, startY) =>
          set(
            (state) => ({
              interaction: {
                ...state.interaction,
                selectionRect: { startX, startY, endX: startX, endY: startY },
              },
            }),
            false,
            "canvas/startSelectionRect"
          ),

        updateSelectionRect: (endX, endY) =>
          set(
            (state) => {
              if (!state.interaction.selectionRect) return state;
              return {
                interaction: {
                  ...state.interaction,
                  selectionRect: {
                    ...state.interaction.selectionRect,
                    endX,
                    endY,
                  },
                },
              };
            },
            false,
            "canvas/updateSelectionRect"
          ),

        clearSelectionRect: () =>
          set(
            (state) => ({
              interaction: { ...state.interaction, selectionRect: null },
            }),
            false,
            "canvas/clearSelectionRect"
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
