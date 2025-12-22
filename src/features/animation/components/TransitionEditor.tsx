/**
 * Transition Editor Component
 *
 * Panel for editing transition properties: duration, delay, easing,
 * stagger configuration, and per-element overrides.
 * Uses unified NumericInput controls with professional styling.
 */

import { useCallback } from "react";
import {
  Trash2,
  Clock,
  Zap,
  Shuffle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ANIMATION_CONSTANTS } from "@/lib/constants";
import { useAnimationStore } from "../store/animationStore";
import type { EasingPreset, StaggerConfig } from "../types/transition";
import type { CascadeConfig, CascadeStaggerDirection } from "../types/cascade";
import { DEFAULT_CASCADE_CONFIG } from "../types/cascade";
import { EasingPreview } from "./EasingPreview";
import { CascadePresetsCompact } from "./CascadePresets";
import { LayoutAnimationControls } from "./LayoutAnimationControls";
import {
  EASING_PRESET_OPTIONS,
  EASING_PRESET_LABELS,
} from "../utils/easingUtils";

interface TransitionEditorProps {
  transitionId: string;
  className?: string;
}

export function TransitionEditor({
  transitionId,
  className,
}: TransitionEditorProps) {
  const transition = useAnimationStore((state) =>
    state.getTransition(transitionId)
  );
  const getState = useAnimationStore((state) => state.getState);
  const updateTransition = useAnimationStore((state) => state.updateTransition);
  const updateTransitionCascade = useAnimationStore(
    (state) => state.updateTransitionCascade
  );
  const deleteTransition = useAnimationStore((state) => state.deleteTransition);
  const selectTransition = useAnimationStore((state) => state.selectTransition);

  const handleDurationChange = useCallback(
    (value: number) => {
      updateTransition(transitionId, {
        duration: Math.max(
          ANIMATION_CONSTANTS.MIN_TRANSITION_DURATION,
          Math.min(ANIMATION_CONSTANTS.MAX_TRANSITION_DURATION, value)
        ),
      });
    },
    [transitionId, updateTransition]
  );

  const handleDelayChange = useCallback(
    (value: number) => {
      updateTransition(transitionId, {
        delay: Math.max(0, Math.min(ANIMATION_CONSTANTS.MAX_DELAY, value)),
      });
    },
    [transitionId, updateTransition]
  );

  const handleEasingChange = useCallback(
    (preset: EasingPreset) => {
      updateTransition(transitionId, {
        easing: { preset },
      });
    },
    [transitionId, updateTransition]
  );

  const handleStaggerToggle = useCallback(
    (enabled: boolean) => {
      updateTransition(transitionId, {
        stagger: enabled
          ? {
              enabled: true,
              delay: ANIMATION_CONSTANTS.DEFAULT_STAGGER_DELAY,
              from: "start",
            }
          : undefined,
      });
    },
    [transitionId, updateTransition]
  );

  const handleStaggerUpdate = useCallback(
    (updates: Partial<StaggerConfig>) => {
      if (!transition?.stagger) return;
      updateTransition(transitionId, {
        stagger: { ...transition.stagger, ...updates },
      });
    },
    [transitionId, transition?.stagger, updateTransition]
  );

  // Cascade handlers
  const handleCascadeToggle = useCallback(
    (enabled: boolean) => {
      updateTransitionCascade(transitionId, {
        ...DEFAULT_CASCADE_CONFIG,
        enabled,
      });
    },
    [transitionId, updateTransitionCascade]
  );

  const handleCascadeUpdate = useCallback(
    (updates: Partial<CascadeConfig>) => {
      updateTransitionCascade(transitionId, updates);
    },
    [transitionId, updateTransitionCascade]
  );

  const handleDelete = useCallback(() => {
    selectTransition(null);
    deleteTransition(transitionId);
  }, [transitionId, deleteTransition, selectTransition]);

  if (!transition) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <p className="text-sm">Transition not found</p>
      </div>
    );
  }

  const fromState = getState(transition.fromStateId);
  const toState = getState(transition.toStateId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Zap size={14} className="text-purple-500" />
            Transition
          </h3>
          <p className="text-xs text-muted-foreground">
            {fromState?.name ?? "?"} → {toState?.name ?? "?"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1">
          <Clock size={12} />
          Duration
        </Label>
        <NumericInput
          value={transition.duration}
          onChange={handleDurationChange}
          min={ANIMATION_CONSTANTS.MIN_TRANSITION_DURATION}
          max={ANIMATION_CONSTANTS.MAX_TRANSITION_DURATION}
          step={50}
          unit="ms"
          showSlider
          sliderPosition="below"
          sliderStep={50}
        />
      </div>

      {/* Delay */}
      <div className="space-y-2">
        <Label className="text-xs">Delay</Label>
        <NumericInput
          value={transition.delay}
          onChange={handleDelayChange}
          min={0}
          max={ANIMATION_CONSTANTS.MAX_DELAY}
          step={50}
          unit="ms"
          showSlider
          sliderPosition="below"
          sliderStep={50}
        />
      </div>

      {/* Easing */}
      <div className="space-y-2">
        <Label className="text-xs">Easing</Label>
        <Select
          value={transition.easing.preset}
          onValueChange={(value) => handleEasingChange(value as EasingPreset)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EASING_PRESET_OPTIONS.map((preset) => (
              <SelectItem key={preset} value={preset} className="text-xs">
                {EASING_PRESET_LABELS[preset]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Easing curve preview */}
        <EasingPreview
          easing={transition.easing}
          width={200}
          height={80}
          className="w-full"
          animated
        />
      </div>

      {/* Stagger */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-1">
            <Shuffle size={12} />
            Stagger
          </Label>
          <Switch
            checked={transition.stagger?.enabled ?? false}
            onCheckedChange={handleStaggerToggle}
          />
        </div>

        {transition.stagger?.enabled && (
          <div className="space-y-3 pl-1">
            {/* Stagger delay */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Delay per element
              </Label>
              <NumericInput
                value={transition.stagger.delay}
                onChange={(value) => handleStaggerUpdate({ delay: value })}
                min={0}
                max={500}
                step={10}
                unit="ms"
                showSlider
                sliderPosition="below"
                sliderStep={10}
                size="sm"
              />
            </div>

            {/* Stagger direction */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Select
                value={transition.stagger.from}
                onValueChange={(value) =>
                  handleStaggerUpdate({
                    from: value as StaggerConfig["from"],
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start" className="text-xs">
                    Start (first to last)
                  </SelectItem>
                  <SelectItem value="end" className="text-xs">
                    End (last to first)
                  </SelectItem>
                  <SelectItem value="center" className="text-xs">
                    Center (outward)
                  </SelectItem>
                  <SelectItem value="random" className="text-xs">
                    Random
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Cascade Animation */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-1">
            <Layers size={12} />
            Cascade Animation
          </Label>
          <Switch
            checked={transition.cascade?.enabled ?? false}
            onCheckedChange={handleCascadeToggle}
          />
        </div>

        {transition.cascade?.enabled && (
          <div className="space-y-3 pl-1">
            {/* Cascade Presets */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Presets</Label>
              <CascadePresetsCompact
                transitionId={transitionId}
                activePreset={undefined}
              />
            </div>

            {/* Delay per level */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Delay per level
              </Label>
              <NumericInput
                value={transition.cascade.delayPerLevel}
                onChange={(value) => handleCascadeUpdate({ delayPerLevel: value })}
                min={0}
                max={500}
                step={10}
                unit="ms"
                showSlider
                sliderPosition="below"
                sliderStep={10}
                size="sm"
              />
            </div>

            {/* Stagger amount */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Stagger amount
              </Label>
              <NumericInput
                value={transition.cascade.stagger.amount}
                onChange={(value) =>
                  handleCascadeUpdate({
                    stagger: {
                      ...transition.cascade!.stagger,
                      amount: value,
                    },
                  })
                }
                min={0}
                max={300}
                step={10}
                unit="ms"
                showSlider
                sliderPosition="below"
                sliderStep={10}
                size="sm"
              />
            </div>

            {/* Stagger direction */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Direction</Label>
              <Select
                value={transition.cascade.stagger.direction}
                onValueChange={(value) =>
                  handleCascadeUpdate({
                    stagger: {
                      ...transition.cascade!.stagger,
                      direction: value as CascadeStaggerDirection,
                    },
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" className="text-xs">
                    Normal (top to bottom)
                  </SelectItem>
                  <SelectItem value="reverse" className="text-xs">
                    Reverse (bottom to top)
                  </SelectItem>
                  <SelectItem value="center-out" className="text-xs">
                    Center outward
                  </SelectItem>
                  <SelectItem value="edges-in" className="text-xs">
                    Edges inward
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration scale */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Duration scale
                </Label>
                <span className="text-xs text-muted-foreground">
                  {transition.cascade.durationScale.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[transition.cascade.durationScale]}
                onValueChange={([value]: number[]) =>
                  handleCascadeUpdate({ durationScale: value })
                }
                min={0.5}
                max={1.5}
                step={0.05}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Layout Animation */}
      <div className="pt-2 border-t border-border">
        <LayoutAnimationControls transitionId={transitionId} />
      </div>

      {/* Element overrides (simplified) */}
      {transition.elementOverrides.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-xs flex items-center gap-1">
            Element Overrides
            <span className="text-muted-foreground">
              ({transition.elementOverrides.length})
            </span>
          </Label>
          <div className="text-xs text-muted-foreground">
            Per-element timing controls coming soon
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Wrapper that shows TransitionEditor when a transition is selected
 */
export function TransitionEditorPanel() {
  const selectedTransitionId = useAnimationStore(
    (state) => state.selectedTransitionId
  );

  if (!selectedTransitionId) {
    return null;
  }

  return (
    <div
      className="shrink-0 max-h-[45vh] flex flex-col border-t border-purple-500/30 bg-purple-500/5"
      data-transition-editor-panel
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
        <TransitionEditor transitionId={selectedTransitionId} />
      </div>
    </div>
  );
}
