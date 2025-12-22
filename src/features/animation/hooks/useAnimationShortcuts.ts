/**
 * Animation Keyboard Shortcuts Hook
 *
 * Handles keyboard shortcuts for animation playback (animation mode only):
 * - Space: Play/pause
 * - Home: Seek to start
 * - End: Seek to end
 *
 * Note: Mode toggle (Ctrl/Cmd+M) is handled globally in AppLayout
 */

import { useEffect } from "react";
import { useAnimationStore } from "../store/animationStore";
import { useCommandStore } from "@/features/commands/store/commandStore";

interface UseAnimationShortcutsOptions {
  /** Total duration of the timeline in ms */
  totalDuration: number;
  /** Whether shortcuts should be active */
  enabled?: boolean;
}

export function useAnimationShortcuts({
  totalDuration,
  enabled = true,
}: UseAnimationShortcutsOptions) {
  const editorMode = useAnimationStore((state) => state.editorMode);
  const isPlaying = useAnimationStore((state) => state.playback.isPlaying);
  const isPaused = useAnimationStore((state) => state.playback.isPaused);
  const play = useAnimationStore((state) => state.play);
  const pause = useAnimationStore((state) => state.pause);
  const seekTo = useAnimationStore((state) => state.seekTo);

  const isAnimationMode = editorMode === "animation";

  // Playback shortcuts - only in animation mode
  useEffect(() => {
    if (!enabled || !isAnimationMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when command palette is open
      if (useCommandStore.getState().isOpen) {
        return;
      }

      // Don't handle when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Space: Play/pause
      if (key === " " || e.code === "Space") {
        e.preventDefault();
        if (isPlaying && !isPaused) {
          pause();
        } else {
          play();
        }
      }

      // Home: Seek to start
      if (key === "home") {
        e.preventDefault();
        seekTo(0);
      }

      // End: Seek to end
      if (key === "end") {
        e.preventDefault();
        seekTo(totalDuration);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    isAnimationMode,
    isPlaying,
    isPaused,
    play,
    pause,
    seekTo,
    totalDuration,
  ]);
}
