import { ChevronDown } from "lucide-react";
import type { CommandGroup, SearchResult } from "../types/command";
import { CommandItem } from "./CommandItem";
import { cn } from "@/lib/utils";

interface CommandSectionProps {
  group: CommandGroup;
  searchResults?: SearchResult[];
  selectedIndex: number;
  startIndex: number;
  onCommandClick: (commandId: string) => void;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function CommandSection({
  group,
  searchResults,
  selectedIndex,
  startIndex,
  onCommandClick,
  isCollapsible = false,
}: CommandSectionProps) {
  const getMatchedIndices = (commandId: string): number[] => {
    if (!searchResults) return [];
    const result = searchResults.find((r) => r.command.id === commandId);
    return result?.matchedIndices || [];
  };

  return (
    <div className="py-1">
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2",
          isCollapsible && "cursor-pointer hover:bg-accent/30"
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {group.label}
        </span>
        <div className="flex-1 h-px bg-border/50" />
        {isCollapsible && (
          <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
        )}
      </div>

      <div className="space-y-0.5">
        {group.commands.map((command, index) => {
          const globalIndex = startIndex + index;
          return (
            <CommandItem
              key={command.id}
              command={command}
              isSelected={selectedIndex === globalIndex}
              onClick={() => onCommandClick(command.id)}
              dataIndex={globalIndex}
              matchedIndices={getMatchedIndices(command.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
