/**
 * StateCard - Compact list item for animation states
 *
 * Enhanced design with prominent trigger badge, quick preview button,
 * and settings button to open the full StateEditorDrawer.
 */

import { useState, useRef, useEffect } from "react";
import {
  Check,
  X,
  RotateCcw,
  GripVertical,
  Settings,
  Eye,
} from "lucide-react";
import { useAnimationStore } from "../store/animationStore";
import { useStateEditorStore } from "../store/stateEditorStore";
import type { AnimationState } from "../types/animation";
import { TriggerBadge } from "./TriggerBadge";
import { cn } from "@/lib/utils";

interface StateCardProps {
  state: AnimationState;
  isDragging?: boolean;
  /** Callback for quick preview button */
  onQuickPreview?: (stateId: string) => void;
}

export const StateCard = ({ state, isDragging = false, onQuickPreview }: StateCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(state.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeStateId = useAnimationStore((s) => s.activeStateId);
  const selectState = useAnimationStore((s) => s.selectState);
  const updateState = useAnimationStore((s) => s.updateState);
  const syncStateFromLayout = useAnimationStore((s) => s.syncStateFromLayout);

  const openEditor = useStateEditorStore((s) => s.openEditor);
  const setEditorMode = useAnimationStore((s) => s.setEditorMode);

  const isActive = activeStateId === state.id;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(state.name);
  };

  const handleSave = () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== state.name) {
      updateState(state.id, { name: trimmedName });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(state.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    syncStateFromLayout(state.id);
  };

  const handleOpenEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditor(state.id);
  };

  const handleQuickPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Select this state and enter preview mode
    selectState(state.id);
    setEditorMode("preview");
    onQuickPreview?.(state.id);
  };

  return (
    <div
      onClick={() => selectState(state.id)}
      className={cn(
        "group relative flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all cursor-pointer",
        isActive
          ? "border-purple-500 bg-purple-500/10 shadow-sm"
          : "border-border/50 bg-card/50 hover:border-border hover:bg-accent/50",
        isDragging && "cursor-grabbing opacity-60"
      )}
    >
      {/* Drag handle */}
      <div
        className={cn(
          "shrink-0 cursor-grab transition-opacity",
          "opacity-30 group-hover:opacity-60",
          isDragging && "opacity-60 cursor-grabbing"
        )}
        title="Drag to reorder"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Mini thumbnail */}
      <div
        className={cn(
          "shrink-0 w-10 h-6 rounded border overflow-hidden",
          isActive
            ? "border-purple-500/40 bg-purple-500/10"
            : "border-border/50 bg-muted/30"
        )}
      >
        {state.elements.length > 0 ? (
          <svg viewBox="0 0 40 24" className="w-full h-full">
            {state.elements.slice(0, 5).map((el, i) => {
              // Normalize to thumbnail coords
              const scale = 0.04;
              return (
                <rect
                  key={el.elementId}
                  x={2 + (el.x * scale) % 32}
                  y={2 + (el.y * scale) % 16}
                  width={Math.max(3, el.width * scale)}
                  height={Math.max(2, el.height * scale)}
                  fill={isActive ? "rgb(168, 85, 247)" : "currentColor"}
                  fillOpacity={0.3 + i * 0.1}
                  rx={0.5}
                />
              );
            })}
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[6px] text-muted-foreground/40">Empty</span>
          </div>
        )}
      </div>

      {/* State name */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            className="p-0.5 rounded hover:bg-accent"
          >
            <Check className="w-3 h-3 text-emerald-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            className="p-0.5 rounded hover:bg-accent"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className={cn(
            "flex-1 text-xs font-medium truncate min-w-0",
            isActive ? "text-purple-700 dark:text-purple-300" : "text-foreground"
          )}
          title={state.name}
        >
          {state.name}
        </span>
      )}

      {/* Trigger badge - enhanced with TriggerBadge component */}
      <TriggerBadge
        trigger={state.trigger}
        size="sm"
        showLabel={false}
        showElementName={false}
        variant="default"
        isActive={isActive}
        className="shrink-0"
      />

      {/* Quick preview button */}
      <button
        onClick={handleQuickPreview}
        className={cn(
          "shrink-0 p-1 rounded transition-all",
          isActive
            ? "text-purple-500 hover:bg-purple-500/20"
            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent"
        )}
        title="Preview this state"
      >
        <Eye className="w-3 h-3" />
      </button>

      {/* Quick action: Sync from layout - only on hover when active */}
      <button
        onClick={handleSync}
        className={cn(
          "shrink-0 p-1 rounded transition-all",
          isActive
            ? "text-purple-400 hover:bg-purple-500/20 opacity-0 group-hover:opacity-100"
            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent"
        )}
        title="Sync from layout"
      >
        <RotateCcw className="w-3 h-3" />
      </button>

      {/* Settings button - always visible when active */}
      <button
        onClick={handleOpenEditor}
        className={cn(
          "shrink-0 p-1 rounded transition-all",
          isActive
            ? "text-purple-500 hover:bg-purple-500/20"
            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent"
        )}
        title="Edit state settings"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
