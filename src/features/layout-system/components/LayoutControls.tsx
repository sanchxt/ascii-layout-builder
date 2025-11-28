import { useCallback, useState } from "react";
import {
  LayoutGrid,
  Columns,
  ArrowRight,
  ArrowDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Box } from "@/types/box";
import type { FlexLayout, GridLayout, LayoutPadding } from "../types/layout";
import {
  DEFAULT_FLEX_LAYOUT,
  DEFAULT_GRID_LAYOUT,
  isUniformPadding,
} from "../types/layout";
import { updateLayoutConfig } from "../store/layoutStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LayoutControlsProps {
  box: Box;
}

export function LayoutControls({ box }: LayoutControlsProps) {
  const updateBox = useBoxStore((state) => state.updateBox);

  const handleLayoutTypeChange = useCallback(
    (value: string) => {
      if (value === "none") {
        updateBox(box.id, { layout: undefined });
        return;
      }

      if (value === "flex") {
        updateBox(box.id, { layout: DEFAULT_FLEX_LAYOUT });
      } else if (value === "grid") {
        updateBox(box.id, { layout: DEFAULT_GRID_LAYOUT });
      }
    },
    [box.id, updateBox]
  );

  const handleFlexUpdate = useCallback(
    (updates: Partial<FlexLayout>) => {
      if (box.layout?.type !== "flex") return;
      updateLayoutConfig(box.id, updates);
    },
    [box.id, box.layout]
  );

  const handleGridUpdate = useCallback(
    (updates: Partial<GridLayout>) => {
      if (box.layout?.type !== "grid") return;
      updateLayoutConfig(box.id, updates);
    },
    [box.id, box.layout]
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Layout</Label>
        <Select
          value={box.layout?.type || "none"}
          onValueChange={handleLayoutTypeChange}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="flex">
              <span className="flex items-center gap-1.5">
                <Columns className="w-3 h-3" />
                Flex
              </span>
            </SelectItem>
            <SelectItem value="grid">
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="w-3 h-3" />
                Grid
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {box.layout?.type === "flex" && (
        <FlexControls layout={box.layout} onUpdate={handleFlexUpdate} />
      )}

      {box.layout?.type === "grid" && (
        <GridControls layout={box.layout} onUpdate={handleGridUpdate} />
      )}
    </div>
  );
}

interface FlexControlsProps {
  layout: FlexLayout;
  onUpdate: (updates: Partial<FlexLayout>) => void;
}

