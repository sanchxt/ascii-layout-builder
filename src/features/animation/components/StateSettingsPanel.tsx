/**
 * State Settings Panel Component
 *
 * Full configuration panel for editing animation state properties.
 * Displayed in the sidebar when a state is selected.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Check, X, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAnimationStore } from "../store/animationStore";
import { TriggerSelector } from "./TriggerSelector";
import { HoldTimeControl } from "./HoldTimeControl";
import type { AnimationTrigger } from "../types/animation";

interface StateSettingsPanelProps {
  stateId: string;
  className?: string;
}

export function StateSettingsPanel({
  stateId,
  className,
}: StateSettingsPanelProps) {
  const state = useAnimationStore((s) => s.getState(stateId));
  const updateState = useAnimationStore((s) => s.updateState);
  const updateStateTrigger = useAnimationStore((s) => s.updateStateTrigger);
  const updateStateHoldTime = useAnimationStore((s) => s.updateStateHoldTime);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(state?.name ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit name when state changes
  useEffect(() => {
    if (state?.name && !isEditingName) {
      setEditName(state.name);
    }
  }, [state?.name, isEditingName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  // Handle name save
  const handleNameSave = useCallback(() => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== state?.name) {
      updateState(stateId, { name: trimmedName });
    }
    setIsEditingName(false);
  }, [editName, state?.name, stateId, updateState]);

  // Handle name cancel
  const handleNameCancel = useCallback(() => {
    setEditName(state?.name ?? "");
    setIsEditingName(false);
  }, [state?.name]);

  // Handle name keydown
  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleNameSave();
      } else if (e.key === "Escape") {
        handleNameCancel();
      }
    },
    [handleNameSave, handleNameCancel]
  );

  // Handle trigger change
  const handleTriggerChange = useCallback(
    (trigger: AnimationTrigger) => {
      updateStateTrigger(stateId, trigger);
    },
    [stateId, updateStateTrigger]
  );

  // Handle hold time change
  const handleHoldTimeChange = useCallback(
    (holdTime: number) => {
      updateStateHoldTime(stateId, holdTime);
    },
    [stateId, updateStateHoldTime]
  );

  if (!state) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <p className="text-sm">State not found</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings2 size={14} className="text-purple-500" />
        <h3 className="text-sm font-semibold">State Settings</h3>
      </div>

      {/* State Name */}
      <div className="space-y-2">
        <Label className="text-xs">State Name</Label>
        {isEditingName ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameSave}
              className="h-8 text-sm"
            />
            <button
              onClick={handleNameSave}
              className="p-1.5 rounded hover:bg-accent"
            >
              <Check className="w-3.5 h-3.5 text-primary" />
            </button>
            <button
              onClick={handleNameCancel}
              className="p-1.5 rounded hover:bg-accent"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            {state.name}
          </button>
        )}
      </div>

      {/* Trigger Configuration */}
      <div className="space-y-2 pt-2 border-t border-border">
        <TriggerSelector
          state={state}
          onTriggerChange={handleTriggerChange}
        />
      </div>

      {/* Hold Time */}
      <div className="space-y-2 pt-2 border-t border-border">
        <HoldTimeControl
          value={state.holdTime}
          onChange={handleHoldTimeChange}
        />
      </div>

      {/* State Info */}
      <div className="pt-2 border-t border-border space-y-1.5 text-[10px] text-muted-foreground">
        <div className="flex justify-between">
          <span>Elements</span>
          <span className="font-mono">{state.elements.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Order</span>
          <span className="font-mono">{state.order + 1}</span>
        </div>
        <div className="flex justify-between">
          <span>Created</span>
          <span className="font-mono">
            {new Date(state.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper that shows StateSettingsPanel when a state is selected
 * (but not when a transition is selected)
 */
export function StateSettingsPanelWrapper() {
  const activeStateId = useAnimationStore((s) => s.activeStateId);
  const selectedTransitionId = useAnimationStore((s) => s.selectedTransitionId);

  // Don't show if no state selected or if transition is selected
  if (!activeStateId || selectedTransitionId) {
    return null;
  }

  return (
    <div className="p-4 border-t border-purple-500/30 bg-purple-500/5">
      <StateSettingsPanel stateId={activeStateId} />
    </div>
  );
}
