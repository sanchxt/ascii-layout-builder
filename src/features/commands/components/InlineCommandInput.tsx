import { useRef, useEffect, useState, useMemo } from "react";
import { LayoutGrid, Box, Frame, AlertCircle } from "lucide-react";
import { useCommandStore, useInlineCommandState } from "../store/commandStore";
import { useLayoutGeneration } from "@/features/layout-system/hooks/useLayoutGeneration";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { getCommandSuggestions } from "@/features/layout-system/lib/layoutParser";
import { cn } from "@/lib/utils";

export function InlineCommandInput() {
  const inline = useInlineCommandState();
  const { inlineActions } = useCommandStore();
  const { executeLayoutCommand, getLayoutTarget } = useLayoutGeneration();

  const getBox = useBoxStore((state) => state.getBox);
  const getArtboard = useArtboardStore((state) => state.getArtboard);

  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const targetContext = useMemo(() => {
    const target = getLayoutTarget();

    if (target.type === "box" && target.id) {
      const box = getBox(target.id);
      return {
        type: "box" as const,
        name: box?.name || "Selected Box",
        icon: Box,
      };
    }

    if (target.type === "artboard" && target.id) {
      const artboard = getArtboard(target.id);
      return {
        type: "artboard" as const,
        name: artboard?.name || "Active Artboard",
        icon: Frame,
      };
    }

    return {
      type: "none" as const,
      name: "No target",
      icon: AlertCircle,
    };
  }, [getLayoutTarget, getBox, getArtboard]);

  useEffect(() => {
    if (inline.isActive) {
      setSuggestions(getCommandSuggestions(inline.query));
      setSelectedSuggestion(0);
      setError(null);
    }
  }, [inline.query, inline.isActive]);

  useEffect(() => {
    if (inline.isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inline.isActive]);

  if (!inline.isActive || !inline.position) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        inlineActions.deactivate();
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestion((prev) => Math.max(0, prev - 1));
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestion((prev) =>
          Math.min(suggestions.length - 1, prev + 1)
        );
        break;
      case "Tab":
        e.preventDefault();
        if (suggestions.length > 0) {
          inlineActions.setQuery(suggestions[selectedSuggestion]);
        }
        break;
      case "Enter":
        e.preventDefault();
        handleExecute();
        break;
    }
  };

  const handleExecute = () => {
    if (!inline.query.trim()) {
      inlineActions.deactivate();
      return;
    }

    const result = executeLayoutCommand(inline.query);

    if (result.success) {
      inlineActions.deactivate();
    } else {
      setError(result.error || "Invalid command");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    inlineActions.setQuery(suggestion);
    inputRef.current?.focus();
  };

  const TargetIcon = targetContext.icon;

  return (
    <div
      className="absolute z-50"
      style={{
        left: inline.position.x,
        top: inline.position.y,
      }}
    >
      <div className="bg-popover rounded-lg shadow-xl border border-border overflow-hidden min-w-[280px]">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
          <TargetIcon className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            Applying to:{" "}
            <span className="font-medium text-foreground">
              {targetContext.name}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={inline.query}
            onChange={(e) => inlineActions.setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => {
                if (document.activeElement !== inputRef.current) {
                  inlineActions.deactivate();
                }
              }, 150);
            }}
            placeholder="flex row 3, grid 2x2..."
            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-destructive bg-destructive/10 border-b border-destructive/20">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="max-h-40 overflow-y-auto">
            {suggestions.map((suggestion, index) => {
              const isGrid = suggestion.startsWith("grid");
              const isFlex = suggestion.startsWith("flex");

              return (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
                    index === selectedSuggestion
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="w-8 h-6 rounded bg-muted/80 flex items-center justify-center shrink-0">
                    {isGrid ? (
                      <div className="grid grid-cols-2 gap-0.5">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-sm bg-primary/60"
                          />
                        ))}
                      </div>
                    ) : isFlex ? (
                      <div
                        className={cn(
                          "flex gap-0.5",
                          suggestion.includes("column")
                            ? "flex-col"
                            : "flex-row"
                        )}
                      >
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "rounded-sm bg-primary/60",
                              suggestion.includes("column")
                                ? "w-3 h-1"
                                : "w-1 h-3"
                            )}
                          />
                        ))}
                      </div>
                    ) : (
                      <LayoutGrid className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="font-mono text-xs">{suggestion}</span>
                </button>
              );
            })}
          </div>
        )}

        {!suggestions.length && !inline.query && (
          <div className="px-3 py-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1.5">Layout Commands:</p>
            <div className="space-y-1">
              <p className="font-mono text-[11px]">flex row 3</p>
              <p className="font-mono text-[11px]">flex column 4</p>
              <p className="font-mono text-[11px]">grid 2x2</p>
              <p className="font-mono text-[11px]">grid 3x3</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/30 border-t border-border text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[9px] font-mono">
              ↵
            </kbd>
            <span>Create</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[9px] font-mono">
              Tab
            </kbd>
            <span>Complete</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[9px] font-mono">
              Esc
            </kbd>
            <span>Cancel</span>
          </span>
        </div>
      </div>
    </div>
  );
}