function FlexControls({ layout, onUpdate }: FlexControlsProps) {
  const [expandedPadding, setExpandedPadding] = useState(
    () => !isUniformPadding(layout.layoutPadding)
  );

  const sizingMode = layout.childSizingMode ?? "auto";
  const padding = layout.layoutPadding ?? {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  const uniformPadding = padding.top;

  const handlePaddingChange = (value: number) => {
    onUpdate({
      layoutPadding: { top: value, right: value, bottom: value, left: value },
    });
  };

  const handleSidePaddingChange = (
    side: keyof LayoutPadding,
    value: number
  ) => {
    onUpdate({ layoutPadding: { ...padding, [side]: value } });
  };

  return (
    <div className="space-y-3 pt-2 border-t border-zinc-100">
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Child Sizing</Label>
        <div className="flex gap-1">
          <button
            onClick={() => onUpdate({ childSizingMode: "auto" })}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors",
              sizingMode === "auto"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
            title="Children use minimum size, free space distributed by justify/align"
          >
            Auto
          </button>
          <button
            onClick={() => onUpdate({ childSizingMode: "fill" })}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors",
              sizingMode === "fill"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
            title="Children stretch to fill available space"
          >
            Fill
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-zinc-500">Layout Padding</Label>
          <button
            onClick={() => setExpandedPadding(!expandedPadding)}
            className="flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {expandedPadding ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Uniform
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Expand
              </>
            )}
          </button>
        </div>

        {!expandedPadding ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={uniformPadding}
              onChange={(e) =>
                handlePaddingChange(parseInt(e.target.value) || 0)
              }
              className="h-8 text-xs"
              min={0}
            />
            <span className="text-xs text-zinc-400">px</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1">
            <div className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">
                T
              </span>
              <Input
                type="number"
                value={padding.top}
                onChange={(e) =>
                  handleSidePaddingChange("top", parseInt(e.target.value) || 0)
                }
                className="h-7 text-xs pl-4 text-center"
                min={0}
              />
            </div>
            <div className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">
                R
              </span>
              <Input
                type="number"
                value={padding.right}
                onChange={(e) =>
                  handleSidePaddingChange(
                    "right",
                    parseInt(e.target.value) || 0
                  )
                }
                className="h-7 text-xs pl-4 text-center"
                min={0}
              />
            </div>
            <div className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">
                B
              </span>
              <Input
                type="number"
                value={padding.bottom}
                onChange={(e) =>
                  handleSidePaddingChange(
                    "bottom",
                    parseInt(e.target.value) || 0
                  )
                }
                className="h-7 text-xs pl-4 text-center"
                min={0}
              />
            </div>
            <div className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">
                L
              </span>
              <Input
                type="number"
                value={padding.left}
                onChange={(e) =>
                  handleSidePaddingChange("left", parseInt(e.target.value) || 0)
                }
                className="h-7 text-xs pl-4 text-center"
                min={0}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Direction</Label>
        <div className="flex gap-1">
          <button
            onClick={() => onUpdate({ direction: "row" })}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border",
              layout.direction === "row"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <ArrowRight className="w-3 h-3" />
            Row
          </button>
          <button
            onClick={() => onUpdate({ direction: "column" })}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border",
              layout.direction === "column"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <ArrowDown className="w-3 h-3" />
            Column
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Gap</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={layout.gap}
            onChange={(e) => onUpdate({ gap: parseInt(e.target.value) || 0 })}
            className="h-8 text-xs"
            min={0}
            max={100}
          />
          <span className="text-xs text-zinc-400">px</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Align Items</Label>
        <Select
          value={layout.alignItems}
          onValueChange={(value) =>
            onUpdate({ alignItems: value as FlexLayout["alignItems"] })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start">Start</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="end">End</SelectItem>
            <SelectItem value="stretch">Stretch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Justify Content</Label>
        <Select
          value={layout.justifyContent}
          onValueChange={(value) =>
            onUpdate({ justifyContent: value as FlexLayout["justifyContent"] })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start">Start</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="end">End</SelectItem>
            <SelectItem value="space-between">Space Between</SelectItem>
            <SelectItem value="space-around">Space Around</SelectItem>
            <SelectItem value="space-evenly">Space Evenly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Wrap</Label>
        <button
          onClick={() => onUpdate({ wrap: !layout.wrap })}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border",
            layout.wrap
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          )}
        >
          {layout.wrap ? "Wrap Enabled" : "No Wrap"}
        </button>
      </div>

      {layout.wrap && (
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-500">Align Content</Label>
          <Select
            value={layout.alignContent || "start"}
            onValueChange={(value) =>
              onUpdate({ alignContent: value as FlexLayout["alignContent"] })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">Start</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="end">End</SelectItem>
              <SelectItem value="space-between">Space Between</SelectItem>
              <SelectItem value="space-around">Space Around</SelectItem>
              <SelectItem value="space-evenly">Space Evenly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

interface GridControlsProps {
  layout: GridLayout;
  onUpdate: (updates: Partial<GridLayout>) => void;
}

function GridControls({ layout, onUpdate }: GridControlsProps) {
  const [expandedPadding, setExpandedPadding] = useState(
    () => !isUniformPadding(layout.layoutPadding)
  );

  const sizingMode = layout.childSizingMode ?? "auto";
  const padding = layout.layoutPadding ?? {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  const uniformPadding = padding.top;

  const handlePaddingChange = (value: number) => {
    onUpdate({
      layoutPadding: { top: value, right: value, bottom: value, left: value },
    });
  };

  const handleSidePaddingChange = (
    side: keyof LayoutPadding,
    value: number
  ) => {
    onUpdate({ layoutPadding: { ...padding, [side]: value } });
  };

  return (
    <div className="space-y-3 pt-2 border-t border-zinc-100">
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Child Sizing</Label>
        <div className="flex gap-1">
          <button
            onClick={() => onUpdate({ childSizingMode: "auto" })}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors",
              sizingMode === "auto"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
            title="Children use minimum size, positioned within cells by align/justify"
          >
            Auto
          </button>
          <button
            onClick={() => onUpdate({ childSizingMode: "fill" })}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors",
              sizingMode === "fill"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
            title="Children fill their grid cells"
          >
            Fill
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-zinc-500">Layout Padding</Label>
          <button
            onClick={() => setExpandedPadding(!expandedPadding)}
            className="flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {expandedPadding ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Uniform
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Expand
              </>
            )}
          </button>
        </div>

        {!expandedPadding ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={uniformPadding}
              onChange={(e) =>
                handlePaddingChange(parseInt(e.target.value) || 0)
              }
              className="h-8 text-xs"
              min={0}
            />
            <span className="text-xs text-zinc-400">px</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1">
            <div className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">
                T
              </span>
              <Input
                type="number"
                value={padding.top}
                onChange={(e) =>
                  handleSidePaddingChange("top", parseInt(e.target.value) || 0)
                }
                className="h-7 text-xs pl-4 text-center"
                min={0}
              />
            </div>
            <div className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">
                R
              </span>
              <Input
                type="number"
                value={padding.right}
                onChange={(e) =>
                  handleSidePaddingChange(
                    "right",
                    parseInt(e.target.value) || 0
                  )
                }
                className="h-7 text-xs pl-4 text-center"
                min={0}
              />
            </div>
            <div className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">
                B
              </span>
              <Input
                type="number"
                value={padding.bottom}
                onChange={(e) =>
                  handleSidePaddingChange(
                    "bottom",
                    parseInt(e.target.value) || 0
                  )
                }
                className="h-7 text-xs pl-4 text-center"
                min={0}
              />
            </div>
            <div className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">
                L
              </span>
              <Input
                type="number"
                value={padding.left}
                onChange={(e) =>
                  handleSidePaddingChange("left", parseInt(e.target.value) || 0)
                }
                className="h-7 text-xs pl-4 text-center"
                min={0}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-500">Columns</Label>
          <Input
            type="number"
            value={layout.columns}
            onChange={(e) =>
              onUpdate({ columns: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="h-8 text-xs"
            min={1}
            max={12}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-500">Rows</Label>
          <Input
            type="number"
            value={layout.rows}
            onChange={(e) =>
              onUpdate({ rows: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="h-8 text-xs"
            min={1}
            max={12}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Gap</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={layout.gap}
            onChange={(e) => onUpdate({ gap: parseInt(e.target.value) || 0 })}
            className="h-8 text-xs"
            min={0}
            max={100}
          />
          <span className="text-xs text-zinc-400">px</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Align Items</Label>
        <Select
          value={layout.alignItems || "stretch"}
          onValueChange={(value) =>
            onUpdate({ alignItems: value as GridLayout["alignItems"] })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start">Start</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="end">End</SelectItem>
            <SelectItem value="stretch">Stretch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-500">Justify Items</Label>
        <Select
          value={layout.justifyItems || "stretch"}
          onValueChange={(value) =>
            onUpdate({ justifyItems: value as GridLayout["justifyItems"] })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start">Start</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="end">End</SelectItem>
            <SelectItem value="stretch">Stretch</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
