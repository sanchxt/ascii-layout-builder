import { useRef, useEffect, useMemo } from "react";
import { Clock, Sparkles, LayoutGrid } from "lucide-react";
import { useCommandPalette } from "../hooks/useCommandPalette";
import { CommandPaletteInput } from "./CommandPaletteInput";
import { CommandSection } from "./CommandSection";
import { CommandItem } from "./CommandItem";
import { LayoutPreviewGrid } from "./LayoutPreviewCard";
import { SelectionContextBar } from "./SelectionContextBar";
import {
  groupSearchResults,
  groupByCategory,
  getRecentCommands,
} from "../registry/searchUtils";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const {
    isOpen,
    query,
    selectedIndex,
    searchResults,
    allCommands,
    recentCommands,
    layoutSuggestions,
    isLayoutMode,
    selectionContext,
    close,
    setQuery,
    executeCommand,
    onQuickAction,
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

  const recentCommandsList = useMemo(() => {
    if (query.trim()) return [];
    return getRecentCommands(allCommands, recentCommands, 5);
  }, [allCommands, recentCommands, query]);

  const groupedResults = useMemo(() => {
    if (query.trim()) {
      return groupSearchResults(searchResults);
    }
    return groupByCategory(allCommands);
  }, [query, searchResults, allCommands]);

  const layoutCommands = useMemo(() => {
    return allCommands.filter(
      (cmd) => cmd.category === "layout" && cmd.meta?.layoutPreview
    );
  }, [allCommands]);

  if (!isOpen) return null;

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
    }
  };

  let runningIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      <div
        className={cn(
          "relative w-full max-w-xl rounded-xl shadow-2xl border overflow-hidden",
          "bg-popover border-border",
          "animate-in fade-in slide-in-from-top-4 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CommandPaletteInput
          ref={inputRef}
          query={query}
          setQuery={setQuery}
          placeholder={
            isLayoutMode
              ? 'Type layout (e.g., "flex row 3" or "grid 2x2")'
              : "Search commands..."
          }
          isLayoutMode={isLayoutMode}
          onKeyDown={handleInputKeyDown}
        />

        {selectionContext.hasSelection && (
          <SelectionContextBar
            context={selectionContext}
            onQuickAction={onQuickAction}
          />
        )}

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {isLayoutMode && layoutSuggestions.length > 0 && (
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Suggestions
                </span>
              </div>
              <div className="space-y-1">
                {layoutSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      "text-foreground hover:bg-accent"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                    <code className="font-mono text-xs">{suggestion}</code>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(!query.trim() || isLayoutMode) && layoutCommands.length > 0 && (
            <LayoutPreviewGrid
              commands={layoutCommands}
              selectedIndex={selectedIndex}
              startIndex={
                !query.trim() && recentCommandsList.length > 0
                  ? recentCommandsList.length
                  : 0
              }
              onCommandClick={executeCommand}
            />
          )}

          {!query.trim() && recentCommandsList.length > 0 && (
            <div className="py-1">
              <div className="flex items-center gap-2 px-4 py-2">
                <Clock className="w-3 h-3 text-muted-foreground/70" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Recent
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <div className="space-y-0.5">
                {recentCommandsList.map((command) => {
                  const dataIndex = runningIndex++;
                  return (
                    <CommandItem
                      key={command.id}
                      command={command}
                      isSelected={selectedIndex === dataIndex}
                      onClick={() => executeCommand(command.id)}
                      dataIndex={dataIndex}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {groupedResults.length > 0 ? (
            groupedResults.map((group) => {
              if (group.id === "layout" && (!query.trim() || isLayoutMode)) {
                return null;
              }

              const startIndex = runningIndex;
              runningIndex += group.commands.length;

              return (
                <CommandSection
                  key={group.id}
                  group={group}
                  searchResults={query.trim() ? searchResults : undefined}
                  selectedIndex={selectedIndex}
                  startIndex={startIndex}
                  onCommandClick={executeCommand}
                />
              );
            })
          ) : query.trim() ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">No commands found</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Try a different search term
              </p>
            </div>
          ) : null}
        </div>

        <CommandPaletteFooter />
      </div>
    </div>
  );
}

function CommandPaletteFooter() {
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/30">
      <FooterHint keys="↑↓" label="Navigate" />
      <FooterHint keys="↵" label="Select" />
      <FooterHint keys="esc" label="Close" />
    </div>
  );
}

function FooterHint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">
        {keys}
      </kbd>
      <span>{label}</span>
    </span>
  );
}
