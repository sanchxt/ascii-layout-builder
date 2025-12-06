import { cn } from "@/lib/utils";
import type { Command } from "../types/command";

interface LayoutPreviewCardProps {
  command: Command;
  isSelected: boolean;
  onClick: () => void;
}

export function LayoutPreviewCard({
  command,
  isSelected,
  onClick,
}: LayoutPreviewCardProps) {
  const meta = command.meta?.layoutPreview;
  if (!meta) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center p-3 rounded-lg border transition-all duration-200",
        "hover:border-primary/50 hover:bg-accent/50",
        isSelected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border bg-card"
      )}
    >
      <div
        className={cn(
          "w-full aspect-4/3 rounded-md mb-2 flex items-center justify-center p-2",
          "bg-muted/50 border border-border/50"
        )}
      >
        {meta.type === "grid" ? (
          <GridPreview
            columns={meta.columns || 2}
            rows={meta.rows || 2}
            isSelected={isSelected}
          />
        ) : (
          <FlexPreview
            direction={meta.direction || "row"}
            count={meta.count || 3}
            isSelected={isSelected}
          />
        )}
      </div>

      <span
        className={cn(
          "text-xs font-medium transition-colors",
          isSelected ? "text-primary" : "text-foreground"
        )}
      >
        {command.label}
      </span>

      {command.shortcut && (
        <kbd
          className={cn(
            "absolute top-1.5 right-1.5 px-1 py-0.5 text-[9px] font-mono rounded",
            "bg-background/80 border border-border/50 text-muted-foreground"
          )}
        >
          {command.shortcut}
        </kbd>
      )}
    </button>
  );
}

function GridPreview({
  columns,
  rows,
  isSelected,
}: {
  columns: number;
  rows: number;
  isSelected: boolean;
}) {
  const cells = Array.from({ length: columns * rows });

  return (
    <div
      className="grid gap-1 w-full h-full"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {cells.map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-sm border transition-colors",
            isSelected
              ? "bg-primary/20 border-primary/40"
              : "bg-muted border-border/50 group-hover:border-primary/30"
          )}
        />
      ))}
    </div>
  );
}

function FlexPreview({
  direction,
  count,
  isSelected,
}: {
  direction: string;
  count: number;
  isSelected: boolean;
}) {
  const items = Array.from({ length: count });
  const isColumn = direction === "column" || direction === "col";

  return (
    <div
      className={cn(
        "flex gap-1 w-full h-full",
        isColumn ? "flex-col" : "flex-row"
      )}
    >
      {items.map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-sm border transition-colors",
            isSelected
              ? "bg-primary/20 border-primary/40"
              : "bg-muted border-border/50 group-hover:border-primary/30"
          )}
        />
      ))}
    </div>
  );
}

interface LayoutPreviewGridProps {
  commands: Command[];
  selectedIndex: number;
  startIndex: number;
  onCommandClick: (commandId: string) => void;
}

export function LayoutPreviewGrid({
  commands,
  selectedIndex,
  startIndex,
  onCommandClick,
}: LayoutPreviewGridProps) {
  const layoutCommands = commands.filter((cmd) => cmd.meta?.layoutPreview);

  if (layoutCommands.length === 0) return null;

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Layout Presets
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {layoutCommands.map((command, index) => {
          const globalIndex = startIndex + index;
          return (
            <LayoutPreviewCard
              key={command.id}
              command={command}
              isSelected={selectedIndex === globalIndex}
              onClick={() => onCommandClick(command.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
