/**
 * Trigger Selector Component
 *
 * Dropdown/panel for selecting animation trigger type and configuration.
 * Supports element-based triggers (hover/click/focus) and time-based triggers (auto).
 */

import { useCallback } from "react";
import {
  Play,
  MousePointer2,
  Pointer,
  Focus,
  Timer,
  Scroll,
  Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ANIMATION_CONSTANTS } from "@/lib/constants";
import type {
  AnimationState,
  AnimationTrigger,
  AnimationTriggerType,
  ElementBasedTrigger,
  TimeBasedTrigger,
} from "../types/animation";

interface TriggerSelectorProps {
  /** Current state (to get trigger info and available elements) */
  state: AnimationState;
  /** Called when trigger changes */
  onTriggerChange: (trigger: AnimationTrigger) => void;
  /** Compact mode for inline/dropdown display */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

/** Icon mapping for trigger types */
const triggerIcons: Record<AnimationTriggerType, React.ElementType> = {
  initial: Play,
  hover: MousePointer2,
  click: Pointer,
  focus: Focus,
  scroll: Scroll,
  auto: Timer,
  custom: Code,
};

/** Labels for trigger types */
const triggerLabels: Record<AnimationTriggerType, string> = {
  initial: "Initial",
  hover: "Hover",
  click: "Click",
  focus: "Focus",
  scroll: "Scroll",
  auto: "Auto",
  custom: "Custom",
};

/** Descriptions for trigger types */
const triggerDescriptions: Record<AnimationTriggerType, string> = {
  initial: "Default state shown on load",
  hover: "Triggered when hovering an element",
  click: "Triggered when clicking an element",
  focus: "Triggered when an element receives focus",
  scroll: "Triggered when scrolling into view",
  auto: "Automatically triggered after a delay",
  custom: "Custom trigger for programmatic control",
};

/** All available trigger types in display order */
const TRIGGER_TYPES: AnimationTriggerType[] = [
  "initial",
  "hover",
  "click",
  "focus",
  "auto",
  "scroll",
  "custom",
];

/** Types that support element targeting */
const ELEMENT_TRIGGER_TYPES: AnimationTriggerType[] = ["hover", "click", "focus"];

/** Types that support timing configuration */
const TIMED_TRIGGER_TYPES: AnimationTriggerType[] = ["auto"];

/** Relative timing options */
const RELATIVE_TO_OPTIONS: Array<{
  value: TimeBasedTrigger["relativeTo"];
  label: string;
}> = [
  { value: "animationStart", label: "Animation Start" },
  { value: "previousStateEnd", label: "Previous State End" },
  { value: "previousTransitionEnd", label: "Previous Transition End" },
];

export function TriggerSelector({
  state,
  onTriggerChange,
  compact = false,
  className,
}: TriggerSelectorProps) {
  const { trigger } = state;

  // Handle trigger type change
  const handleTypeChange = useCallback(
    (type: AnimationTriggerType) => {
      const newTrigger: AnimationTrigger = { type };

      // Preserve element config if changing between element types
      if (ELEMENT_TRIGGER_TYPES.includes(type) && trigger.element) {
        newTrigger.element = trigger.element;
      }

      // Initialize timing for auto triggers
      if (type === "auto") {
        newTrigger.timing = trigger.timing ?? {
          delayMs: ANIMATION_CONSTANTS.DEFAULT_AUTO_TRIGGER_DELAY,
          relativeTo: "previousStateEnd",
        };
      }

      // Preserve custom name
      if (type === "custom") {
        newTrigger.customName = trigger.customName ?? "";
      }

      onTriggerChange(newTrigger);
    },
    [trigger, onTriggerChange]
  );

  // Handle element selection
  const handleElementChange = useCallback(
    (elementId: string) => {
      const element = state.elements.find((el) => el.elementId === elementId);
      const elementTrigger: ElementBasedTrigger = {
        targetElementId: elementId,
        targetElementName: element?.elementName,
      };
      onTriggerChange({
        ...trigger,
        element: elementTrigger,
      });
    },
    [state.elements, trigger, onTriggerChange]
  );

  // Handle timing delay change
  const handleDelayChange = useCallback(
    (delayMs: number) => {
      const clampedDelay = Math.max(0, Math.min(10000, delayMs));
      onTriggerChange({
        ...trigger,
        timing: {
          ...trigger.timing,
          delayMs: clampedDelay,
          relativeTo: trigger.timing?.relativeTo ?? "previousStateEnd",
        },
      });
    },
    [trigger, onTriggerChange]
  );

  // Handle relative-to change
  const handleRelativeToChange = useCallback(
    (relativeTo: TimeBasedTrigger["relativeTo"]) => {
      onTriggerChange({
        ...trigger,
        timing: {
          ...trigger.timing,
          delayMs: trigger.timing?.delayMs ?? ANIMATION_CONSTANTS.DEFAULT_AUTO_TRIGGER_DELAY,
          relativeTo,
        },
      });
    },
    [trigger, onTriggerChange]
  );

  // Handle custom name change
  const handleCustomNameChange = useCallback(
    (customName: string) => {
      onTriggerChange({
        ...trigger,
        customName,
      });
    },
    [trigger, onTriggerChange]
  );

  const TriggerIcon = triggerIcons[trigger.type];
  const showElementPicker = ELEMENT_TRIGGER_TYPES.includes(trigger.type);
  const showTimingConfig = TIMED_TRIGGER_TYPES.includes(trigger.type);
  const showCustomName = trigger.type === "custom";

  if (compact) {
    // Compact mode: single select dropdown
    return (
      <div className={cn("space-y-2", className)}>
        <Select value={trigger.type} onValueChange={(v) => handleTypeChange(v as AnimationTriggerType)}>
          <SelectTrigger className="h-8 text-xs">
            <div className="flex items-center gap-1.5">
              <TriggerIcon size={12} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_TYPES.map((type) => {
              const Icon = triggerIcons[type];
              return (
                <SelectItem key={type} value={type} className="text-xs">
                  <div className="flex items-center gap-2">
                    <Icon size={12} />
                    <span>{triggerLabels[type]}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Inline element picker for element triggers */}
        {showElementPicker && (
          <Select
            value={trigger.element?.targetElementId ?? ""}
            onValueChange={handleElementChange}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select element..." />
            </SelectTrigger>
            <SelectContent>
              {state.elements.map((el) => (
                <SelectItem
                  key={el.elementId}
                  value={el.elementId}
                  className="text-xs"
                >
                  {el.elementName || el.elementId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Inline timing config for auto triggers */}
        {showTimingConfig && (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={trigger.timing?.delayMs ?? ANIMATION_CONSTANTS.DEFAULT_AUTO_TRIGGER_DELAY}
              onChange={(e) => handleDelayChange(Number(e.target.value))}
              className="h-6 w-16 text-xs"
              min={0}
              max={10000}
              step={100}
            />
            <span className="text-[10px] text-muted-foreground">ms after</span>
            <Select
              value={trigger.timing?.relativeTo ?? "previousStateEnd"}
              onValueChange={(v) => handleRelativeToChange(v as TimeBasedTrigger["relativeTo"])}
            >
              <SelectTrigger className="h-6 text-[10px] flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIVE_TO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  }

  // Full mode: expanded panel with descriptions
  return (
    <div className={cn("space-y-4", className)}>
      {/* Trigger Type */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Trigger Type</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {TRIGGER_TYPES.map((type) => {
            const Icon = triggerIcons[type];
            const isSelected = trigger.type === type;
            return (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-md border text-xs transition-colors",
                  isSelected
                    ? "bg-purple-500/15 border-purple-500/50 text-purple-600 dark:text-purple-400"
                    : "bg-background border-border hover:bg-accent hover:border-primary/30"
                )}
              >
                <Icon size={14} className={isSelected ? "text-purple-500" : "text-muted-foreground"} />
                <span className="font-medium">{triggerLabels[type]}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {triggerDescriptions[trigger.type]}
        </p>
      </div>

      {/* Element Picker for hover/click/focus */}
      {showElementPicker && (
        <div className="space-y-2 pl-2 border-l-2 border-purple-500/30">
          <Label className="text-xs">Target Element</Label>
          <Select
            value={trigger.element?.targetElementId ?? ""}
            onValueChange={handleElementChange}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select an element..." />
            </SelectTrigger>
            <SelectContent>
              {state.elements.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No elements in this state
                </div>
              ) : (
                state.elements.map((el) => (
                  <SelectItem
                    key={el.elementId}
                    value={el.elementId}
                    className="text-xs"
                  >
                    {el.elementName || el.elementId}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {trigger.element && (
            <p className="text-[10px] text-muted-foreground">
              State will activate when user {trigger.type}s on "{trigger.element.targetElementName || trigger.element.targetElementId}"
            </p>
          )}
        </div>
      )}

      {/* Timing Config for auto triggers */}
      {showTimingConfig && (
        <div className="space-y-3 pl-2 border-l-2 border-purple-500/30">
          <div className="space-y-2">
            <Label className="text-xs">Delay</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={trigger.timing?.delayMs ?? ANIMATION_CONSTANTS.DEFAULT_AUTO_TRIGGER_DELAY}
                onChange={(e) => handleDelayChange(Number(e.target.value))}
                className="h-7 w-24 text-xs"
                min={0}
                max={10000}
                step={100}
              />
              <span className="text-xs text-muted-foreground">ms</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Relative To</Label>
            <Select
              value={trigger.timing?.relativeTo ?? "previousStateEnd"}
              onValueChange={(v) => handleRelativeToChange(v as TimeBasedTrigger["relativeTo"])}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIVE_TO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground">
            State will activate {trigger.timing?.delayMs ?? 0}ms after {
              trigger.timing?.relativeTo === "animationStart" ? "animation starts" :
              trigger.timing?.relativeTo === "previousTransitionEnd" ? "previous transition ends" :
              "previous state ends"
            }
          </p>
        </div>
      )}

      {/* Custom Name for custom triggers */}
      {showCustomName && (
        <div className="space-y-2 pl-2 border-l-2 border-purple-500/30">
          <Label className="text-xs">Custom Trigger Name</Label>
          <Input
            type="text"
            value={trigger.customName ?? ""}
            onChange={(e) => handleCustomNameChange(e.target.value)}
            className="h-8 text-xs"
            placeholder="my-custom-trigger"
          />
          <p className="text-[10px] text-muted-foreground">
            Use this name to trigger the state programmatically
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Trigger Badge Component
 * Small inline badge showing current trigger type
 */
export function TriggerBadge({
  trigger,
  className,
}: {
  trigger: AnimationTrigger;
  className?: string;
}) {
  const Icon = triggerIcons[trigger.type];
  const label = triggerLabels[trigger.type];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]",
        "bg-muted text-muted-foreground",
        className
      )}
    >
      <Icon size={10} />
      <span>{label}</span>
      {trigger.element?.targetElementName && (
        <span className="text-purple-500 truncate max-w-12">
          ({trigger.element.targetElementName})
        </span>
      )}
    </div>
  );
}
