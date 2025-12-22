import { X, Pencil } from "lucide-react";
import { useAnimationStore } from "../store/animationStore";
import { useStateEditorStore } from "../store/stateEditorStore";
import { cn } from "@/lib/utils";

/**
 * StateIndicator - Minimal toolbar badge for active state
 *
 * Shows the active state name with quick actions to edit or exit.
 * Designed to be rendered in the Toolbar, not as a floating element.
 */
export const StateIndicator = () => {
  const editorMode = useAnimationStore((s) => s.editorMode);
  const activeState = useAnimationStore((s) => s.getActiveState());
  const clearActiveState = useAnimationStore((s) => s.clearActiveState);
  const openEditor = useStateEditorStore((s) => s.openEditor);

  // Only show in animation mode with an active state
  if (editorMode !== "animation" || !activeState) return null;

  const handleOpenEditor = () => {
    openEditor(activeState.id);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "bg-state-accent/10 border border-state-accent/30",
        "transition-all duration-200"
      )}
    >
      {/* Pulse indicator */}
      <div className="w-1.5 h-1.5 rounded-full bg-state-accent animate-pulse" />

      {/* State name */}
      <span
        className="text-[11px] font-medium text-state-accent-foreground truncate max-w-[100px]"
        title={activeState.name}
      >
        {activeState.name}
      </span>

      {/* Edit button */}
      <button
        onClick={handleOpenEditor}
        className="p-0.5 rounded hover:bg-state-accent/20 transition-colors text-state-accent"
        title="Edit state"
      >
        <Pencil className="w-3 h-3" />
      </button>

      {/* Exit button */}
      <button
        onClick={clearActiveState}
        className="p-0.5 rounded hover:bg-state-accent/20 transition-colors text-state-accent"
        title="Exit state editing"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
