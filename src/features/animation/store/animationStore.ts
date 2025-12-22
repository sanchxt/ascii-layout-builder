import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  AnimationState,
  AnimationStateElement,
  AnimationTrigger,
  AnimationTriggerType,
  TimeBasedTrigger,
  EditorMode,
  EnterExitType,
} from "../types/animation";
import type {
  StateTransition,
  PlaybackState,
  ElementTransition,
} from "../types/transition";
import {
  DEFAULT_PLAYBACK_STATE,
  createDefaultTransition,
} from "../types/transition";
import type {
  AnimationInheritanceMode,
  CascadeConfig,
  CascadePresetType,
  ElementAnimationTiming,
  LayoutSnapshot,
} from "../types/cascade";
import {
  DEFAULT_CASCADE_CONFIG,
  applyCascadePreset,
} from "../types/cascade";
import type {
  AnimationChain,
  ChainStep,
  ChainPlaybackState,
  ChainPlaybackMode,
} from "../types/chain";
import {
  DEFAULT_CHAIN_PLAYBACK_STATE,
  createChain,
  createChainStep,
} from "../types/chain";
import { STORAGE_KEYS, ANIMATION_CONSTANTS } from "@/lib/constants";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { calculateLayout } from "@/features/layout-system/lib/layoutEngine";
import type { Box } from "@/types/box";

// Snapshot recording for undo/redo integration
let recordSnapshotFn: (() => void) | null = null;
export const setAnimationRecordSnapshotFn = (fn: () => void) => {
  recordSnapshotFn = fn;
};
const recordSnapshot = () => {
  if (recordSnapshotFn) recordSnapshotFn();
};

/**
 * Preview mode state for interactive trigger testing
 */
export interface PreviewModeState {
  /** Whether preview mode is currently active */
  isActive: boolean;
  /** Currently hovered element ID (for hover triggers) */
  hoveredElementId: string | null;
  /** State ID that was triggered by interaction */
  activeTriggeredStateId: string | null;
  /** Timestamp when trigger was activated (for auto-reset) */
  triggerActivatedAt: number | null;
  /** Whether to show connection lines between triggers and states */
  showConnectionLines: boolean;
}

const DEFAULT_PREVIEW_MODE_STATE: PreviewModeState = {
  isActive: false,
  hoveredElementId: null,
  activeTriggeredStateId: null,
  triggerActivatedAt: null,
  showConnectionLines: false,
};

export interface AnimationStoreState {
  // Data (persisted)
  states: AnimationState[];
  transitions: StateTransition[];
  chains: AnimationChain[];

  // UI State (not persisted)
  editorMode: EditorMode;
  activeStateId: string | null;
  selectedStateIds: string[];
  selectedTransitionId: string | null;
  selectedChainId: string | null;
  playback: PlaybackState;
  chainPlayback: ChainPlaybackState;
  // Interpolated elements during playback (elementId -> element)
  interpolatedElements: Record<string, AnimationStateElement>;
  // Preview mode state
  previewMode: PreviewModeState;

  // Actions - Mode
  setEditorMode: (mode: EditorMode) => void;

  // Actions - State CRUD
  createState: (artboardId: string, name?: string) => string;
  createStateFromCurrentLayout: (artboardId: string, name?: string) => string;
  updateState: (id: string, updates: Partial<AnimationState>) => void;
  deleteState: (id: string) => void;
  duplicateState: (id: string) => string | null;

  // Actions - State Selection
  selectState: (id: string) => void;
  clearStateSelection: () => void;
  setActiveState: (id: string | null) => void;
  clearActiveState: () => void;

  // Actions - State Sync
  syncStateFromLayout: (stateId: string) => void;
  syncAllStatesFromLayout: (artboardId: string) => void;

  // Actions - State Elements
  updateStateElement: (
    stateId: string,
    elementId: string,
    updates: Partial<AnimationStateElement>
  ) => void;
  addElementToState: (stateId: string, element: AnimationStateElement) => void;
  removeElementFromState: (stateId: string, elementId: string) => void;

  // Actions - Reordering
  reorderState: (id: string, newOrder: number) => void;

  // Actions - Transition CRUD
  createTransition: (fromStateId: string, toStateId: string) => string;
  updateTransition: (
    id: string,
    updates: Partial<Omit<StateTransition, "id" | "createdAt">>
  ) => void;
  deleteTransition: (id: string) => void;
  duplicateTransition: (id: string) => string | null;

  // Actions - Element Transition Overrides
  updateElementTransition: (
    transitionId: string,
    elementId: string,
    updates: Partial<ElementTransition>
  ) => void;
  removeElementOverride: (transitionId: string, elementId: string) => void;
  addElementOverride: (
    transitionId: string,
    elementOverride: ElementTransition
  ) => void;

  // Actions - Transition Selection
  selectTransition: (id: string | null) => void;

  // Actions - Playback
  setPlaybackState: (updates: Partial<PlaybackState>) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleLoop: () => void;
  setInterpolatedElements: (
    elements: Record<string, AnimationStateElement>
  ) => void;
  clearInterpolatedElements: () => void;

  // Actions - Chain CRUD
  createChain: (artboardId: string, startStateId: string, name?: string) => string;
  updateChain: (id: string, updates: Partial<Omit<AnimationChain, "id" | "createdAt">>) => void;
  deleteChain: (id: string) => void;
  duplicateChain: (id: string) => string | null;
  selectChain: (id: string | null) => void;

  // Actions - Chain Steps
  addChainStep: (chainId: string, stateId: string, afterStepId?: string) => string;
  updateChainStep: (chainId: string, stepId: string, updates: Partial<Omit<ChainStep, "id">>) => void;
  removeChainStep: (chainId: string, stepId: string) => void;
  reorderChainSteps: (chainId: string, stepIds: string[]) => void;

  // Actions - Chain Playback
  playChain: (chainId: string) => void;
  pauseChain: () => void;
  stopChain: () => void;
  setChainPlaybackState: (updates: Partial<ChainPlaybackState>) => void;

  // Selectors - Chains
  getChain: (id: string) => AnimationChain | undefined;
  getChainsForArtboard: (artboardId: string) => AnimationChain[];

  // Actions - Import/Export
  exportAnimationData: (artboardId: string) => {
    states: AnimationState[];
    transitions: StateTransition[];
    chains: AnimationChain[];
  };
  importAnimationData: (
    artboardId: string,
    states: AnimationState[],
    transitions: StateTransition[],
    mode: "replace" | "merge",
    chains?: AnimationChain[]
  ) => { statesImported: number; transitionsImported: number; chainsImported: number };

