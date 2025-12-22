/**
 * Animation Chain Editor Component
 *
 * Allows users to create and edit animation chains - sequences of
 * state transitions that play automatically.
 *
 * Features:
 * - Chain list with CRUD operations
 * - Step sequence editor with drag-to-reorder
 * - Playback controls for chains
 * - Duration and timing configuration per step
 */

import { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Clock,
  Repeat,
  ArrowRight,
  Settings2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAnimationStore } from "../store/animationStore";
import type { AnimationChain, ChainStep, ChainPlaybackMode } from "../types/chain";
import { calculateChainTiming } from "../types/chain";

interface AnimationChainEditorProps {
  artboardId: string;
  className?: string;
}

export function AnimationChainEditor({
  artboardId,
  className,
}: AnimationChainEditorProps) {
  const chains = useAnimationStore((s) => s.getChainsForArtboard(artboardId));
  const states = useAnimationStore((s) => s.getStatesForArtboard(artboardId));
  const selectedChainId = useAnimationStore((s) => s.selectedChainId);
  const chainPlayback = useAnimationStore((s) => s.chainPlayback);

  const createChain = useAnimationStore((s) => s.createChain);
  const deleteChain = useAnimationStore((s) => s.deleteChain);
  const duplicateChain = useAnimationStore((s) => s.duplicateChain);
  const selectChain = useAnimationStore((s) => s.selectChain);
  const playChain = useAnimationStore((s) => s.playChain);
  const stopChain = useAnimationStore((s) => s.stopChain);

  const [expandedChainId, setExpandedChainId] = useState<string | null>(null);

  // Get selected chain
  const selectedChain = chains.find((c) => c.id === selectedChainId);

  // Handle create new chain
  const handleCreateChain = useCallback(() => {
    if (states.length === 0) return;
    const firstState = states[0];
    createChain(artboardId, firstState.id);
  }, [artboardId, states, createChain]);

  // Handle play/stop chain
  const handlePlayChain = useCallback(
    (chainId: string) => {
      if (chainPlayback.activeChainId === chainId) {
        stopChain();
      } else {
        playChain(chainId);
      }
    },
    [chainPlayback.activeChainId, playChain, stopChain]
  );

  // Toggle chain expansion
  const toggleExpand = useCallback(
    (chainId: string) => {
      setExpandedChainId((prev) => (prev === chainId ? null : chainId));
    },
    []
  );

  if (states.length === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <p className="text-sm">Create animation states first to build chains.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">Animation Chains</span>
          <span className="text-xs text-muted-foreground">
            ({chains.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1"
          onClick={handleCreateChain}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs">New Chain</span>
        </Button>
      </div>

      {/* Chain list */}
      {chains.length === 0 ? (
        <div className="p-4 border border-dashed border-border rounded-md text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No animation chains yet
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={handleCreateChain}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create Chain
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {chains.map((chain) => {
            const isExpanded = expandedChainId === chain.id;
            const isSelected = selectedChainId === chain.id;
            const isPlaying = chainPlayback.activeChainId === chain.id;
            const timing = calculateChainTiming(chain);

            return (
              <div
                key={chain.id}
                className={cn(
                  "border rounded-md overflow-hidden transition-colors",
                  isSelected
                    ? "border-orange-500 bg-orange-500/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                {/* Chain header */}
                <div
                  className="flex items-center gap-2 p-2 cursor-pointer"
                  onClick={() => selectChain(chain.id)}
                >
                  {/* Expand toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(chain.id);
                    }}
                    className="p-0.5 hover:bg-muted rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Chain name */}
                  <span className="flex-1 text-sm font-medium truncate">
                    {chain.name}
                  </span>

                  {/* Step count */}
                  <span className="text-xs text-muted-foreground">
                    {chain.steps.length} steps
                  </span>

                  {/* Duration */}
                  <span className="text-xs text-muted-foreground">
                    {Math.round(timing.cycleDuration)}ms
                  </span>

                  {/* Play/Stop button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0",
                      isPlaying && "text-orange-500"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayChain(chain.id);
                    }}
                  >
                    {isPlaying ? (
                      <Square className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </Button>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateChain(chain.id);
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChain(chain.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-3 bg-muted/20">
                    <ChainDetails chain={chain} states={states} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Chain details panel
 */
function ChainDetails({
  chain,
  states,
}: {
  chain: AnimationChain;
  states: { id: string; name: string }[];
}) {
  const updateChain = useAnimationStore((s) => s.updateChain);
  const addChainStep = useAnimationStore((s) => s.addChainStep);
  const updateChainStep = useAnimationStore((s) => s.updateChainStep);
  const removeChainStep = useAnimationStore((s) => s.removeChainStep);

  // State name lookup
  const stateNameMap = useMemo(
    () => new Map(states.map((s) => [s.id, s.name])),
    [states]
  );

  // Get start state name
  const startStateName = stateNameMap.get(chain.startStateId) || "Unknown";

  return (
    <div className="space-y-4">
      {/* Chain settings */}
      <div className="space-y-3">
        {/* Name */}
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={chain.name}
            onChange={(e) => updateChain(chain.id, { name: e.target.value })}
            className="h-7 text-xs"
          />
        </div>

        {/* Start state */}
        <div className="space-y-1">
          <Label className="text-xs">Start State</Label>
          <Select
            value={chain.startStateId}
            onValueChange={(value) =>
              updateChain(chain.id, { startStateId: value })
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id} className="text-xs">
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Playback mode */}
        <div className="space-y-1">
          <Label className="text-xs">Playback Mode</Label>
          <Select
            value={chain.playbackMode}
            onValueChange={(value) =>
              updateChain(chain.id, {
                playbackMode: value as ChainPlaybackMode,
              })
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once" className="text-xs">
                Play Once
              </SelectItem>
              <SelectItem value="loop" className="text-xs">
                Loop
              </SelectItem>
              <SelectItem value="ping-pong" className="text-xs">
                Ping-Pong
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Speed multiplier */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Speed</Label>
            <span className="text-xs text-muted-foreground">
              {chain.speedMultiplier}x
            </span>
          </div>
          <Slider
            value={[chain.speedMultiplier]}
            min={0.25}
            max={3}
            step={0.25}
            onValueChange={([value]) =>
              updateChain(chain.id, { speedMultiplier: value })
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Steps section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Steps</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 gap-1"
            onClick={() => {
              const nextState = states.find((s) => s.id !== chain.startStateId);
              if (nextState) {
                addChainStep(chain.id, nextState.id);
              }
            }}
          >
            <Plus className="w-3 h-3" />
            <span className="text-xs">Add</span>
          </Button>
        </div>

        {/* Start state indicator */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-green-500/10 border border-green-500/30 rounded text-xs">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-medium text-green-600 dark:text-green-400">
            Start: {startStateName}
          </span>
        </div>

        {/* Step list */}
        {chain.steps.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No steps added yet
          </p>
        ) : (
          <div className="space-y-1">
            {chain.steps.map((step, index) => (
              <ChainStepRow
                key={step.id}
                step={step}
                index={index}
                chainId={chain.id}
                states={states}
                stateNameMap={stateNameMap}
                onUpdate={(updates) =>
                  updateChainStep(chain.id, step.id, updates)
                }
                onRemove={() => removeChainStep(chain.id, step.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual chain step row
 */
function ChainStepRow({
  step,
  index,
  chainId,
  states,
  stateNameMap,
  onUpdate,
  onRemove,
}: {
  step: ChainStep;
  index: number;
  chainId: string;
  states: { id: string; name: string }[];
  stateNameMap: Map<string, string>;
  onUpdate: (updates: Partial<Omit<ChainStep, "id">>) => void;
  onRemove: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stateName = stateNameMap.get(step.stateId) || "Unknown";

  return (
    <div className="border border-border rounded overflow-hidden">
      {/* Step header */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30">
        {/* Drag handle (for future drag-to-reorder) */}
        <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />

        {/* Step number */}
        <span className="text-[10px] font-mono text-muted-foreground w-4">
          {index + 1}.
        </span>

        {/* Arrow indicator */}
        <ArrowRight className="w-3 h-3 text-muted-foreground" />

        {/* State selector */}
        <Select
          value={step.stateId}
          onValueChange={(value) => onUpdate({ stateId: value })}
        >
          <SelectTrigger className="h-6 text-xs flex-1 border-0 bg-transparent p-0 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state.id} value={state.id} className="text-xs">
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick duration display */}
        <span className="text-[10px] text-muted-foreground">
          {step.transitionDuration}ms
        </span>

        {/* Expand toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 hover:bg-muted rounded"
        >
          <Settings2 className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="p-0.5 hover:bg-destructive/10 rounded text-destructive"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Expanded settings */}
      {isExpanded && (
        <div className="px-2 py-2 space-y-2 bg-muted/10 border-t border-border">
          {/* Transition duration */}
          <div className="flex items-center gap-2">
            <Label className="text-[10px] w-16">Duration</Label>
            <Input
              type="number"
              value={step.transitionDuration}
              onChange={(e) =>
                onUpdate({ transitionDuration: parseInt(e.target.value) || 0 })
              }
              className="h-6 text-xs flex-1"
              min={0}
              step={50}
            />
            <span className="text-[10px] text-muted-foreground">ms</span>
          </div>

          {/* Delay */}
          <div className="flex items-center gap-2">
            <Label className="text-[10px] w-16">Delay</Label>
            <Input
              type="number"
              value={step.delay}
              onChange={(e) =>
                onUpdate({ delay: parseInt(e.target.value) || 0 })
              }
              className="h-6 text-xs flex-1"
              min={0}
              step={50}
            />
            <span className="text-[10px] text-muted-foreground">ms</span>
          </div>

          {/* Hold time */}
          <div className="flex items-center gap-2">
            <Label className="text-[10px] w-16">Hold</Label>
            <Input
              type="number"
              value={step.holdTime}
              onChange={(e) =>
                onUpdate({ holdTime: parseInt(e.target.value) || 0 })
              }
              className="h-6 text-xs flex-1"
              min={0}
              step={50}
            />
            <span className="text-[10px] text-muted-foreground">ms</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact chain indicator for use elsewhere
 */
export function ChainIndicator({ artboardId }: { artboardId: string }) {
  const chains = useAnimationStore((s) => s.getChainsForArtboard(artboardId));
  const chainPlayback = useAnimationStore((s) => s.chainPlayback);

  const activeChain = chains.find((c) => c.id === chainPlayback.activeChainId);

  if (!activeChain) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded text-xs text-orange-600 dark:text-orange-400">
      <Repeat className="w-3 h-3 animate-spin" style={{ animationDuration: "2s" }} />
      <span>Playing: {activeChain.name}</span>
    </div>
  );
}
