import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Artboard, ArtboardPreset } from "@/types/artboard";
import { STORAGE_KEYS, ARTBOARD_CONSTANTS } from "@/lib/constants";
import { getPresetDimensions } from "../utils/artboardPresets";

export interface ArtboardState {
  artboards: Artboard[];
  activeArtboardId: string | null;
  selectedArtboardIds: string[];

  addArtboard: (
    preset: ArtboardPreset,
    position?: { x: number; y: number }
  ) => string;
  addCustomArtboard: (
    width: number,
    height: number,
    position?: { x: number; y: number }
  ) => string;
  updateArtboard: (id: string, updates: Partial<Artboard>) => void;
  deleteArtboard: (id: string) => void;
  deleteArtboards: (ids: string[]) => void;
  selectArtboard: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setActiveArtboard: (id: string | null) => void;
  getArtboard: (id: string) => Artboard | undefined;
  getSelectedArtboards: () => Artboard[];
  getActiveArtboard: () => Artboard | undefined;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  updateName: (id: string, name: string) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateDimensions: (id: string, width: number, height: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  resetArtboards: () => void;
}

let recordSnapshotFn: (() => void) | null = null;
export const setArtboardRecordSnapshotFn = (fn: () => void) => {
  recordSnapshotFn = fn;
};
const recordSnapshot = () => {
  if (recordSnapshotFn) recordSnapshotFn();
};

function generateArtboardName(
  preset: ArtboardPreset,
  existingArtboards: Artboard[]
): string {
  const baseName =
    preset === "mobile"
      ? "Mobile"
      : preset === "tablet"
      ? "Tablet"
      : preset === "desktop"
      ? "Desktop"
      : "Artboard";

  const existingNames = existingArtboards.map((a) => a.name);
  let counter = 1;
  let name = baseName;

  while (existingNames.includes(name)) {
    name = `${baseName} ${counter}`;
    counter++;
  }

  return name;
}

function calculateAutoPosition(existingArtboards: Artboard[]): {
  x: number;
  y: number;
} {
  if (existingArtboards.length === 0) {
    return {
      x: ARTBOARD_CONSTANTS.DEFAULT_X,
      y: ARTBOARD_CONSTANTS.DEFAULT_Y,
    };
  }

  const lastArtboard = existingArtboards[existingArtboards.length - 1];
  return {
    x: lastArtboard.x + lastArtboard.width + ARTBOARD_CONSTANTS.SPACING,
    y: lastArtboard.y,
  };
}

function getMaxZIndex(artboards: Artboard[]): number {
  if (artboards.length === 0) return 0;
  return Math.max(...artboards.map((a) => a.zIndex));
}

const initialState = {
  artboards: [] as Artboard[],
  activeArtboardId: null as string | null,
  selectedArtboardIds: [] as string[],
};

export const useArtboardStore = create<ArtboardState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addArtboard: (
          preset: ArtboardPreset,
          position?: { x: number; y: number }
        ) => {
          recordSnapshot();
          const id = crypto.randomUUID();
          const dimensions = getPresetDimensions(preset);
          const autoPosition =
            position || calculateAutoPosition(get().artboards);
          const now = Date.now();

          const newArtboard: Artboard = {
            id,
            name: generateArtboardName(preset, get().artboards),
            x: autoPosition.x,
            y: autoPosition.y,
            width: dimensions.width,
            height: dimensions.height,
            preset,
            visible: true,
            locked: false,
            zIndex: getMaxZIndex(get().artboards) + 1,
            createdAt: now,
            updatedAt: now,
          };

          set(
            (state) => ({
              artboards: [...state.artboards, newArtboard],
              activeArtboardId: state.activeArtboardId || newArtboard.id,
            }),
            false,
            "artboard/addArtboard"
          );

          return id;
        },

        addCustomArtboard: (width, height, position) => {
          recordSnapshot();
          const id = crypto.randomUUID();
          const autoPosition =
            position || calculateAutoPosition(get().artboards);
          const now = Date.now();

          const newArtboard: Artboard = {
            id,
            name: generateArtboardName("custom", get().artboards),
            x: autoPosition.x,
            y: autoPosition.y,
            width,
            height,
            preset: "custom",
            visible: true,
            locked: false,
            zIndex: getMaxZIndex(get().artboards) + 1,
            createdAt: now,
            updatedAt: now,
          };

          set(
            (state) => ({
              artboards: [...state.artboards, newArtboard],
              activeArtboardId: state.activeArtboardId || newArtboard.id,
            }),
            false,
            "artboard/addCustomArtboard"
          );

          return id;
        },

        updateArtboard: (id, updates) => {
          recordSnapshot();
          set(
            (state) => ({
              artboards: state.artboards.map((artboard) =>
                artboard.id === id
                  ? { ...artboard, ...updates, updatedAt: Date.now() }
                  : artboard
              ),
            }),
            false,
            "artboard/updateArtboard"
          );
        },

