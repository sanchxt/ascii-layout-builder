/**
 * usePreviewModeShortcuts - Keyboard shortcuts for preview mode
 *
 * Provides keyboard navigation and control in preview mode:
 * - Escape: Exit preview mode
 * - P: Toggle preview mode (from animation mode)
 * - L: Toggle connection lines
 * - R: Reset preview state
 * - 1-9: Quick jump to state by order
 */

import { useEffect, useCallback } from "react";
import { useAnimationStore } from "../store/animationStore";

export function usePreviewModeShortcuts() {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const setEditorMode = useAnimationStore((s) => s.setEditorMode);
  const states = useAnimationStore((s) => s.states);
  const activeStateId = useAnimationStore((s) => s.activeStateId);
  const exitPreviewMode = useAnimationStore((s) => s.exitPreviewMode);
  const enterPreviewMode = useAnimationStore((s) => s.enterPreviewMode);
  const resetPreviewState = useAnimationStore((s) => s.resetPreviewState);
  const toggleConnectionLines = useAnimationStore(
    (s) => s.toggleConnectionLines
  );
  const triggerPreviewState = useAnimationStore((s) => s.triggerPreviewState);
  const selectState = useAnimationStore((s) => s.selectState);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Preview mode specific shortcuts
      if (editorMode === "preview") {
        switch (e.key) {
          case "Escape":
            e.preventDefault();
            exitPreviewMode();
            break;

          case "l":
          case "L":
            if (!e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              toggleConnectionLines();
            }
            break;

          case "r":
          case "R":
            if (!e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              resetPreviewState();
            }
            break;

          // Number keys 1-9 for quick state selection
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9": {
            if (!e.metaKey && !e.ctrlKey && !e.altKey) {
              e.preventDefault();
              const index = parseInt(e.key) - 1;
              const sortedStates = [...states].sort((a, b) => a.order - b.order);
              if (index < sortedStates.length) {
                triggerPreviewState(sortedStates[index].id);
              }
            }
            break;
          }

          default:
            break;
        }
      }

      // Shortcuts available in animation mode
      if (editorMode === "animation") {
        switch (e.key) {
          case "p":
          case "P":
            if (!e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              enterPreviewMode();
            }
            break;

          default:
            break;
        }
      }

      // Global animation/preview shortcuts (when not in layout mode)
      if (editorMode === "animation" || editorMode === "preview") {
        // Shift + number to select state (animation mode)
        if (e.shiftKey && /^[1-9]$/.test(e.key)) {
          const index = parseInt(e.key) - 1;
          const sortedStates = [...states].sort((a, b) => a.order - b.order);
          if (index < sortedStates.length) {
            e.preventDefault();
            selectState(sortedStates[index].id);
          }
        }
      }
    },
    [
      editorMode,
      states,
      exitPreviewMode,
      enterPreviewMode,
      resetPreviewState,
      toggleConnectionLines,
      triggerPreviewState,
      selectState,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    isPreviewMode: editorMode === "preview",
    isAnimationMode: editorMode === "animation",
  };
}

/**
 * Hook that provides shortcuts info for UI display
 */
export function usePreviewShortcutsInfo() {
  const editorMode = useAnimationStore((s) => s.editorMode);

  const shortcuts = [
    {
      key: "Esc",
      label: "Exit preview",
      available: editorMode === "preview",
    },
    {
      key: "P",
      label: "Enter preview",
      available: editorMode === "animation",
    },
    {
      key: "L",
      label: "Toggle lines",
      available: editorMode === "preview",
    },
    {
      key: "R",
      label: "Reset state",
      available: editorMode === "preview",
    },
    {
      key: "1-9",
      label: "Jump to state",
      available: editorMode === "preview",
    },
    {
      key: "Shift+1-9",
      label: "Select state",
      available: editorMode === "animation" || editorMode === "preview",
    },
  ];

  return {
    shortcuts: shortcuts.filter((s) => s.available),
    allShortcuts: shortcuts,
  };
}
