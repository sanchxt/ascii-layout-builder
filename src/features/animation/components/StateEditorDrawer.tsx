/**
 * State Editor Drawer Component
 *
 * A comprehensive slide-over drawer for editing animation state properties.
 * Consolidates all state editing functionality into one dedicated panel.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  X,
  Check,
  RefreshCw,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SlideOverDrawer } from "@/components/ui/slide-over-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/zIndex";
import { LAYOUT_CONSTANTS } from "@/lib/constants";
import { useIsDesktop, useIsTablet } from "@/lib/useMediaQuery";
import { useStateEditorStore } from "../store/stateEditorStore";
import { useAnimationStore } from "../store/animationStore";
import { TriggerSelector } from "./TriggerSelector";
import { HoldTimeControl } from "./HoldTimeControl";
import { StateThumbnail } from "./StateThumbnail";
import type { AnimationTrigger, AnimationStateElement } from "../types/animation";

export function StateEditorDrawer() {
  const { isOpen, editingStateId, closeEditor } = useStateEditorStore();
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();

  // Match right sidebar width for perfect alignment
  const drawerWidth = isDesktop
    ? LAYOUT_CONSTANTS.RIGHT_SIDEBAR_WIDTH
    : isTablet
    ? LAYOUT_CONSTANTS.RIGHT_SIDEBAR_WIDTH_TABLET
    : undefined; // Full screen on mobile via SlideOverDrawer prop

  const state = useAnimationStore((s) =>
    editingStateId ? s.getState(editingStateId) : undefined
  );
  const updateState = useAnimationStore((s) => s.updateState);
  const updateStateTrigger = useAnimationStore((s) => s.updateStateTrigger);
  const updateStateHoldTime = useAnimationStore((s) => s.updateStateHoldTime);
  const updateStateElement = useAnimationStore((s) => s.updateStateElement);
  const syncStateFromLayout = useAnimationStore((s) => s.syncStateFromLayout);
  const duplicateState = useAnimationStore((s) => s.duplicateState);
  const deleteState = useAnimationStore((s) => s.deleteState);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showElements, setShowElements] = useState(true);
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
    if (!editingStateId) return;
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== state?.name) {
      updateState(editingStateId, { name: trimmedName });
    }
    setIsEditingName(false);
  }, [editName, state?.name, editingStateId, updateState]);

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
      if (!editingStateId) return;
      updateStateTrigger(editingStateId, trigger);
    },
    [editingStateId, updateStateTrigger]
  );

  // Handle hold time change
  const handleHoldTimeChange = useCallback(
    (holdTime: number) => {
      if (!editingStateId) return;
      updateStateHoldTime(editingStateId, holdTime);
    },
    [editingStateId, updateStateHoldTime]
  );

  // Handle element visibility toggle
  const handleElementVisibilityToggle = useCallback(
    (elementId: string, visible: boolean) => {
      if (!editingStateId) return;
      updateStateElement(editingStateId, elementId, { visible });
    },
    [editingStateId, updateStateElement]
  );

  // Handle element opacity change
  const handleElementOpacityChange = useCallback(
    (elementId: string, opacity: number) => {
      if (!editingStateId) return;
      updateStateElement(editingStateId, elementId, { opacity });
    },
    [editingStateId, updateStateElement]
  );

  // Handle sync from layout
  const handleSync = useCallback(() => {
    if (!editingStateId) return;
    syncStateFromLayout(editingStateId);
  }, [editingStateId, syncStateFromLayout]);

  // Handle duplicate
  const handleDuplicate = useCallback(() => {
    if (!editingStateId) return;
    const newId = duplicateState(editingStateId);
    if (newId) {
      // Open the new state in editor
      useStateEditorStore.getState().openEditor(newId);
    }
  }, [editingStateId, duplicateState]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!editingStateId) return;
    if (window.confirm("Are you sure you want to delete this state?")) {
      deleteState(editingStateId);
      closeEditor();
    }
  }, [editingStateId, deleteState, closeEditor]);

  if (!state) {
    return (
      <SlideOverDrawer
        isOpen={isOpen}
        onClose={closeEditor}
        title="State Editor"
        width={drawerWidth || 288}
        zIndex={Z_INDEX.STATE_EDITOR}
        showBackdrop={false}
        fullScreenOnMobile={true}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">No state selected</p>
        </div>
      </SlideOverDrawer>
    );
  }

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={closeEditor}
      title="State Editor"
      width={drawerWidth || 288}
      zIndex={Z_INDEX.STATE_EDITOR}
      showBackdrop={false}
      fullScreenOnMobile={true}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* State Name */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Name
              </Label>
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={handleNameSave}
                    className="h-9 text-sm flex-1"
                  />
                  <button
                    onClick={handleNameSave}
                    className="p-2 rounded-md hover:bg-accent shrink-0"
                  >
                    <Check className="w-4 h-4 text-emerald-500" />
                  </button>
                  <button
                    onClick={handleNameCancel}
                    className="p-2 rounded-md hover:bg-accent shrink-0"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
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
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Trigger
              </Label>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <TriggerSelector
                  state={state}
                  onTriggerChange={handleTriggerChange}
                />
              </div>
            </div>

            {/* Hold Time */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Hold Time
              </Label>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <HoldTimeControl
                  value={state.holdTime}
                  onChange={handleHoldTimeChange}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Preview
              </Label>
              <div className="w-full">
                <StateThumbnail
                  elements={state.elements}
                  isActive={true}
                  className="w-full aspect-video"
                />
              </div>
            </div>

            {/* Elements List */}
            <div className="space-y-2">
              <button
                onClick={() => setShowElements(!showElements)}
                className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Elements ({state.elements.length})</span>
                {showElements ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showElements && (
                <div className="bg-muted/30 rounded-lg border border-border/50 divide-y divide-border/50 max-h-[200px] overflow-y-auto">
                  {state.elements.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No elements in this state
                    </div>
                  ) : (
                    state.elements.map((el) => (
                      <ElementRow
                        key={el.elementId}
                        element={el}
                        onToggleVisibility={(visible) =>
                          handleElementVisibilityToggle(el.elementId, visible)
                        }
                        onOpacityChange={(opacity) =>
                          handleElementOpacityChange(el.elementId, opacity)
                        }
                      />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* State Info */}
            <div className="space-y-1.5 text-[10px] text-muted-foreground bg-muted/20 rounded-lg p-3">
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
              <div className="flex justify-between">
                <span>Updated</span>
                <span className="font-mono">
                  {new Date(state.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons - Fixed at bottom */}
        <div className="shrink-0 p-4 border-t border-border bg-muted/30 flex items-center gap-2">
          <button
            onClick={handleSync}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors"
            title="Sync from current layout"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
          <button
            onClick={handleDuplicate}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors"
            title="Duplicate state"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-colors"
            title="Delete state"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </SlideOverDrawer>
  );
}

/**
 * Element row within the elements list
 */
interface ElementRowProps {
  element: AnimationStateElement;
  onToggleVisibility: (visible: boolean) => void;
  onOpacityChange: (opacity: number) => void;
}

function ElementRow({
  element,
  onToggleVisibility,
  onOpacityChange,
}: ElementRowProps) {
  const [showOpacity, setShowOpacity] = useState(false);

  return (
    <div className="px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleVisibility(!element.visible)}
          className={cn(
            "p-1 rounded hover:bg-accent transition-colors",
            element.visible ? "text-foreground" : "text-muted-foreground/50"
          )}
        >
          {element.visible ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
        </button>
        <span
          className={cn(
            "flex-1 text-xs font-medium truncate",
            !element.visible && "text-muted-foreground/50"
          )}
        >
          {element.elementName}
        </span>
        <button
          onClick={() => setShowOpacity(!showOpacity)}
          className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent"
        >
          {Math.round(element.opacity * 100)}%
        </button>
      </div>

      {showOpacity && (
        <div className="pl-7 pr-1 flex items-center gap-2">
          <Slider
            value={[element.opacity * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={([value]) => onOpacityChange(value / 100)}
            className="flex-1"
          />
          <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
            {Math.round(element.opacity * 100)}%
          </span>
        </div>
      )}

      {/* Position info */}
      <div className="pl-7 flex items-center gap-3 text-[9px] font-mono text-muted-foreground/70">
        <span>
          x:{Math.round(element.x)} y:{Math.round(element.y)}
        </span>
        <span>
          {Math.round(element.width)}x{Math.round(element.height)}
        </span>
      </div>
    </div>
  );
}
