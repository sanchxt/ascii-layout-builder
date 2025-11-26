import { useBoxStore } from "../store/boxStore";
import type { BorderStyle } from "@/types/box";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Move,
  BoxSelect,
  ArrowUpFromLine,
  Copy,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { TEXT_CONSTANTS, BOX_CONSTANTS } from "@/lib/constants";
import { getNestingDepth, getChildBoxes } from "../utils/boxHierarchy";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export const BoxPropertiesPanel = () => {
  const boxes = useBoxStore((state) => state.boxes);
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);

  const selectedBoxes = useMemo(
    () => boxes.filter((box) => selectedBoxIds.includes(box.id)),
    [boxes, selectedBoxIds]
  );

  const updateBox = useBoxStore((state) => state.updateBox);
  const detachFromParent = useBoxStore((state) => state.detachFromParent);
  const selectBox = useBoxStore((state) => state.selectBox);
  const toggleBoxLock = useBoxStore((state) => state.toggleBoxLock);

  if (selectedBoxes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
        <BoxSelect className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Select an element to edit properties</p>
      </div>
    );
  }

  if (selectedBoxes.length > 1) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-3">
          <span className="font-bold text-lg">{selectedBoxes.length}</span>
        </div>
        <div className="text-sm font-medium text-zinc-900">
          Multiple items selected
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          Multi-editing is coming soon
        </div>
      </div>
    );
  }

  const box = selectedBoxes[0];

  const handleUpdate = (field: string, value: string | number) => {
    updateBox(box.id, { [field]: value });
  };

  const InputGroup = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );

  const NumberInput = ({
    value,
    onChange,
    label,
    icon: Icon,
  }: {
    value: number;
    onChange: (val: number) => void;
    label?: string;
    icon?: any;
  }) => (
    <div className="relative flex items-center group">
      {Icon && (
        <Icon className="absolute left-2 w-3 h-3 text-zinc-400 group-focus-within:text-blue-500" />
      )}
      {label && (
        <span className="absolute left-2 text-[10px] font-mono text-zinc-400 group-focus-within:text-blue-500">
          {label}
        </span>
      )}
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full bg-zinc-50 border border-zinc-200 rounded-md py-1.5 text-xs font-mono text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all",
          Icon || label ? "pl-7 pr-2" : "px-2"
        )}
      />
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Layout Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputGroup label="Position">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="X"
                value={box.x}
                onChange={(v) => handleUpdate("x", v)}
              />
              <NumberInput
                label="Y"
                value={box.y}
                onChange={(v) => handleUpdate("y", v)}
              />
            </div>
          </InputGroup>
          <InputGroup label="Dimensions">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="W"
                value={box.width}
                onChange={(v) => handleUpdate("width", v)}
              />
              <NumberInput
                label="H"
                value={box.height}
                onChange={(v) => handleUpdate("height", v)}
              />
            </div>
          </InputGroup>
        </div>

        <InputGroup label="Layer & Padding">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Z"
              value={box.zIndex}
              onChange={(v) => handleUpdate("zIndex", v)}
            />
            <NumberInput
              label="P"
              value={box.padding}
              onChange={(v) => handleUpdate("padding", v)}
            />
          </div>
        </InputGroup>
      </div>

      <div className="h-px bg-zinc-100" />

      {/* Appearance Section */}
      <InputGroup label="Border Style">
        <div className="flex bg-zinc-50 p-1 rounded-md border border-zinc-200">
          {(["single", "double", "dashed"] as BorderStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => handleUpdate("borderStyle", style)}
              className={cn(
                "flex-1 py-1 text-xs rounded-sm capitalize transition-all",
                box.borderStyle === style
                  ? "bg-white text-blue-600 shadow-sm font-medium"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {style}
            </button>
          ))}
        </div>
      </InputGroup>

      <div className="h-px bg-zinc-100" />

      {/* Typography Section */}
      <InputGroup label="Typography">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <select
                value={box.text.fontSize}
                onChange={(e) =>
                  updateBox(box.id, {
                    text: { ...box.text, fontSize: e.target.value as any },
                  })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-md py-1.5 px-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="small">Small (12px)</option>
                <option value="medium">Medium (14px)</option>
                <option value="large">Large (20px)</option>
              </select>
            </div>
            <div className="flex bg-zinc-50 rounded-md border border-zinc-200 p-0.5">
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
                    "p-1.5 rounded-sm transition-all",
                    box.text.alignment === value
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-700"
                  )}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-400">
              {box.text.value.length} / {TEXT_CONSTANTS.MAX_LENGTH} chars
            </span>
            {box.text.value && (
              <button
                onClick={() =>
                  updateBox(box.id, {
                    text: { ...box.text, value: "", formatting: [] },
                  })
                }
                className="text-[10px] text-red-500 hover:text-red-600 font-medium"
              >
                Clear Text
              </button>
            )}
          </div>
        </div>
      </InputGroup>

      <div className="h-px bg-zinc-100" />

      {/* Hierarchy & Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-700">
            Hierarchy Level
          </span>
          <span className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
            L{getNestingDepth(box.id, boxes)}
          </span>
        </div>

        {box.parentId && (
          <button
            onClick={() => detachFromParent(box.id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:border-zinc-300 transition-all"
          >
            <ArrowUpFromLine size={14} />
            Detach from Parent
          </button>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => toggleBoxLock(box.id)}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md border transition-all",
              box.locked
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
            )}
          >
            {box.locked ? <Lock size={14} /> : <Unlock size={14} />}
            {box.locked ? "Unlock" : "Lock"}
          </button>

          <button className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-all">
            <Copy size={14} />
            Duplicate
          </button>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-md hover:bg-red-100 transition-all">
          <Trash2 size={14} />
          Delete Element
        </button>
      </div>

      <div className="text-[10px] text-zinc-300 font-mono text-center pt-4">
        ID: {box.id}
      </div>
    </div>
  );
};