  // Actions - Presets
  applyPresetToElement: (
    stateId: string,
    elementId: string,
    presetProperties: Partial<AnimationStateElement>,
    applyTo: "current"
  ) => void;

  // Actions - Enter/Exit
  setElementEnterExit: (
    stateId: string,
    elementId: string,
    type: EnterExitType
  ) => void;

  // Actions - Stagger
  applyStaggerToSelection: (
    transitionId: string,
    elementIds: string[],
    staggerDelay: number
  ) => void;

  // Actions - Cascade (Phase 2: Hierarchical Animations)
  updateElementInheritance: (
    stateId: string,
    elementId: string,
    mode: AnimationInheritanceMode
  ) => void;
  updateElementTiming: (
    stateId: string,
    elementId: string,
    timing: ElementAnimationTiming | null
  ) => void;
  updateTransitionCascade: (
    transitionId: string,
    cascade: Partial<CascadeConfig>
  ) => void;
  applyTransitionCascadePreset: (
    transitionId: string,
    presetId: CascadePresetType
  ) => void;

  // Actions - Hold Time
  updateStateHoldTime: (stateId: string, holdTime: number) => void;

  // Actions - Triggers
  updateStateTrigger: (stateId: string, trigger: AnimationTrigger) => void;
  setStateTriggerType: (stateId: string, type: AnimationTriggerType) => void;
  setStateTriggerElement: (
    stateId: string,
    elementId: string,
    elementName?: string
  ) => void;
  setStateTriggerTiming: (stateId: string, timing: TimeBasedTrigger) => void;
  clearStateTriggerElement: (stateId: string) => void;
  clearStateTriggerTiming: (stateId: string) => void;

  // Actions - Preview Mode
  enterPreviewMode: () => void;
  exitPreviewMode: () => void;
  setPreviewHoveredElement: (elementId: string | null) => void;
  triggerPreviewState: (stateId: string) => void;
  resetPreviewState: () => void;
  toggleConnectionLines: () => void;

  // Selectors
  getState: (id: string) => AnimationState | undefined;
  getStatesForArtboard: (artboardId: string) => AnimationState[];
  getActiveState: () => AnimationState | undefined;
  getTransition: (id: string) => StateTransition | undefined;
  getTransitionsForArtboard: (artboardId: string) => StateTransition[];
  getTransitionBetweenStates: (
    fromId: string,
    toId: string
  ) => StateTransition | undefined;

  // Reset
  resetAnimationStore: () => void;
}

const initialState = {
  states: [] as AnimationState[],
  transitions: [] as StateTransition[],
  chains: [] as AnimationChain[],
  editorMode: "layout" as EditorMode,
  activeStateId: null as string | null,
  selectedStateIds: [] as string[],
  selectedTransitionId: null as string | null,
  selectedChainId: null as string | null,
  playback: { ...DEFAULT_PLAYBACK_STATE } as PlaybackState,
  chainPlayback: { ...DEFAULT_CHAIN_PLAYBACK_STATE } as ChainPlaybackState,
  interpolatedElements: {} as Record<string, AnimationStateElement>,
  previewMode: { ...DEFAULT_PREVIEW_MODE_STATE } as PreviewModeState,
};

