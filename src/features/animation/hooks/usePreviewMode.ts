/**
 * usePreviewMode - Hook for managing preview mode interactions
 *
 * Handles trigger detection, state transitions, and preview mode lifecycle.
 * Provides utilities for detecting which states should activate based on
 * user interactions (hover, click, focus) with elements.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAnimationStore } from "../store/animationStore";
import { TRIGGER_VISUALIZATION } from "@/lib/constants";
import type { AnimationTriggerType } from "../types/animation";

export interface PreviewModeOptions {
  /** Artboard ID to filter states */
  artboardId?: string;
  /** Auto-reset click triggers after delay */
  autoResetClickTriggers?: boolean;
  /** Custom reset delay in ms */
  resetDelay?: number;
}

export function usePreviewMode(options: PreviewModeOptions = {}) {
  const {
    artboardId,
    autoResetClickTriggers = true,
    resetDelay = TRIGGER_VISUALIZATION.PREVIEW.CLICK_RESET_DELAY,
  } = options;

  const editorMode = useAnimationStore((s) => s.editorMode);
  const states = useAnimationStore((s) => s.states);
  const previewMode = useAnimationStore((s) => s.previewMode);
  const enterPreviewMode = useAnimationStore((s) => s.enterPreviewMode);
  const exitPreviewMode = useAnimationStore((s) => s.exitPreviewMode);
  const setPreviewHoveredElement = useAnimationStore(
    (s) => s.setPreviewHoveredElement
  );
  const triggerPreviewState = useAnimationStore((s) => s.triggerPreviewState);
  const resetPreviewState = useAnimationStore((s) => s.resetPreviewState);
  const toggleConnectionLines = useAnimationStore(
    (s) => s.toggleConnectionLines
  );

  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter states by artboard if specified
  const relevantStates = useMemo(() => {
    if (!artboardId) return states;
    return states.filter((s) => s.artboardId === artboardId);
  }, [states, artboardId]);

  // Map of element IDs to their trigger states
  const elementTriggerMap = useMemo(() => {
    const map = new Map<string, { stateId: string; triggerType: AnimationTriggerType }[]>();

    for (const state of relevantStates) {
      const targetElementId = state.trigger.element?.targetElementId;
      if (!targetElementId) continue;

      // Only map element-based triggers
      if (!["hover", "click", "focus"].includes(state.trigger.type)) continue;

      const existing = map.get(targetElementId) || [];
      existing.push({
        stateId: state.id,
        triggerType: state.trigger.type,
      });
      map.set(targetElementId, existing);
    }

    return map;
  }, [relevantStates]);

  // Get all elements that have triggers
  const triggerElements = useMemo(() => {
    return Array.from(elementTriggerMap.keys());
  }, [elementTriggerMap]);

  // Check if an element has a specific trigger type
  const hasElementTrigger = useCallback(
    (elementId: string, triggerType?: AnimationTriggerType): boolean => {
      const triggers = elementTriggerMap.get(elementId);
      if (!triggers) return false;
      if (!triggerType) return true;
      return triggers.some((t) => t.triggerType === triggerType);
    },
    [elementTriggerMap]
  );

  // Get states triggered by an element
  const getTriggeredStates = useCallback(
    (elementId: string, triggerType?: AnimationTriggerType) => {
      const triggers = elementTriggerMap.get(elementId);
      if (!triggers) return [];

      const filtered = triggerType
        ? triggers.filter((t) => t.triggerType === triggerType)
        : triggers;

      return filtered.map((t) => ({
        ...t,
        state: relevantStates.find((s) => s.id === t.stateId),
      }));
    },
    [elementTriggerMap, relevantStates]
  );

  // Handle element hover
  const handleElementHover = useCallback(
    (elementId: string | null) => {
      if (editorMode !== "preview") return;

      setPreviewHoveredElement(elementId);

      if (elementId) {
        // Find hover-triggered states for this element
        const hoverStates = getTriggeredStates(elementId, "hover");
        if (hoverStates.length > 0) {
          // Trigger the first hover state
          triggerPreviewState(hoverStates[0].stateId);
        }
      } else {
        // Clear active state when hover ends (if it was a hover trigger)
        const activeState = relevantStates.find(
          (s) => s.id === previewMode.activeTriggeredStateId
        );
        if (activeState?.trigger.type === "hover") {
          resetPreviewState();
        }
      }
    },
    [
      editorMode,
      setPreviewHoveredElement,
      getTriggeredStates,
      triggerPreviewState,
      resetPreviewState,
      relevantStates,
      previewMode.activeTriggeredStateId,
    ]
  );

  // Handle element click
  const handleElementClick = useCallback(
    (elementId: string) => {
      if (editorMode !== "preview") return;

      // Find click-triggered states for this element
      const clickStates = getTriggeredStates(elementId, "click");
      if (clickStates.length > 0) {
        // Clear any existing reset timeout
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = null;
        }

        const currentStateId = previewMode.activeTriggeredStateId;
        const targetStateId = clickStates[0].stateId;

        // Toggle: if already at target state, go back to initial
        if (currentStateId === targetStateId) {
          resetPreviewState();
        } else {
          // Trigger the click state
          triggerPreviewState(targetStateId);

          // Auto-reset after delay if enabled
          if (autoResetClickTriggers) {
            resetTimeoutRef.current = setTimeout(() => {
              resetPreviewState();
              resetTimeoutRef.current = null;
            }, resetDelay);
          }
        }
      }
    },
    [
      editorMode,
      getTriggeredStates,
      triggerPreviewState,
      resetPreviewState,
      autoResetClickTriggers,
      resetDelay,
      previewMode.activeTriggeredStateId,
    ]
  );

  // Handle element focus
  const handleElementFocus = useCallback(
    (elementId: string, isFocused: boolean) => {
      if (editorMode !== "preview") return;

      if (isFocused) {
        // Find focus-triggered states for this element
        const focusStates = getTriggeredStates(elementId, "focus");
        if (focusStates.length > 0) {
          triggerPreviewState(focusStates[0].stateId);
        }
      } else {
        // Clear active state when focus ends (if it was a focus trigger)
        const activeState = relevantStates.find(
          (s) => s.id === previewMode.activeTriggeredStateId
        );
        if (activeState?.trigger.type === "focus") {
          resetPreviewState();
        }
      }
    },
    [
      editorMode,
      getTriggeredStates,
      triggerPreviewState,
      resetPreviewState,
      relevantStates,
      previewMode.activeTriggeredStateId,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Auto-exit preview mode when leaving animation/preview mode
  useEffect(() => {
    if (editorMode === "layout" && previewMode.isActive) {
      exitPreviewMode();
    }
  }, [editorMode, previewMode.isActive, exitPreviewMode]);

  return {
    // State
    isPreviewMode: editorMode === "preview",
    isActive: previewMode.isActive,
    hoveredElementId: previewMode.hoveredElementId,
    activeTriggeredStateId: previewMode.activeTriggeredStateId,
    showConnectionLines: previewMode.showConnectionLines,

    // Element info
    triggerElements,
    hasElementTrigger,
    getTriggeredStates,

    // Actions
    enterPreviewMode,
    exitPreviewMode,
    handleElementHover,
    handleElementClick,
    handleElementFocus,
    resetPreviewState,
    toggleConnectionLines,
  };
}

/**
 * Hook to get trigger info for a specific element
 */
export function useElementTriggers(elementId: string, artboardId?: string) {
  const states = useAnimationStore((s) => s.states);
  const previewMode = useAnimationStore((s) => s.previewMode);

  const triggers = useMemo(() => {
    return states.filter((s) => {
      if (artboardId && s.artboardId !== artboardId) return false;
      return s.trigger.element?.targetElementId === elementId;
    });
  }, [states, elementId, artboardId]);

  const isHovered = previewMode.hoveredElementId === elementId;
  const isActiveTarget = triggers.some(
    (t) => t.id === previewMode.activeTriggeredStateId
  );

  return {
    triggers,
    hasTriggers: triggers.length > 0,
    triggerTypes: [...new Set(triggers.map((t) => t.trigger.type))],
    isHovered,
    isActiveTarget,
  };
}
