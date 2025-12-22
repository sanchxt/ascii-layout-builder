/**
 * PreviewModeController - UI controls for preview mode
 *
 * Provides a floating control panel for preview mode with options like:
 * - Toggle connection lines visibility
 * - Reset preview state
 * - Exit preview mode
 * - Show current trigger state info
 */

import { Eye, EyeOff, RotateCcw, X, Link2, Link2Off, Info } from "lucide-react";
import { useAnimationStore } from "../store/animationStore";
import { usePreviewMode } from "../hooks/usePreviewMode";
import { TriggerBadge } from "./TriggerBadge";
import { cn } from "@/lib/utils";

interface PreviewModeControllerProps {
  /** Position of the controller */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Optional artboard filter */
  artboardId?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
}

export function PreviewModeController({
  position = "bottom-right",
  artboardId,
  compact = false,
}: PreviewModeControllerProps) {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const {
    isPreviewMode,
    activeTriggeredStateId,
    showConnectionLines,
    exitPreviewMode,
    resetPreviewState,
    toggleConnectionLines,
  } = usePreviewMode({ artboardId });

  const activeState = useAnimationStore((s) =>
    s.states.find((st) => st.id === activeTriggeredStateId)
  );

  // Only show in preview mode
  if (!isPreviewMode) return null;

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  if (compact) {
    return (
      <div
        className={cn(
          "fixed z-50 flex items-center gap-1 p-1 bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg",
          positionClasses[position]
        )}
      >
        {/* Preview mode indicator */}
        <div className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded text-xs font-medium">
          <Eye className="w-3 h-3 animate-pulse" />
          <span>Preview</span>
        </div>

        {/* Connection lines toggle */}
        <button
          onClick={toggleConnectionLines}
          className={cn(
            "p-1.5 rounded transition-colors",
            showConnectionLines
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          )}
          title={showConnectionLines ? "Hide connections" : "Show connections"}
        >
          {showConnectionLines ? (
            <Link2 className="w-4 h-4" />
          ) : (
            <Link2Off className="w-4 h-4" />
          )}
        </button>

        {/* Reset button */}
        <button
          onClick={resetPreviewState}
          className="p-1.5 rounded text-muted-foreground hover:bg-muted transition-colors"
          title="Reset preview state"
          disabled={!activeTriggeredStateId}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Exit button */}
        <button
          onClick={exitPreviewMode}
          className="p-1.5 rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
          title="Exit preview mode (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2 p-3 bg-card/95 backdrop-blur-sm rounded-xl border border-border shadow-lg min-w-[200px]",
        positionClasses[position]
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
            <Eye className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 animate-pulse" />
          </div>
          <span className="text-sm font-semibold">Preview Mode</span>
        </div>
        <button
          onClick={exitPreviewMode}
          className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
          title="Exit preview mode (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active state display */}
      <div className="flex flex-col gap-1.5 p-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
          <Info className="w-3 h-3" />
          Active State
        </div>
        {activeState ? (
          <div className="flex items-center gap-2">
            <TriggerBadge
              trigger={activeState.trigger}
              size="sm"
              showLabel
              variant="default"
            />
            <span className="text-xs font-medium truncate">
              {activeState.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            No active trigger
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Connection lines toggle */}
        <button
          onClick={toggleConnectionLines}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
            showConnectionLines
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {showConnectionLines ? (
            <>
              <Link2 className="w-3.5 h-3.5" />
              Lines On
            </>
          ) : (
            <>
              <Link2Off className="w-3.5 h-3.5" />
              Lines Off
            </>
          )}
        </button>

        {/* Reset button */}
        <button
          onClick={resetPreviewState}
          disabled={!activeTriggeredStateId}
          className={cn(
            "flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
            activeTriggeredStateId
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
          )}
          title="Reset to initial state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Instructions */}
      <div className="text-[10px] text-muted-foreground/70 leading-relaxed">
        Hover, click, or focus on elements to trigger animations. Press{" "}
        <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">
          Esc
        </kbd>{" "}
        to exit.
      </div>
    </div>
  );
}

/**
 * Minimal preview indicator for toolbar
 */
export function PreviewModeIndicator() {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const activeTriggeredStateId = useAnimationStore(
    (s) => s.previewMode.activeTriggeredStateId
  );
  const activeState = useAnimationStore((s) =>
    s.states.find((st) => st.id === activeTriggeredStateId)
  );

  if (editorMode !== "preview") return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-md">
      <Eye className="w-3.5 h-3.5 animate-pulse" />
      <span className="text-xs font-medium">
        {activeState ? activeState.name : "Preview"}
      </span>
    </div>
  );
}
