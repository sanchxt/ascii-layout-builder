import { useMemo } from "react";
import { useAnimationStore } from "../store/animationStore";
import type { AnimationStateElement } from "../types/animation";

/**
 * Hook to get animation state element data for a box.
 *
 * Priority order:
 * 1. During playback or preview animation: use interpolated elements from store
 * 2. In animation/preview mode with active state: use active state's element data
 * 3. Otherwise: return null (use default box rendering)
 */
export const useStateRendering = (
  boxId: string
): AnimationStateElement | null => {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const activeStateId = useAnimationStore((s) => s.activeStateId);
  const states = useAnimationStore((s) => s.states);
  const isPlaying = useAnimationStore((s) => s.playback.isPlaying);
  const isPaused = useAnimationStore((s) => s.playback.isPaused);
  const interpolatedElement = useAnimationStore(
    (s) => s.interpolatedElements[boxId]
  );
  const previewMode = useAnimationStore((s) => s.previewMode);

  // Memoize active state lookup to avoid creating new references
  const activeState = useMemo(() => {
    if (!activeStateId) return null;
    return states.find((s) => s.id === activeStateId) || null;
  }, [states, activeStateId]);

  // Not in animation or preview mode - use default box rendering
  if (editorMode !== "animation" && editorMode !== "preview") {
    return null;
  }

  // During playback (playing or paused) or preview animation, use interpolated elements
  const isPlaybackActive = isPlaying || isPaused;
  const isPreviewAnimating = editorMode === "preview" && previewMode.isActive;

  if ((isPlaybackActive || isPreviewAnimating) && interpolatedElement) {
    return interpolatedElement;
  }

  // Not in playback - use active state if available
  if (!activeState) {
    return null;
  }

  const stateElement = activeState.elements.find(
    (e) => e.elementId === boxId
  );
  return stateElement || null;
};

/**
 * Hook to check if currently editing an animation state
 */
export const useIsEditingState = (): boolean => {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const activeStateId = useAnimationStore((s) => s.activeStateId);
  return editorMode === "animation" && activeStateId !== null;
};
