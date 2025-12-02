import { useMemo } from "react";
import {
  Move,
  Trash2,
  Lock,
  Unlock,
  Copy,
  Minus,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  Circle,
  Triangle,
  Type,
  Layers2,
  FileCode,
} from "lucide-react";
import { useLineStore } from "../store/lineStore";
import type {
  Line,
  ArrowHeadStyle,
  LineOutputMode,
  LineLabelPosition,
} from "@/types/line";
import { cn } from "@/lib/utils";
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
    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 pointer-events-none">
      {label}
    </span>
    <input
      type="number"
      value={Math.round(value)}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full pl-6 pr-2 py-1.5 text-xs font-mono text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
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
      {Icon && <Icon className="w-3 h-3 text-zinc-400" />}
      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
        {title}
      </span>
    </div>
    {children}
  </div>
);

const ArrowButton = ({
  style,
  currentStyle,
  direction,
  onClick,
}: {
  style: ArrowHeadStyle;
  currentStyle: ArrowHeadStyle;
  direction: "start" | "end";
  onClick: () => void;
}) => {
  const getIcon = () => {
    if (style === "none") return <Circle className="w-3.5 h-3.5" />;
    if (style === "simple") {
      return direction === "end" ? (
        <ArrowRight className="w-3.5 h-3.5" />
      ) : (
        <ArrowLeft className="w-3.5 h-3.5" />
      );
    }
    return <Triangle className="w-3.5 h-3.5" />;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center py-1.5 rounded-md transition-all",
        currentStyle === style
          ? "bg-white text-zinc-800 shadow-sm"
          : "text-zinc-500 hover:text-zinc-700"
      )}
    >
      {getIcon()}
    </button>
  );
};

