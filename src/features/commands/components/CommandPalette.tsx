import { useRef, useEffect } from "react";
import {
  Search,
  LayoutGrid,
  MousePointer2,
  Square,
  Type,
  Frame,
  Columns,
  Grid,
  Command,
} from "lucide-react";
import { useCommandPalette } from "../hooks/useCommandPalette";
import type { Command as CommandType } from "../types/command";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  MousePointer2: <MousePointer2 className="w-4 h-4" />,
  Square: <Square className="w-4 h-4" />,
  Type: <Type className="w-4 h-4" />,
  Frame: <Frame className="w-4 h-4" />,
  Columns: <Columns className="w-4 h-4" />,
  Grid: <Grid className="w-4 h-4" />,
};

export function CommandPalette() {
  const {
    isOpen,
    query,
    selectedIndex,
    mode,
    filteredCommands,
    layoutSuggestions,
    close,
    setQuery,
    executeSelected,
    executeCommand,
    switchToLayoutMode,
  } = useCommandPalette();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Enter" ||
      e.key === "Tab"
    ) {
      e.preventDefault();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200">
          {mode === "search" ? (
            <Search className="w-5 h-5 text-zinc-400" />
          ) : (
            <LayoutGrid className="w-5 h-5 text-blue-500" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={
              mode === "search"
                ? "Search commands..."
                : 'Enter layout (e.g., "flex row 3" or "grid 2x3")'
            }
            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-zinc-400"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => switchToLayoutMode()}
              className={cn(
                "px-2 py-1 text-xs rounded",
                mode === "layout"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              Layout
            </button>
          </div>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {mode === "search" ? (
            filteredCommands.length > 0 ? (
              <div className="py-2">
                {filteredCommands.map((command, index) => (
                  <CommandItem
                    key={command.id}
                    command={command}
                    isSelected={index === selectedIndex}
                    onClick={() => executeCommand(command.id)}
                    dataIndex={index}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 text-sm">
                No commands found
              </div>
            )
          ) : (
            <div className="py-2">
              {layoutSuggestions.length > 0 ? (
                layoutSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    data-index={index}
                    onClick={() => {
                      setQuery(suggestion);
                      inputRef.current?.focus();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-sm text-left",
                      index === selectedIndex
                        ? "bg-blue-50 text-blue-900"
                        : "hover:bg-zinc-50"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4 text-zinc-400" />
                    <span className="font-mono">{suggestion}</span>
                  </button>
                ))
              ) : query.trim() ? (
                <div className="py-4 px-4">
                  <p className="text-sm text-zinc-600 mb-2">
                    Press Enter to create layout:
                  </p>
                  <p className="font-mono text-sm bg-zinc-100 px-2 py-1 rounded">
                    {query}
                  </p>
                </div>
              ) : (
                <div className="py-4 px-4 text-sm text-zinc-500">
                  <p className="mb-2">Examples:</p>
                  <ul className="space-y-1 font-mono text-xs">
                    <li>flex row 3</li>
                    <li>flex col 4</li>
                    <li>grid 2x3</li>
                    <li>grid 3x3 gap=24</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-[10px]">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-[10px]">
              ↵
            </kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-[10px]">
              Tab
            </kbd>
            Switch mode
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-[10px]">
              Esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}

interface CommandItemProps {
  command: CommandType;
  isSelected: boolean;
  onClick: () => void;
  dataIndex: number;
}

function CommandItem({
  command,
  isSelected,
  onClick,
  dataIndex,
}: CommandItemProps) {
  return (
    <button
      data-index={dataIndex}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 text-sm text-left",
        isSelected ? "bg-blue-50 text-blue-900" : "hover:bg-zinc-50"
      )}
    >
      <span className="text-zinc-400">
        {command.icon && iconMap[command.icon] ? (
          iconMap[command.icon]
        ) : (
          <Command className="w-4 h-4" />
        )}
      </span>
      <span className="flex-1">{command.label}</span>
      {command.shortcut && (
        <kbd className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[10px] text-zinc-500">
          {command.shortcut}
        </kbd>
      )}
    </button>
  );
}
