import { useRef, useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useCommandStore, useInlineCommandState } from "../store/commandStore";
import { useLayoutGeneration } from "@/features/layout-system/hooks/useLayoutGeneration";
import { getCommandSuggestions } from "@/features/layout-system/lib/layoutParser";
import { cn } from "@/lib/utils";

export function InlineCommandInput() {
  const inline = useInlineCommandState();
  const { inlineActions } = useCommandStore();
  const { executeLayoutCommand } = useLayoutGeneration();

  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div
      className="absolute z-50"
      style={{
        left: inline.position.x,
        top: inline.position.y,
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-zinc-200 overflow-hidden min-w-[280px]">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
          <LayoutGrid className="w-4 h-4 text-blue-500" />
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
            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-zinc-400"
          />
        </div>

        {error && (
          <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="max-h-40 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left",
                  index === selectedSuggestion
                    ? "bg-blue-50 text-blue-900"
                    : "hover:bg-zinc-50"
                )}
              >
                <span className="font-mono text-xs">{suggestion}</span>
              </button>
            ))}
          </div>
        )}

        {!suggestions.length && !inline.query && (
          <div className="px-3 py-2 text-xs text-zinc-500">
            <p>Type a layout command:</p>
            <p className="font-mono mt-1">flex row 3 | grid 2x2</p>
          </div>
        )}

        <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-50 border-t border-zinc-100 text-[10px] text-zinc-400">
          <span>
            <kbd className="px-1 bg-white border border-zinc-200 rounded">
              ↵
            </kbd>{" "}
            Create
          </span>
          <span>
            <kbd className="px-1 bg-white border border-zinc-200 rounded">
              Tab
            </kbd>{" "}
            Complete
          </span>
          <span>
            <kbd className="px-1 bg-white border border-zinc-200 rounded">
              Esc
            </kbd>{" "}
            Cancel
          </span>
        </div>
      </div>
    </div>
  );
}