export const useAnimationStore = create<AnimationStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Mode toggle
        setEditorMode: (mode) =>
          set(
            (state) => ({
              editorMode: mode,
              // When entering preview mode, activate previewMode.isActive
              // When leaving preview mode, reset previewMode to defaults
              previewMode:
                mode === "preview"
                  ? { ...state.previewMode, isActive: true }
                  : { ...DEFAULT_PREVIEW_MODE_STATE },
            }),
            false,
            "animation/setEditorMode"
          ),

        // Create empty state
        createState: (artboardId, name) => {
          const id = crypto.randomUUID();
          const existingStates = get().states.filter(
            (s) => s.artboardId === artboardId
          );
          const isFirstState = existingStates.length === 0;
          const order = existingStates.length;

          const stateName =
            name ||
            (isFirstState
              ? ANIMATION_CONSTANTS.DEFAULT_FIRST_STATE_NAME
              : `State ${order + 1}`);

          const newState: AnimationState = {
            id,
            name: stateName,
            artboardId,
            trigger: {
              type: isFirstState ? "initial" : "click",
            },
            order,
            elements: [],
            holdTime: ANIMATION_CONSTANTS.DEFAULT_HOLD_TIME,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          recordSnapshot();
          set(
            (state) => ({
              states: [...state.states, newState],
              activeStateId: id,
            }),
            false,
            "animation/createState"
          );

          return id;
        },

        // Create state from current layout (snapshot boxes)
        createStateFromCurrentLayout: (artboardId, name) => {
          const id = crypto.randomUUID();
          const boxes = useBoxStore.getState().boxes;

          // Get boxes that belong to this artboard
          const artboardBoxes = boxes.filter(
            (box) => box.artboardId === artboardId
          );

          // Helper to create layout snapshot from box's layout config
          // Includes computed child positions for smooth animation interpolation
          const createLayoutSnapshot = (
            box: Box,
            allBoxes: Box[]
          ): LayoutSnapshot | undefined => {
            const layout = box.layout;
            if (!layout || layout.type === "none") {
              return undefined;
            }

            // Get children for this box
            const children = allBoxes.filter((b) => b.parentId === box.id);

            // Calculate child positions using the layout engine
            let childPositions: LayoutSnapshot["childPositions"] = undefined;
            if (children.length > 0) {
              const result = calculateLayout(box, children, layout);
              childPositions = result.positions;
            }

            if (layout.type === "flex") {
              return {
                type: "flex",
                direction: layout.direction,
                gap: layout.gap,
                alignItems: layout.alignItems,
                justifyContent: layout.justifyContent,
                wrap: layout.wrap,
                childPositions,
              };
            }
            if (layout.type === "grid") {
              return {
                type: "grid",
                gap: layout.gap,
                alignItems: layout.alignItems,
                columns: layout.columns,
                rows: layout.rows,
                columnGap: layout.columnGap,
                rowGap: layout.rowGap,
                childPositions,
              };
            }
            return undefined;
          };

          // Convert boxes to animation state elements
          const elements: AnimationStateElement[] = artboardBoxes.map(
            (box) => ({
              elementId: box.id,
              elementName: box.name || `Box-${box.id.slice(0, 4)}`,
              parentId: box.parentId,
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              opacity: 1,
              scale: 1,
              rotation: 0,
              visible: box.visible !== false,
              // Phase 2: Set inheritance mode based on hierarchy
              inheritanceMode: box.parentId ? "relative" : "independent",
              timing: null,
              layoutSnapshot: createLayoutSnapshot(box, artboardBoxes),
            })
          );

          const existingStates = get().states.filter(
            (s) => s.artboardId === artboardId
          );
          const isFirstState = existingStates.length === 0;
          const order = existingStates.length;

          const stateName =
            name ||
            (isFirstState
              ? ANIMATION_CONSTANTS.DEFAULT_FIRST_STATE_NAME
              : `State ${order + 1}`);

          const newState: AnimationState = {
            id,
            name: stateName,
            artboardId,
            trigger: {
              type: isFirstState ? "initial" : "click",
            },
            order,
            elements,
            holdTime: ANIMATION_CONSTANTS.DEFAULT_HOLD_TIME,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          recordSnapshot();
          set(
            (state) => ({
              states: [...state.states, newState],
              activeStateId: id,
            }),
            false,
            "animation/createStateFromCurrentLayout"
          );

          return id;
        },

        // Update state
        updateState: (id, updates) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) =>
                s.id === id
                  ? { ...s, ...updates, updatedAt: Date.now() }
                  : s
              ),
            }),
            false,
            "animation/updateState"
          );
        },

        // Delete state
        deleteState: (id) => {
          recordSnapshot();
          set(
            (state) => {
              const stateToDelete = state.states.find((s) => s.id === id);
              if (!stateToDelete) return state;

              const filteredStates = state.states.filter((s) => s.id !== id);

              // Reorder remaining states for same artboard
              const reorderedStates = filteredStates.map((s) => {
                if (
                  s.artboardId === stateToDelete.artboardId &&
                  s.order > stateToDelete.order
                ) {
                  return { ...s, order: s.order - 1 };
                }
                return s;
              });

              return {
                states: reorderedStates,
                activeStateId:
                  state.activeStateId === id ? null : state.activeStateId,
                selectedStateIds: state.selectedStateIds.filter(
                  (sid) => sid !== id
                ),
              };
            },
            false,
            "animation/deleteState"
          );
        },

        // Duplicate state
        duplicateState: (id) => {
          const stateToDuplicate = get().states.find((s) => s.id === id);
          if (!stateToDuplicate) return null;

          const newId = crypto.randomUUID();
          const existingStates = get().states.filter(
            (s) => s.artboardId === stateToDuplicate.artboardId
          );

          const newState: AnimationState = {
            ...stateToDuplicate,
            id: newId,
            name: `${stateToDuplicate.name} copy`,
            order: existingStates.length,
            trigger: { type: "click" }, // Duplicated states default to click trigger
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          recordSnapshot();
          set(
            (state) => ({
              states: [...state.states, newState],
              activeStateId: newId,
            }),
            false,
            "animation/duplicateState"
          );

          return newId;
        },

        // Select state
        selectState: (id) =>
          set(
            () => ({
              selectedStateIds: [id],
              activeStateId: id,
            }),
            false,
            "animation/selectState"
          ),

        // Clear selection
        clearStateSelection: () =>
          set(
            () => ({
              selectedStateIds: [],
              activeStateId: null,
            }),
            false,
            "animation/clearStateSelection"
          ),

        // Set active state
        setActiveState: (id) =>
          set(
            () => ({
              activeStateId: id,
            }),
            false,
            "animation/setActiveState"
          ),

        // Clear active state (exit state editing)
        clearActiveState: () =>
          set(
            () => ({
              activeStateId: null,
              selectedStateIds: [],
            }),
            false,
            "animation/clearActiveState"
          ),

        // Sync state from current layout (reset state positions to match boxes)
        syncStateFromLayout: (stateId) => {
          const state = get().states.find((s) => s.id === stateId);
          if (!state) return;

          const boxes = useBoxStore.getState().boxes;
          const artboardBoxes = boxes.filter(
            (box) => box.artboardId === state.artboardId
          );

          // Helper to create layout snapshot (mirrors the one in createStateFromCurrentLayout)
          const createLayoutSnapshot = (
            box: Box,
            allBoxes: Box[]
          ): LayoutSnapshot | undefined => {
            const layout = box.layout;
            if (!layout || layout.type === "none") {
              return undefined;
            }

            const children = allBoxes.filter((b) => b.parentId === box.id);
            let childPositions: LayoutSnapshot["childPositions"] = undefined;
            if (children.length > 0) {
              const result = calculateLayout(box, children, layout);
              childPositions = result.positions;
            }

            if (layout.type === "flex") {
              return {
                type: "flex",
                direction: layout.direction,
                gap: layout.gap,
                alignItems: layout.alignItems,
                justifyContent: layout.justifyContent,
                wrap: layout.wrap,
                childPositions,
              };
            }
            if (layout.type === "grid") {
              return {
                type: "grid",
                gap: layout.gap,
                alignItems: layout.alignItems,
                columns: layout.columns,
                rows: layout.rows,
                columnGap: layout.columnGap,
                rowGap: layout.rowGap,
                childPositions,
              };
            }
            return undefined;
          };

          // Update each element in the state to match current box positions
          const updatedElements: AnimationStateElement[] = state.elements.map(
            (el) => {
              const box = artboardBoxes.find((b) => b.id === el.elementId);
              if (!box) return el;
              return {
                ...el,
                parentId: box.parentId,
                x: box.x,
                y: box.y,
                visible: box.visible !== false,
                layoutSnapshot: createLayoutSnapshot(box, artboardBoxes),
              };
            }
          );

          // Add any new boxes that aren't in the state yet
          const existingIds = new Set(state.elements.map((el) => el.elementId));
          const newElements = artboardBoxes
            .filter((box) => !existingIds.has(box.id))
            .map((box) => ({
              elementId: box.id,
              elementName: box.name || `Box-${box.id.slice(0, 4)}`,
              parentId: box.parentId,
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              opacity: 1,
              scale: 1,
              rotation: 0,
              visible: box.visible !== false,
              // Phase 2: Set inheritance mode based on hierarchy
              inheritanceMode: box.parentId
                ? ("relative" as const)
                : ("independent" as const),
              timing: null,
              layoutSnapshot: createLayoutSnapshot(box, artboardBoxes),
            }));

          recordSnapshot();
          set(
            (s) => ({
              states: s.states.map((st) =>
                st.id === stateId
                  ? {
                      ...st,
                      elements: [...updatedElements, ...newElements],
                      updatedAt: Date.now(),
                    }
                  : st
              ),
            }),
            false,
            "animation/syncStateFromLayout"
          );
        },

        // Sync all states for an artboard from current layout
        syncAllStatesFromLayout: (artboardId) => {
          const artboardStates = get().states.filter(
            (s) => s.artboardId === artboardId
          );
          artboardStates.forEach((state) => {
            get().syncStateFromLayout(state.id);
          });
        },

        // Update element in state
        updateStateElement: (stateId, elementId, updates) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                return {
                  ...s,
                  updatedAt: Date.now(),
                  elements: s.elements.map((el) =>
                    el.elementId === elementId ? { ...el, ...updates } : el
                  ),
                };
              }),
            }),
            false,
            "animation/updateStateElement"
          );
        },

        // Add element to state
        addElementToState: (stateId, element) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                return {
                  ...s,
                  updatedAt: Date.now(),
                  elements: [...s.elements, element],
                };
              }),
            }),
            false,
            "animation/addElementToState"
          );
        },

        // Remove element from state
        removeElementFromState: (stateId, elementId) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                return {
                  ...s,
                  updatedAt: Date.now(),
                  elements: s.elements.filter(
                    (el) => el.elementId !== elementId
                  ),
                };
              }),
            }),
            false,
            "animation/removeElementFromState"
          );
        },

        // Reorder state
        reorderState: (id, newOrder) => {
          recordSnapshot();
          set(
            (state) => {
              const stateToReorder = state.states.find((s) => s.id === id);
              if (!stateToReorder) return state;

              const artboardId = stateToReorder.artboardId;
              const oldOrder = stateToReorder.order;

              const reorderedStates = state.states.map((s) => {
                if (s.artboardId !== artboardId) return s;

                if (s.id === id) {
                  return { ...s, order: newOrder, updatedAt: Date.now() };
                }

                // Shift other states
                if (newOrder > oldOrder) {
                  // Moving down: shift states between old and new positions up
                  if (s.order > oldOrder && s.order <= newOrder) {
                    return { ...s, order: s.order - 1 };
                  }
                } else {
                  // Moving up: shift states between new and old positions down
                  if (s.order >= newOrder && s.order < oldOrder) {
                    return { ...s, order: s.order + 1 };
                  }
                }

                return s;
              });

              return { states: reorderedStates };
            },
            false,
            "animation/reorderState"
          );
        },

        // =====================
        // TRANSITION CRUD
        // =====================

        // Create transition between two states
        createTransition: (fromStateId, toStateId) => {
          const id = crypto.randomUUID();

          // Check if transition already exists between these states
          const existing = get().transitions.find(
            (t) => t.fromStateId === fromStateId && t.toStateId === toStateId
          );
          if (existing) return existing.id;

          const transitionData = createDefaultTransition(
            fromStateId,
            toStateId,
            ANIMATION_CONSTANTS.DEFAULT_TRANSITION_DURATION
          );

          const newTransition: StateTransition = {
            id,
            ...transitionData,
          };

          recordSnapshot();
          set(
            (state) => ({
              transitions: [...state.transitions, newTransition],
              selectedTransitionId: id,
            }),
            false,
            "animation/createTransition"
          );

          return id;
        },

        // Update transition
        updateTransition: (id, updates) => {
          recordSnapshot();
          set(
            (state) => ({
              transitions: state.transitions.map((t) =>
                t.id === id
                  ? { ...t, ...updates, updatedAt: Date.now() }
                  : t
              ),
            }),
            false,
            "animation/updateTransition"
          );
        },

        // Delete transition
        deleteTransition: (id) => {
          recordSnapshot();
          set(
            (state) => ({
              transitions: state.transitions.filter((t) => t.id !== id),
              selectedTransitionId:
                state.selectedTransitionId === id
                  ? null
                  : state.selectedTransitionId,
            }),
            false,
            "animation/deleteTransition"
          );
        },

        // Duplicate transition
        duplicateTransition: (id) => {
          const transitionToDuplicate = get().transitions.find(
            (t) => t.id === id
          );
          if (!transitionToDuplicate) return null;

          const newId = crypto.randomUUID();
          const now = Date.now();

          const newTransition: StateTransition = {
            ...transitionToDuplicate,
            id: newId,
            createdAt: now,
            updatedAt: now,
          };

          recordSnapshot();
          set(
            (state) => ({
              transitions: [...state.transitions, newTransition],
              selectedTransitionId: newId,
            }),
            false,
            "animation/duplicateTransition"
          );

          return newId;
        },

        // =====================
        // ELEMENT TRANSITION OVERRIDES
        // =====================

        // Update element override within a transition
        updateElementTransition: (transitionId, elementId, updates) => {
          recordSnapshot();
          set(
            (state) => ({
              transitions: state.transitions.map((t) => {
                if (t.id !== transitionId) return t;

                const existingOverride = t.elementOverrides.find(
                  (eo) => eo.elementId === elementId
                );

                if (existingOverride) {
                  return {
                    ...t,
                    updatedAt: Date.now(),
                    elementOverrides: t.elementOverrides.map((eo) =>
                      eo.elementId === elementId ? { ...eo, ...updates } : eo
                    ),
                  };
                }

                // If no existing override, this shouldn't be called
                // Use addElementOverride instead
                return t;
              }),
            }),
            false,
            "animation/updateElementTransition"
          );
        },

        // Remove element override from transition
        removeElementOverride: (transitionId, elementId) => {
          recordSnapshot();
          set(
            (state) => ({
              transitions: state.transitions.map((t) => {
                if (t.id !== transitionId) return t;

                return {
                  ...t,
                  updatedAt: Date.now(),
                  elementOverrides: t.elementOverrides.filter(
                    (eo) => eo.elementId !== elementId
                  ),
                };
              }),
            }),
            false,
            "animation/removeElementOverride"
          );
        },

        // Add element override to transition
        addElementOverride: (transitionId, elementOverride) => {
          recordSnapshot();
          set(
            (state) => ({
              transitions: state.transitions.map((t) => {
                if (t.id !== transitionId) return t;

                // Check if override already exists
                const existing = t.elementOverrides.find(
                  (eo) => eo.elementId === elementOverride.elementId
                );
                if (existing) return t;

                return {
                  ...t,
                  updatedAt: Date.now(),
                  elementOverrides: [...t.elementOverrides, elementOverride],
                };
              }),
            }),
            false,
            "animation/addElementOverride"
          );
        },

        // =====================
        // TRANSITION SELECTION
        // =====================

        selectTransition: (id) =>
          set(
            () => ({
              selectedTransitionId: id,
              // Clear state selection when selecting transition
              activeStateId: null,
              selectedStateIds: [],
            }),
            false,
            "animation/selectTransition"
          ),

        // =====================
        // PLAYBACK CONTROLS
        // =====================

        setPlaybackState: (updates) =>
          set(
            (state) => ({
              playback: { ...state.playback, ...updates },
            }),
            false,
            "animation/setPlaybackState"
          ),

        play: () =>
          set(
            (state) => ({
              playback: {
                ...state.playback,
                isPlaying: true,
                isPaused: false,
              },
            }),
            false,
            "animation/play"
          ),

        pause: () =>
          set(
            (state) => ({
              playback: {
                ...state.playback,
                isPlaying: false,
                isPaused: true,
              },
            }),
            false,
            "animation/pause"
          ),

        stop: () =>
          set(
            () => ({
              playback: {
                ...DEFAULT_PLAYBACK_STATE,
              },
            }),
            false,
            "animation/stop"
          ),

        seekTo: (time) =>
          set(
            (state) => ({
              playback: {
                ...state.playback,
                currentTime: Math.max(0, time),
              },
            }),
            false,
            "animation/seekTo"
          ),

        setPlaybackSpeed: (speed) => {
          // Validate speed is in allowed speeds
          const validSpeeds = ANIMATION_CONSTANTS.PLAYBACK_SPEEDS;
          const validSpeed = validSpeeds.includes(
            speed as (typeof validSpeeds)[number]
          )
            ? speed
            : ANIMATION_CONSTANTS.DEFAULT_PLAYBACK_SPEED;

          set(
            (state) => ({
              playback: {
                ...state.playback,
                playbackSpeed: validSpeed,
              },
            }),
            false,
            "animation/setPlaybackSpeed"
          );
        },

        toggleLoop: () =>
          set(
            (state) => ({
              playback: {
                ...state.playback,
                loop: !state.playback.loop,
              },
            }),
            false,
            "animation/toggleLoop"
          ),

        // Set interpolated elements during playback
        setInterpolatedElements: (elements) =>
          set(
            () => ({
              interpolatedElements: elements,
            }),
            false,
            "animation/setInterpolatedElements"
          ),

        // Clear interpolated elements
        clearInterpolatedElements: () =>
          set(
            () => ({
              interpolatedElements: {},
            }),
            false,
            "animation/clearInterpolatedElements"
          ),

        // =====================
        // CHAIN CRUD
        // =====================

        createChain: (artboardId, startStateId, name) => {
          const existingChains = get().chains.filter(
            (c) => c.artboardId === artboardId
          );
          const chainName = name || `Animation ${existingChains.length + 1}`;

          const newChain = createChain(artboardId, startStateId, {
            name: chainName,
            isDefault: existingChains.length === 0,
          });

          recordSnapshot();
          set(
            (state) => ({
              chains: [...state.chains, newChain],
              selectedChainId: newChain.id,
            }),
            false,
            "animation/createChain"
          );

          return newChain.id;
        },

        updateChain: (id, updates) => {
          recordSnapshot();
          set(
            (state) => ({
              chains: state.chains.map((c) =>
                c.id === id
                  ? { ...c, ...updates, updatedAt: Date.now() }
                  : c
              ),
            }),
            false,
            "animation/updateChain"
          );
        },

        deleteChain: (id) => {
          recordSnapshot();
          set(
            (state) => ({
              chains: state.chains.filter((c) => c.id !== id),
              selectedChainId:
                state.selectedChainId === id ? null : state.selectedChainId,
              // Stop playback if playing this chain
              chainPlayback:
                state.chainPlayback.activeChainId === id
                  ? { ...DEFAULT_CHAIN_PLAYBACK_STATE }
                  : state.chainPlayback,
            }),
            false,
            "animation/deleteChain"
          );
        },

        duplicateChain: (id) => {
          const chainToDuplicate = get().chains.find((c) => c.id === id);
          if (!chainToDuplicate) return null;

          const now = Date.now();
          const newChain: AnimationChain = {
            ...chainToDuplicate,
            id: crypto.randomUUID(),
            name: `${chainToDuplicate.name} copy`,
            isDefault: false,
            steps: chainToDuplicate.steps.map((step) => ({
              ...step,
              id: crypto.randomUUID(),
            })),
            createdAt: now,
            updatedAt: now,
          };

          recordSnapshot();
          set(
            (state) => ({
              chains: [...state.chains, newChain],
              selectedChainId: newChain.id,
            }),
            false,
            "animation/duplicateChain"
          );

          return newChain.id;
        },

        selectChain: (id) =>
          set(
            () => ({
              selectedChainId: id,
              // Clear state/transition selection when selecting chain
              activeStateId: null,
              selectedStateIds: [],
              selectedTransitionId: null,
            }),
            false,
            "animation/selectChain"
          ),

        // =====================
        // CHAIN STEPS
        // =====================

        addChainStep: (chainId, stateId, afterStepId) => {
          const newStep = createChainStep(stateId);

          recordSnapshot();
          set(
            (state) => ({
              chains: state.chains.map((c) => {
                if (c.id !== chainId) return c;

                let newSteps: ChainStep[];
                if (afterStepId) {
                  const index = c.steps.findIndex((s) => s.id === afterStepId);
                  if (index >= 0) {
                    newSteps = [
                      ...c.steps.slice(0, index + 1),
                      newStep,
                      ...c.steps.slice(index + 1),
                    ];
                  } else {
                    newSteps = [...c.steps, newStep];
                  }
                } else {
                  newSteps = [...c.steps, newStep];
                }

                return {
                  ...c,
                  steps: newSteps,
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/addChainStep"
          );

          return newStep.id;
        },

        updateChainStep: (chainId, stepId, updates) => {
          recordSnapshot();
          set(
            (state) => ({
              chains: state.chains.map((c) => {
                if (c.id !== chainId) return c;

                return {
                  ...c,
                  steps: c.steps.map((step) =>
                    step.id === stepId ? { ...step, ...updates } : step
                  ),
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/updateChainStep"
          );
        },

        removeChainStep: (chainId, stepId) => {
          recordSnapshot();
          set(
            (state) => ({
              chains: state.chains.map((c) => {
                if (c.id !== chainId) return c;

                return {
                  ...c,
                  steps: c.steps.filter((step) => step.id !== stepId),
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/removeChainStep"
          );
        },

        reorderChainSteps: (chainId, stepIds) => {
          recordSnapshot();
          set(
            (state) => ({
              chains: state.chains.map((c) => {
                if (c.id !== chainId) return c;

                // Reorder steps based on provided order
                const stepMap = new Map(c.steps.map((s) => [s.id, s]));
                const newSteps = stepIds
                  .map((id) => stepMap.get(id))
                  .filter((s): s is ChainStep => !!s);

                return {
                  ...c,
                  steps: newSteps,
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/reorderChainSteps"
          );
        },

        // =====================
        // CHAIN PLAYBACK
        // =====================

        playChain: (chainId) =>
          set(
            (state) => ({
              chainPlayback: {
                ...state.chainPlayback,
                activeChainId: chainId,
                currentStepIndex: 0,
                isReversing: false,
                elapsedTime: 0,
                iterations: 0,
              },
              // Stop regular playback
              playback: {
                ...state.playback,
                isPlaying: false,
                isPaused: false,
              },
            }),
            false,
            "animation/playChain"
          ),

        pauseChain: () =>
          set(
            (state) => ({
              chainPlayback: {
                ...state.chainPlayback,
                // Preserve state but don't advance time
              },
            }),
            false,
            "animation/pauseChain"
          ),

        stopChain: () =>
          set(
            () => ({
              chainPlayback: { ...DEFAULT_CHAIN_PLAYBACK_STATE },
            }),
            false,
            "animation/stopChain"
          ),

        setChainPlaybackState: (updates) =>
          set(
            (state) => ({
              chainPlayback: { ...state.chainPlayback, ...updates },
            }),
            false,
            "animation/setChainPlaybackState"
          ),

        // =====================
        // CHAIN SELECTORS
        // =====================

        getChain: (id) => {
          return get().chains.find((c) => c.id === id);
        },

        getChainsForArtboard: (artboardId) => {
          return get().chains.filter((c) => c.artboardId === artboardId);
        },

        // =====================
        // IMPORT/EXPORT
        // =====================

        exportAnimationData: (artboardId) => {
          const { states, transitions, chains } = get();

          // Get states for this artboard
          const artboardStates = states
            .filter((s) => s.artboardId === artboardId)
            .sort((a, b) => a.order - b.order);

          // Get state IDs
          const stateIds = new Set(artboardStates.map((s) => s.id));

          // Get transitions between these states
          const artboardTransitions = transitions.filter(
            (t) => stateIds.has(t.fromStateId) && stateIds.has(t.toStateId)
          );

          // Get chains for this artboard
          const artboardChains = chains.filter(
            (c) => c.artboardId === artboardId
          );

          return {
            states: artboardStates,
            transitions: artboardTransitions,
            chains: artboardChains,
          };
        },

        importAnimationData: (artboardId, newStates, newTransitions, mode, newChains) => {
          recordSnapshot();

          let statesImported = 0;
          let transitionsImported = 0;
          let chainsImported = 0;

          set(
            (state) => {
              let updatedStates = [...state.states];
              let updatedTransitions = [...state.transitions];
              let updatedChains = [...state.chains];

              if (mode === "replace") {
                // Remove existing states, transitions, and chains for this artboard
                const existingStateIds = new Set(
                  updatedStates
                    .filter((s) => s.artboardId === artboardId)
                    .map((s) => s.id)
                );

                updatedStates = updatedStates.filter(
                  (s) => s.artboardId !== artboardId
                );
                updatedTransitions = updatedTransitions.filter(
                  (t) =>
                    !existingStateIds.has(t.fromStateId) &&
                    !existingStateIds.has(t.toStateId)
                );
                updatedChains = updatedChains.filter(
                  (c) => c.artboardId !== artboardId
                );
              }

              // Calculate starting order for new states
              const existingMaxOrder = Math.max(
                0,
                ...updatedStates
                  .filter((s) => s.artboardId === artboardId)
                  .map((s) => s.order)
              );

              // Add new states with updated artboardId and order
              const stateIdMap = new Map<string, string>();
              const importedStates = newStates.map((s, index) => {
                const newId = crypto.randomUUID();
                stateIdMap.set(s.id, newId);
                return {
                  ...s,
                  id: newId,
                  artboardId,
                  order:
                    mode === "replace" ? s.order : existingMaxOrder + 1 + index,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
              });

              updatedStates.push(...importedStates);
              statesImported = importedStates.length;

              // Add new transitions with updated state references
              const importedTransitions = newTransitions
                .map((t) => {
                  const newFromId = stateIdMap.get(t.fromStateId);
                  const newToId = stateIdMap.get(t.toStateId);

                  // Only import if both states were imported
                  if (!newFromId || !newToId) return null;

                  return {
                    ...t,
                    id: crypto.randomUUID() as string,
                    fromStateId: newFromId,
                    toStateId: newToId,
                  } as StateTransition;
                })
                .filter((t): t is StateTransition => t !== null);

              updatedTransitions.push(...importedTransitions);
              transitionsImported = importedTransitions.length;

              // Import chains with updated state references
              if (newChains && newChains.length > 0) {
                const importedChains = newChains
                  .map((c) => {
                    const newStartStateId = stateIdMap.get(c.startStateId);
                    if (!newStartStateId) return null;

                    // Update step state references
                    const updatedSteps = c.steps
                      .map((step) => {
                        const newStateId = stateIdMap.get(step.stateId);
                        if (!newStateId) return null;
                        return {
                          ...step,
                          id: crypto.randomUUID(),
                          stateId: newStateId,
                        };
                      })
                      .filter((s): s is ChainStep => s !== null);

                    return {
                      ...c,
                      id: crypto.randomUUID(),
                      artboardId,
                      startStateId: newStartStateId,
                      steps: updatedSteps,
                      isDefault: false, // Don't copy default status
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    } as AnimationChain;
                  })
                  .filter((c): c is AnimationChain => c !== null);

                updatedChains.push(...importedChains);
                chainsImported = importedChains.length;
              }

              return {
                states: updatedStates,
                transitions: updatedTransitions,
                chains: updatedChains,
              };
            },
            false,
            "animation/importAnimationData"
          );

          return { statesImported, transitionsImported, chainsImported };
        },

        // =====================
        // PRESETS
        // =====================

        applyPresetToElement: (stateId, elementId, presetProperties) => {
          recordSnapshot();
          set(
            (state) => {
              const stateToUpdate = state.states.find((s) => s.id === stateId);
              if (!stateToUpdate) return state;

              const updatedElements = stateToUpdate.elements.map((el) => {
                if (el.elementId !== elementId) return el;

                // Apply preset properties to element
                return {
                  ...el,
                  ...presetProperties,
                  // Ensure valid values
                  opacity:
                    presetProperties.opacity !== undefined
                      ? Math.max(0, Math.min(1, presetProperties.opacity))
                      : el.opacity,
                  scale:
                    presetProperties.scale !== undefined
                      ? Math.max(0.1, presetProperties.scale)
                      : el.scale,
                };
              });

              const updatedStates = state.states.map((s) =>
                s.id === stateId
                  ? {
                      ...s,
                      elements: updatedElements,
                      updatedAt: Date.now(),
                    }
                  : s
              );

              return { states: updatedStates };
            },
            false,
            "animation/applyPresetToElement"
          );
        },

        // =====================
        // ENTER/EXIT
        // =====================

        setElementEnterExit: (stateId, elementId, type) => {
          recordSnapshot();
          set(
            (state) => {
              const stateToUpdate = state.states.find((s) => s.id === stateId);
              if (!stateToUpdate) return state;

              const updatedElements = stateToUpdate.elements.map((el) => {
                if (el.elementId !== elementId) return el;
                return {
                  ...el,
                  enterExitType: type,
                };
              });

              const updatedStates = state.states.map((s) =>
                s.id === stateId
                  ? {
                      ...s,
                      elements: updatedElements,
                      updatedAt: Date.now(),
                    }
                  : s
              );

              return { states: updatedStates };
            },
            false,
            "animation/setElementEnterExit"
          );
        },

        // =====================
        // STAGGER
        // =====================

        applyStaggerToSelection: (transitionId, elementIds, staggerDelay) => {
          recordSnapshot();
          set(
            (state) => {
              const transition = state.transitions.find(
                (t) => t.id === transitionId
              );
              if (!transition) return state;

              // Create or update element overrides with staggered delays
              const existingOverrides = transition.elementOverrides || [];

              // Build new overrides with staggered delays
              const newOverrides = elementIds.map((elementId, index) => {
                const existingOverride = existingOverrides.find(
                  (o) => o.elementId === elementId
                );

                const delay = index * staggerDelay;

                if (existingOverride) {
                  return {
                    ...existingOverride,
                    delay,
                  };
                }

                // Create new override with just the delay
                return {
                  elementId,
                  duration: transition.duration,
                  delay,
                  easing: transition.easing,
                  properties: ["all" as const],
                };
              });

              // Merge with existing overrides (keep non-selected elements)
              const selectedSet = new Set(elementIds);
              const keptOverrides = existingOverrides.filter(
                (o) => !selectedSet.has(o.elementId)
              );
              const mergedOverrides = [...keptOverrides, ...newOverrides];

              const updatedTransitions = state.transitions.map((t) =>
                t.id === transitionId
                  ? {
                      ...t,
                      elementOverrides: mergedOverrides,
                      updatedAt: Date.now(),
                    }
                  : t
              );

              return { transitions: updatedTransitions };
            },
            false,
            "animation/applyStaggerToSelection"
          );
        },

        // =====================
        // CASCADE (Phase 2: Hierarchical Animations)
        // =====================

        // Update element inheritance mode
        updateElementInheritance: (stateId, elementId, mode) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                return {
                  ...s,
                  updatedAt: Date.now(),
                  elements: s.elements.map((el) =>
                    el.elementId === elementId
                      ? { ...el, inheritanceMode: mode }
                      : el
                  ),
                };
              }),
            }),
            false,
            "animation/updateElementInheritance"
          );
        },

        // Update element-specific timing override
        updateElementTiming: (stateId, elementId, timing) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                return {
                  ...s,
                  updatedAt: Date.now(),
                  elements: s.elements.map((el) =>
                    el.elementId === elementId ? { ...el, timing } : el
                  ),
                };
              }),
            }),
            false,
            "animation/updateElementTiming"
          );
        },

        // Update transition cascade configuration
        updateTransitionCascade: (transitionId, cascadeUpdates) => {
          recordSnapshot();
          set(
            (state) => ({
              transitions: state.transitions.map((t) => {
                if (t.id !== transitionId) return t;

                const existingCascade = t.cascade || { ...DEFAULT_CASCADE_CONFIG };
                const newCascade: CascadeConfig = {
                  ...existingCascade,
                  ...cascadeUpdates,
                  // Merge stagger config if provided
                  stagger: cascadeUpdates.stagger
                    ? { ...existingCascade.stagger, ...cascadeUpdates.stagger }
                    : existingCascade.stagger,
                };

                return {
                  ...t,
                  cascade: newCascade,
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/updateTransitionCascade"
          );
        },

        // Apply a cascade preset to a transition
        applyTransitionCascadePreset: (transitionId, presetId) => {
          recordSnapshot();
          set(
            (state) => ({
              transitions: state.transitions.map((t) => {
                if (t.id !== transitionId) return t;

                return {
                  ...t,
                  cascade: applyCascadePreset(presetId),
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/applyTransitionCascadePreset"
          );
        },

        // =====================
        // HOLD TIME
        // =====================

        updateStateHoldTime: (stateId, holdTime) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) =>
                s.id === stateId
                  ? {
                      ...s,
                      holdTime: Math.max(
                        ANIMATION_CONSTANTS.MIN_HOLD_TIME,
                        Math.min(ANIMATION_CONSTANTS.MAX_HOLD_TIME, holdTime)
                      ),
                      updatedAt: Date.now(),
                    }
                  : s
              ),
            }),
            false,
            "animation/updateStateHoldTime"
          );
        },

        // =====================
        // TRIGGERS
        // =====================

        updateStateTrigger: (stateId, trigger) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) =>
                s.id === stateId
                  ? {
                      ...s,
                      trigger,
                      updatedAt: Date.now(),
                    }
                  : s
              ),
            }),
            false,
            "animation/updateStateTrigger"
          );
        },

        setStateTriggerType: (stateId, type) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                // When changing type, preserve compatible sub-configs
                const newTrigger: AnimationTrigger = { type };

                // Keep element config for element-based triggers
                if (
                  (type === "hover" || type === "click" || type === "focus") &&
                  s.trigger.element
                ) {
                  newTrigger.element = s.trigger.element;
                }

                // Keep timing config for auto triggers
                if (type === "auto" && s.trigger.timing) {
                  newTrigger.timing = s.trigger.timing;
                }

                // Keep custom name for custom triggers
                if (type === "custom" && s.trigger.customName) {
                  newTrigger.customName = s.trigger.customName;
                }

                return {
                  ...s,
                  trigger: newTrigger,
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/setStateTriggerType"
          );
        },

        setStateTriggerElement: (stateId, elementId, elementName) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                return {
                  ...s,
                  trigger: {
                    ...s.trigger,
                    element: {
                      targetElementId: elementId,
                      targetElementName: elementName,
                    },
                  },
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/setStateTriggerElement"
          );
        },

        setStateTriggerTiming: (stateId, timing) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                return {
                  ...s,
                  trigger: {
                    ...s.trigger,
                    timing,
                  },
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/setStateTriggerTiming"
          );
        },

        clearStateTriggerElement: (stateId) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                const { element: _, ...restTrigger } = s.trigger;
                return {
                  ...s,
                  trigger: restTrigger as AnimationTrigger,
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/clearStateTriggerElement"
          );
        },

        clearStateTriggerTiming: (stateId) => {
          recordSnapshot();
          set(
            (state) => ({
              states: state.states.map((s) => {
                if (s.id !== stateId) return s;

                const { timing: _, ...restTrigger } = s.trigger;
                return {
                  ...s,
                  trigger: restTrigger as AnimationTrigger,
                  updatedAt: Date.now(),
                };
              }),
            }),
            false,
            "animation/clearStateTriggerTiming"
          );
        },

        // =====================
        // PREVIEW MODE
        // =====================

        enterPreviewMode: () =>
          set(
            (state) => ({
              editorMode: "preview" as EditorMode,
              previewMode: {
                ...state.previewMode,
                isActive: true,
              },
            }),
            false,
            "animation/enterPreviewMode"
          ),

        exitPreviewMode: () =>
          set(
            () => ({
              editorMode: "animation" as EditorMode,
              previewMode: { ...DEFAULT_PREVIEW_MODE_STATE },
            }),
            false,
            "animation/exitPreviewMode"
          ),

        setPreviewHoveredElement: (elementId) =>
          set(
            (state) => ({
              previewMode: {
                ...state.previewMode,
                hoveredElementId: elementId,
              },
            }),
            false,
            "animation/setPreviewHoveredElement"
          ),

        triggerPreviewState: (stateId) =>
          set(
            (state) => ({
              previewMode: {
                ...state.previewMode,
                activeTriggeredStateId: stateId,
                triggerActivatedAt: Date.now(),
              },
              activeStateId: stateId,
            }),
            false,
            "animation/triggerPreviewState"
          ),

        resetPreviewState: () =>
          set(
            (state) => ({
              previewMode: {
                ...state.previewMode,
                activeTriggeredStateId: null,
                triggerActivatedAt: null,
              },
            }),
            false,
            "animation/resetPreviewState"
          ),

        toggleConnectionLines: () =>
          set(
            (state) => ({
              previewMode: {
                ...state.previewMode,
                showConnectionLines: !state.previewMode.showConnectionLines,
              },
            }),
            false,
            "animation/toggleConnectionLines"
          ),

        // =====================
        // SELECTORS
        // =====================

        getState: (id) => {
          return get().states.find((s) => s.id === id);
        },

        getStatesForArtboard: (artboardId) => {
          return get()
            .states.filter((s) => s.artboardId === artboardId)
            .sort((a, b) => a.order - b.order);
        },

        getActiveState: () => {
          const { activeStateId, states } = get();
          if (!activeStateId) return undefined;
          return states.find((s) => s.id === activeStateId);
        },

        getTransition: (id) => {
          return get().transitions.find((t) => t.id === id);
        },

        getTransitionsForArtboard: (artboardId) => {
          const { transitions, states } = get();
          // Get all state IDs for this artboard
          const artboardStateIds = new Set(
            states.filter((s) => s.artboardId === artboardId).map((s) => s.id)
          );

          // Return transitions where both fromState and toState belong to this artboard
          return transitions.filter(
            (t) =>
              artboardStateIds.has(t.fromStateId) &&
              artboardStateIds.has(t.toStateId)
          );
        },

        getTransitionBetweenStates: (fromId, toId) => {
          return get().transitions.find(
            (t) => t.fromStateId === fromId && t.toStateId === toId
          );
        },

        // Reset
        resetAnimationStore: () =>
          set(
            () => ({
              ...initialState,
              playback: { ...DEFAULT_PLAYBACK_STATE },
              chainPlayback: { ...DEFAULT_CHAIN_PLAYBACK_STATE },
            }),
            false,
            "animation/resetAnimationStore"
          ),
      }),
      {
        name: STORAGE_KEYS.ANIMATION_STATE,
        version: 3,
        partialize: (state) => ({
          states: state.states,
          transitions: state.transitions,
          chains: state.chains,
          // Don't persist: editorMode, activeStateId, selectedStateIds,
          // selectedTransitionId, selectedChainId, playback, chainPlayback (these are UI state)
        }),
        migrate: (persistedState, version) => {
          let state = persistedState as {
            states: AnimationState[];
            transitions: StateTransition[];
            chains?: AnimationChain[];
          };

          // Version 2: Add cascade support fields
          if (version < 2) {
            // Add default inheritanceMode and timing to existing elements
            const migratedStates = state.states.map((s) => ({
              ...s,
              elements: s.elements.map((el) => ({
                ...el,
                // Set inheritanceMode based on whether element has a parent
                inheritanceMode:
                  el.inheritanceMode ??
                  (el.parentId ? "relative" : "independent"),
                // Set timing to null (use transition defaults)
                timing: el.timing ?? null,
                // layoutSnapshot is optional, don't add if not present
              })),
            }));

            state = {
              ...state,
              states: migratedStates,
            };
          }

          // Version 3: Add chains support
          if (version < 3) {
            state = {
              ...state,
              chains: state.chains ?? [],
            };
          }

          return state;
        },
      }
    ),
    { name: "AnimationStore" }
  )
);