export const LinePropertiesContent = () => {
  const lines = useLineStore((state) => state.lines);
  const selectedLineIds = useLineStore((state) => state.selectedLineIds);
  const updateLine = useLineStore((state) => state.updateLine);
  const toggleLineLock = useLineStore((state) => state.toggleLineLock);
  const deleteLines = useLineStore((state) => state.deleteLines);
  const duplicateLines = useLineStore((state) => state.duplicateLines);

  const selectedLines = useMemo(
    () => lines.filter((line) => selectedLineIds.includes(line.id)),
    [lines, selectedLineIds]
  );

  if (selectedLines.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-2">
          <Minus className="w-5 h-5 text-zinc-300" />
        </div>
        <p className="text-xs font-medium text-zinc-500 mb-0.5">
          No line selected
        </p>
        <p className="text-[10px] text-zinc-400">Select a line to edit</p>
      </div>
    );
  }

  if (selectedLines.length > 1) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
          <span className="text-lg font-bold text-blue-600">
            {selectedLines.length}
          </span>
        </div>
        <p className="text-xs font-medium text-zinc-700 mb-0.5">
          Multiple lines
        </p>
        <p className="text-[10px] text-zinc-400 mb-4">Multi-edit coming soon</p>

        <div className="w-full space-y-2">
          <button
            onClick={() => deleteLines(selectedLineIds)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All
          </button>
        </div>
      </div>
    );
  }

  const line = selectedLines[0];

  const handleUpdate = (field: keyof Line, value: any) => {
    updateLine(line.id, { [field]: value });
  };

  const handleLabelUpdate = (field: string, value: any) => {
    updateLine(line.id, {
      label: {
        ...(line.label || {
          text: "",
          position: "middle" as LineLabelPosition,
        }),
        [field]: value,
      },
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-4">
        <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-50 rounded-lg">
          <span className="text-[10px] text-zinc-500">Direction</span>
          <div className="flex items-center gap-1.5">
            {line.direction === "horizontal" ? (
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-zinc-600" />
            )}
            <span className="text-[10px] font-medium text-zinc-700 capitalize">
              {line.direction}
            </span>
          </div>
        </div>

        <PropertySection title="Start Point" icon={Move}>
          <div className="grid grid-cols-2 gap-2">
            <PropertyInput
              label="X"
              value={line.startX}
              onChange={(v) => handleUpdate("startX", v)}
            />
            <PropertyInput
              label="Y"
              value={line.startY}
              onChange={(v) => handleUpdate("startY", v)}
            />
          </div>
        </PropertySection>

        <PropertySection title="End Point" icon={Move}>
          <div className="grid grid-cols-2 gap-2">
            <PropertyInput
              label="X"
              value={line.endX}
              onChange={(v) => handleUpdate("endX", v)}
            />
            <PropertyInput
              label="Y"
              value={line.endY}
              onChange={(v) => handleUpdate("endY", v)}
            />
          </div>
        </PropertySection>

        <PropertySection title="Layer" icon={Layers2}>
          <PropertyInput
            label="Z"
            value={line.zIndex}
            onChange={(v) => handleUpdate("zIndex", v)}
          />
        </PropertySection>

        <div className="h-px bg-zinc-100" />

        <PropertySection title="Start Arrow">
          <div className="flex gap-0.5 p-0.5 bg-zinc-100 rounded-lg">
            {(["none", "simple", "filled"] as ArrowHeadStyle[]).map((style) => (
              <ArrowButton
                key={style}
                style={style}
                currentStyle={line.startArrow}
                direction="start"
                onClick={() => handleUpdate("startArrow", style)}
              />
            ))}
          </div>
        </PropertySection>

        <PropertySection title="End Arrow">
          <div className="flex gap-0.5 p-0.5 bg-zinc-100 rounded-lg">
            {(["none", "simple", "filled"] as ArrowHeadStyle[]).map((style) => (
              <ArrowButton
                key={style}
                style={style}
                currentStyle={line.endArrow}
                direction="end"
                onClick={() => handleUpdate("endArrow", style)}
              />
            ))}
          </div>
        </PropertySection>

        <div className="h-px bg-zinc-100" />

        <PropertySection title="Line Style">
          <div className="flex gap-0.5 p-0.5 bg-zinc-100 rounded-lg">
            {(["solid", "dashed", "dotted"] as const).map((style) => (
              <button
                key={style}
                onClick={() => handleUpdate("lineStyle", style)}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-medium rounded-md capitalize transition-all",
                  line.lineStyle === style
                    ? "bg-white text-zinc-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </PropertySection>

        <div className="h-px bg-zinc-100" />

        <PropertySection title="Output Mode" icon={FileCode}>
          <Select
            value={line.outputMode}
            onValueChange={(v) =>
              handleUpdate("outputMode", v as LineOutputMode)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ascii">ASCII Characters</SelectItem>
              <SelectItem value="svg">SVG Element</SelectItem>
              <SelectItem value="comment">HTML Comment</SelectItem>
            </SelectContent>
          </Select>
        </PropertySection>

        <div className="h-px bg-zinc-100" />

        <PropertySection title="Label" icon={Type}>
          <div className="space-y-2">
            <input
              type="text"
              value={line.label?.text || ""}
              onChange={(e) => handleLabelUpdate("text", e.target.value)}
              placeholder="Add label..."
              className="w-full px-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
            {line.label?.text && (
              <Select
                value={line.label?.position || "middle"}
                onValueChange={(v) =>
                  handleLabelUpdate("position", v as LineLabelPosition)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">At Start</SelectItem>
                  <SelectItem value="middle">At Middle</SelectItem>
                  <SelectItem value="end">At End</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </PropertySection>

        <div className="h-px bg-zinc-100" />

        {(line.startConnection || line.endConnection) && (
          <>
            <div className="space-y-1 px-2 py-1.5 bg-blue-50 rounded-lg">
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                Connections
              </span>
              {line.startConnection && (
                <p className="text-[10px] text-blue-600">
                  Start: {line.startConnection.side} of box
                </p>
              )}
              {line.endConnection && (
                <p className="text-[10px] text-blue-600">
                  End: {line.endConnection.side} of box
                </p>
              )}
            </div>
            <div className="h-px bg-zinc-100" />
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toggleLineLock(line.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors",
              line.locked
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
            )}
          >
            {line.locked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            {line.locked ? "Unlock" : "Lock"}
          </button>

          <button
            onClick={() => duplicateLines([line.id])}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>
        </div>

        <button
          onClick={() => deleteLines([line.id])}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>

        <div className="pt-2 text-center">
          <span className="text-[9px] text-zinc-300 font-mono">{line.id}</span>
        </div>
      </div>
    </div>
  );
};
