import { useState, useRef, useEffect } from "react";
import { LayoutGrid, ChevronDown, Columns, Grid, Rows } from "lucide-react";
import { LAYOUT_PRESETS } from "@/features/layout-system/types/layout";
import { useLayoutGeneration } from "@/features/layout-system/hooks/useLayoutGeneration";
import { useCommandStore } from "../store/commandStore";
import { cn } from "@/lib/utils";

export function LayoutToolbarMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { executeLayoutCommand, canGenerateLayout, getLayoutTarget } =
    useLayoutGeneration();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handlePresetClick = (preset: (typeof LAYOUT_PRESETS)[number]) => {
    let command: string;
    if (preset.config.type === "flex") {
      command = `flex ${preset.config.direction} ${preset.childCount}`;
    } else if (preset.config.type === "grid") {
      command = `grid ${preset.config.columns}x${preset.config.rows}`;
    } else {
      return;
    }

    const result = executeLayoutCommand(command);
    if (result.success) {
      setIsOpen(false);
    } else {
      console.warn(result.error);
    }
  };

  const target = getLayoutTarget();
  const hasTarget = canGenerateLayout();

  const flexPresets = LAYOUT_PRESETS.filter((p) => p.config.type === "flex");
  const gridPresets = LAYOUT_PRESETS.filter((p) => p.config.type === "grid");

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!hasTarget}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
          hasTarget
            ? "hover:bg-zinc-100 text-zinc-700"
            : "text-zinc-400 cursor-not-allowed",
          isOpen && "bg-zinc-100"
        )}
        title={
          hasTarget
            ? "Add layout to selection"
            : "Select a box or artboard first"
        }
      >
        <LayoutGrid className="w-4 h-4" />
        <span>Layout</span>
        <ChevronDown
          className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-zinc-200 py-1 z-50">
          <div className="px-3 py-1.5 text-xs text-zinc-500 border-b border-zinc-100">
            Target:{" "}
            <span className="font-medium text-zinc-700">
              {target.type === "box"
                ? "Selected Box"
                : target.type === "artboard"
                ? "Active Artboard"
                : "None"}
            </span>
          </div>

          <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Flex
          </div>
          {flexPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-50"
            >
              {preset.config.type === "flex" &&
              preset.config.direction === "row" ? (
                <Columns className="w-4 h-4 text-zinc-400" />
              ) : (
                <Rows className="w-4 h-4 text-zinc-400" />
              )}
              <span className="flex-1">{preset.name}</span>
              <span className="text-xs text-zinc-400">
                {preset.childCount} items
              </span>
            </button>
          ))}

          <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide border-t border-zinc-100 mt-1">
            Grid
          </div>
          {gridPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-50"
            >
              <Grid className="w-4 h-4 text-zinc-400" />
              <span className="flex-1">{preset.name}</span>
              <span className="text-xs text-zinc-400">
                {preset.childCount} items
              </span>
            </button>
          ))}

          <div className="border-t border-zinc-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                const { setMode, open } = useCommandStore.getState();
                open();
                setMode("layout");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-50 text-blue-600"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Custom layout...</span>
              <span className="ml-auto text-xs text-zinc-400">⌘K</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