        deleteArtboard: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const filtered = state.artboards.filter((a) => a.id !== id);
              return {
                artboards: filtered,
                selectedArtboardIds: state.selectedArtboardIds.filter(
                  (artboardId) => artboardId !== id
                ),
                activeArtboardId:
                  state.activeArtboardId === id
                    ? filtered.length > 0
                      ? filtered[0].id
                      : null
                    : state.activeArtboardId,
              };
            },
            false,
            "artboard/deleteArtboard"
          );
        },

        deleteArtboards: (ids) => {
          recordSnapshot();
          set(
            (state) => {
              const idsSet = new Set(ids);
              const filtered = state.artboards.filter((a) => !idsSet.has(a.id));
              const wasActiveDeleted =
                state.activeArtboardId && idsSet.has(state.activeArtboardId);

              return {
                artboards: filtered,
                selectedArtboardIds: state.selectedArtboardIds.filter(
                  (artboardId) => !idsSet.has(artboardId)
                ),
                activeArtboardId: wasActiveDeleted
                  ? filtered.length > 0
                    ? filtered[0].id
                    : null
                  : state.activeArtboardId,
              };
            },
            false,
            "artboard/deleteArtboards"
          );
        },

        selectArtboard: (id, multi = false) =>
          set(
            (state) => {
              if (multi) {
                const isSelected = state.selectedArtboardIds.includes(id);
                return {
                  selectedArtboardIds: isSelected
                    ? state.selectedArtboardIds.filter(
                        (artboardId) => artboardId !== id
                      )
                    : [...state.selectedArtboardIds, id],
                };
              }

              return { selectedArtboardIds: [id] };
            },
            false,
            "artboard/selectArtboard"
          ),

        clearSelection: () =>
          set({ selectedArtboardIds: [] }, false, "artboard/clearSelection"),

        selectAll: () =>
          set(
            (state) => ({
              selectedArtboardIds: state.artboards.map((a) => a.id),
            }),
            false,
            "artboard/selectAll"
          ),

        setActiveArtboard: (id) =>
          set({ activeArtboardId: id }, false, "artboard/setActiveArtboard"),

        getArtboard: (id) => {
          return get().artboards.find((a) => a.id === id);
        },

        getSelectedArtboards: () => {
          const state = get();
          return state.artboards.filter((a) =>
            state.selectedArtboardIds.includes(a.id)
          );
        },

        getActiveArtboard: () => {
          const state = get();
          if (!state.activeArtboardId) return undefined;
          return state.artboards.find((a) => a.id === state.activeArtboardId);
        },

        toggleVisibility: (id) => {
          recordSnapshot();
          set(
            (state) => ({
              artboards: state.artboards.map((artboard) =>
                artboard.id === id
                  ? {
                      ...artboard,
                      visible: !artboard.visible,
                      updatedAt: Date.now(),
                    }
                  : artboard
              ),
            }),
            false,
            "artboard/toggleVisibility"
          );
        },

        toggleLock: (id) => {
          recordSnapshot();
          set(
            (state) => ({
              artboards: state.artboards.map((artboard) =>
                artboard.id === id
                  ? {
                      ...artboard,
                      locked: !artboard.locked,
                      updatedAt: Date.now(),
                    }
                  : artboard
              ),
            }),
            false,
            "artboard/toggleLock"
          );
        },

        updateName: (id, name) => {
          recordSnapshot();
          set(
            (state) => ({
              artboards: state.artboards.map((artboard) =>
                artboard.id === id
                  ? { ...artboard, name, updatedAt: Date.now() }
                  : artboard
              ),
            }),
            false,
            "artboard/updateName"
          );
        },

        updatePosition: (id, x, y) => {
          recordSnapshot();
          set(
            (state) => ({
              artboards: state.artboards.map((artboard) =>
                artboard.id === id
                  ? { ...artboard, x, y, updatedAt: Date.now() }
                  : artboard
              ),
            }),
            false,
            "artboard/updatePosition"
          );
        },

        updateDimensions: (id, width, height) => {
          recordSnapshot();
          set(
            (state) => ({
              artboards: state.artboards.map((artboard) =>
                artboard.id === id
                  ? {
                      ...artboard,
                      width,
                      height,
                      preset: "custom",
                      updatedAt: Date.now(),
                    }
                  : artboard
              ),
            }),
            false,
            "artboard/updateDimensions"
          );
        },

        bringToFront: (id) => {
          recordSnapshot();
          const maxZ = getMaxZIndex(get().artboards);
          set(
            (state) => ({
              artboards: state.artboards.map((artboard) =>
                artboard.id === id
                  ? { ...artboard, zIndex: maxZ + 1, updatedAt: Date.now() }
                  : artboard
              ),
            }),
            false,
            "artboard/bringToFront"
          );
        },

        sendToBack: (id) => {
          recordSnapshot();
          set(
            (state) => ({
              artboards: state.artboards.map((artboard) =>
                artboard.id === id
                  ? { ...artboard, zIndex: 0, updatedAt: Date.now() }
                  : artboard
              ),
            }),
            false,
            "artboard/sendToBack"
          );
        },

        resetArtboards: () =>
          set(initialState, false, "artboard/resetArtboards"),
      }),
      {
        name: STORAGE_KEYS.ARTBOARD_STATE,
        partialize: (state) => ({
          artboards: state.artboards,
          activeArtboardId: state.activeArtboardId,
        }),
      }
    )
  )
);
