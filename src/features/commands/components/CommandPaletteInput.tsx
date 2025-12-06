import { forwardRef } from "react";
import { Search, LayoutGrid, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteInputProps {
  query: string;
  setQuery: (query: string) => void;
  placeholder?: string;
  isLayoutMode?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const CommandPaletteInput = forwardRef<
  HTMLInputElement,
  CommandPaletteInputProps
>(({ query, setQuery, placeholder, isLayoutMode, onKeyDown }, ref) => {
  return (
    <div className="relative flex items-center gap-3 px-4 py-3.5 border-b border-border bg-card/50">
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
          isLayoutMode
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isLayoutMode ? (
          <LayoutGrid className="w-4 h-4" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>

      <input
        ref={ref}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder || "Search commands..."}
        className={cn(
          "flex-1 text-sm bg-transparent border-none outline-none",
          "text-foreground placeholder:text-muted-foreground/60",
          "font-medium tracking-tight"
        )}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <div className="flex items-center gap-1.5 text-muted-foreground/50">
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-muted/50 border border-border/50 rounded">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </kbd>
      </div>
    </div>
  );
});

CommandPaletteInput.displayName = "CommandPaletteInput";
