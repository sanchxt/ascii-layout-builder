import { useMemo, useCallback } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  BoxSelect,
  ArrowUpFromLine,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Move,
  Maximize2,
  Layers2,
  Type,
  LayoutGrid,
  AlignVerticalJustifyCenter,
  Settings2,
  Columns,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import { useBoxStore } from "../store/boxStore";
import { useSidebarUIStore } from "@/components/layout/store/sidebarUIStore";
import type { BorderStyle, Box } from "@/types/box";
import type { FlexAlign } from "@/features/layout-system/types/layout";
import {
  DEFAULT_FLEX_LAYOUT,
  DEFAULT_GRID_LAYOUT,
} from "@/features/layout-system/types/layout";
import { TEXT_CONSTANTS } from "@/lib/constants";
import { getNestingDepth } from "../utils/boxHierarchy";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PropertyInput = ({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  className?: string;
}) => (
  <div className={cn("relative", className)}>
    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
      {label}
    </span>
    <input
      type="number"
      value={Math.round(value)}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full pl-6 pr-2 py-1.5 text-xs font-mono text-foreground bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring focus:bg-background transition-all"
    />
  </div>
);

const PropertySection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3 text-muted-foreground" />}
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </span>
    </div>
    {children}
  </div>
);

export const PropertiesContent = () => {
  const boxes = useBoxStore((state) => state.boxes);
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const updateBox = useBoxStore((state) => state.updateBox);
  const detachFromParent = useBoxStore((state) => state.detachFromParent);
  const toggleBoxLock = useBoxStore((state) => state.toggleBoxLock);
  const deleteBoxes = useBoxStore((state) => state.deleteBoxes);
  const duplicateBoxes = useBoxStore((state) => state.duplicateBoxes);

  const selectedBoxes = useMemo(
    () => boxes.filter((box) => selectedBoxIds.includes(box.id)),
    [boxes, selectedBoxIds]
  );

  if (selectedBoxes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-2">
          <BoxSelect className="w-5 h-5 text-muted-foreground/30" />
        </div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">No selection</p>
        <p className="text-[10px] text-muted-foreground/70">Select an element to edit</p>
      </div>
    );
  }

  if (selectedBoxes.length > 1) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-canvas-selection-bg flex items-center justify-center mb-2">
          <span className="text-lg font-bold text-canvas-selection">
            {selectedBoxes.length}
          </span>
        </div>
        <p className="text-xs font-medium text-foreground mb-0.5">
          Multiple items
        </p>
        <p className="text-[10px] text-muted-foreground mb-4">Multi-edit coming soon</p>

        <div className="w-full space-y-2">
          <button
            onClick={() => deleteBoxes(selectedBoxIds)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All
          </button>
        </div>
      </div>
    );
  }

  const box = selectedBoxes[0];

  const handleUpdate = (field: string, value: any) => {
    updateBox(box.id, { [field]: value });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-4">
        <PropertySection title="Transform" icon={Move}>
          <div className="grid grid-cols-2 gap-2">
            <PropertyInput
              label="X"
              value={box.x}
              onChange={(v) => handleUpdate("x", v)}
            />
            <PropertyInput
              label="Y"
              value={box.y}
              onChange={(v) => handleUpdate("y", v)}
            />
          </div>
        </PropertySection>

        <PropertySection title="Size" icon={Maximize2}>
          <div className="grid grid-cols-2 gap-2">
            <PropertyInput
              label="W"
              value={box.width}
              onChange={(v) => handleUpdate("width", v)}
            />
            <PropertyInput
              label="H"
              value={box.height}
              onChange={(v) => handleUpdate("height", v)}
            />
          </div>
        </PropertySection>

        <PropertySection title="Layer" icon={Layers2}>
          <div className="grid grid-cols-2 gap-2">
            <PropertyInput
              label="Z"
              value={box.zIndex}
              onChange={(v) => handleUpdate("zIndex", v)}
            />
            <PropertyInput
              label="P"
              value={box.padding}
              onChange={(v) => handleUpdate("padding", v)}
            />
          </div>
        </PropertySection>

        <div className="h-px bg-border" />

        <PropertySection title="Border">
          <div className="flex gap-0.5 p-0.5 bg-muted rounded-lg">
            {(["single", "double", "dashed"] as BorderStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => handleUpdate("borderStyle", style)}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-medium rounded-md capitalize transition-all",
                  box.borderStyle === style
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </PropertySection>

        <div className="h-px bg-border" />

        <CompactLayoutSection box={box} updateBox={updateBox} />

        <ChildLayoutControls box={box} boxes={boxes} updateBox={updateBox} />

        <div className="h-px bg-border" />

        <PropertySection title="Typography" icon={Type}>
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={box.text.fontSize}
                onChange={(e) =>
                  updateBox(box.id, {
                    text: { ...box.text, fontSize: e.target.value as any },
                  })
                }
                className="flex-1 px-2 py-1.5 text-xs text-foreground bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>

              <div className="flex gap-0.5 p-0.5 bg-muted rounded-md">
                {[
                  { value: "left", icon: AlignLeft },
                  { value: "center", icon: AlignCenter },
                  { value: "right", icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() =>
                      updateBox(box.id, {
                        text: { ...box.text, alignment: value as any },
                      })
                    }
                    className={cn(
                      "p-1.5 rounded transition-all",
                      box.text.alignment === value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-mono">
                {box.text.value.length}/{TEXT_CONSTANTS.MAX_LENGTH}
              </span>
              {box.text.value && (
                <button
                  onClick={() =>
                    updateBox(box.id, {
                      text: { ...box.text, value: "", formatting: [] },
                    })
                  }
                  className="text-[10px] text-destructive hover:text-destructive/80 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </PropertySection>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between py-1">
          <span className="text-[10px] text-muted-foreground">Nesting Level</span>
          <span className="text-[10px] font-mono text-foreground bg-muted px-2 py-0.5 rounded">
            L{getNestingDepth(box.id, boxes)}
          </span>
        </div>

        {box.parentId && (
          <button
            onClick={() => detachFromParent(box.id)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground bg-muted hover:bg-accent border border-border rounded-lg transition-colors"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            Detach
          </button>
        )}

        <div className="h-px bg-border" />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toggleBoxLock(box.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors",
              box.locked
                ? "bg-warning/20 text-warning-foreground border-warning hover:bg-warning/30"
                : "bg-background text-foreground border-border hover:bg-muted"
            )}
          >
            {box.locked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            {box.locked ? "Unlock" : "Lock"}
          </button>

          <button
            onClick={() => duplicateBoxes([box.id])}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>
        </div>

        <button
          onClick={() => deleteBoxes([box.id])}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>

        <div className="pt-2 text-center">
          <span className="text-[9px] text-muted-foreground/50 font-mono">{box.id}</span>
        </div>
      </div>
    </div>
  );
};

interface CompactLayoutSectionProps {
  box: Box;
  updateBox: (id: string, updates: Partial<Box>) => void;
}

function CompactLayoutSection({ box, updateBox }: CompactLayoutSectionProps) {
  const openLayoutPanel = useSidebarUIStore((state) => state.openLayoutPanel);

  const handleLayoutTypeChange = useCallback(
    (type: "none" | "flex" | "grid") => {
      if (type === "none") {
        updateBox(box.id, { layout: undefined });
      } else if (type === "flex") {
        updateBox(box.id, { layout: DEFAULT_FLEX_LAYOUT });
      } else if (type === "grid") {
        updateBox(box.id, { layout: DEFAULT_GRID_LAYOUT });
      }
    },
    [box.id, updateBox]
  );

  const layoutType = box.layout?.type || "none";
  const hasLayout = layoutType !== "none";

  const getLayoutSummary = () => {
    if (!box.layout) return null;
    if (box.layout.type === "flex") {
      const dir = box.layout.direction === "row" ? "Row" : "Column";
      return `${dir} • Gap: ${box.layout.gap}px`;
    }
    if (box.layout.type === "grid") {
      return `${box.layout.columns}×${box.layout.rows} • Gap: ${box.layout.gap}px`;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Layout
          </span>
        </div>
        {hasLayout && (
          <button
            onClick={() => openLayoutPanel(box.id)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-canvas-selection hover:text-canvas-selection/80 hover:bg-canvas-selection-bg rounded transition-colors"
          >
            <Settings2 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      <div className="flex gap-0.5 p-0.5 bg-muted rounded-lg">
        <button
          onClick={() => handleLayoutTypeChange("none")}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all",
            layoutType === "none"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          None
        </button>
        <button
          onClick={() => handleLayoutTypeChange("flex")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded-md transition-all",
            layoutType === "flex"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Columns className="w-3 h-3" />
          Flex
        </button>
        <button
          onClick={() => handleLayoutTypeChange("grid")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded-md transition-all",
            layoutType === "grid"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-3 h-3" />
          Grid
        </button>
      </div>

      {hasLayout && (
        <div
          onClick={() => openLayoutPanel(box.id)}
          className="flex items-center gap-2 px-2.5 py-2 bg-muted rounded-lg border border-border cursor-pointer hover:bg-accent transition-colors"
        >
          {box.layout?.type === "flex" && (
            <>
              {box.layout.direction === "row" ? (
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </>
          )}
          {box.layout?.type === "grid" && (
            <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span className="text-[11px] text-foreground">
            {getLayoutSummary()}
          </span>
        </div>
      )}
    </div>
  );
}

interface ChildLayoutControlsProps {
  box: Box;
  boxes: Box[];
  updateBox: (id: string, updates: Partial<Box>) => void;
}

function ChildLayoutControls({
  box,
  boxes,
  updateBox,
}: ChildLayoutControlsProps) {
  const parent = box.parentId ? boxes.find((b) => b.id === box.parentId) : null;
  const isFlexChild = parent?.layout?.type === "flex";

  if (!isFlexChild) {
    return null;
  }

  const handleAlignSelfChange = (value: string) => {
    const alignSelf = value === "inherit" ? undefined : (value as FlexAlign);
    updateBox(box.id, {
      layoutChildProps: {
        ...box.layoutChildProps,
        alignSelf,
      },
    });
  };

  return (
    <>
      <div className="h-px bg-border" />
      <PropertySection title="Child Layout" icon={AlignVerticalJustifyCenter}>
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Align Self</Label>
            <Select
              value={box.layoutChildProps?.alignSelf || "inherit"}
              onValueChange={handleAlignSelfChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">
                  Inherit (from container)
                </SelectItem>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="end">End</SelectItem>
                <SelectItem value="stretch">Stretch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PropertySection>
    </>
  );
}
