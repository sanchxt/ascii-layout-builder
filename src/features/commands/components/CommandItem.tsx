import {
  MousePointer2,
  Square,
  Type,
  Frame,
  Minus,
  Grid,
  Columns,
  Eye,
  Pencil,
  Layers,
  Zap,
  AlignLeft,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Clipboard,
  ClipboardPaste,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Code2,
  Palette,
  Moon,
  Ruler,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  Command,
  LayoutGrid,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  type LucideIcon,
} from "lucide-react";
import type { Command as CommandType } from "../types/command";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  MousePointer2,
  Square,
  Type,
  Frame,
  Minus,
  Grid,
  Columns,
  Eye,
  Pencil,
  Layers,
  Zap,
  AlignLeft,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Clipboard,
  ClipboardPaste,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Code2,
  Palette,
  Moon,
  Ruler,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,

  Magnet: Layers,
  BringToFront: ArrowUp,
  SendToBack: ArrowDown,
};

interface CommandItemProps {
  command: CommandType;
  isSelected: boolean;
  onClick: () => void;
  dataIndex: number;
  matchedIndices?: number[];
}

export function CommandItem({
  command,
  isSelected,
  onClick,
  dataIndex,
  matchedIndices = [],
}: CommandItemProps) {
  const Icon = command.icon ? iconMap[command.icon] || Command : Command;

  return (
    <button
      data-index={dataIndex}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150",
        "group relative",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-accent/50"
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full transition-all duration-200",
          isSelected ? "bg-primary" : "bg-transparent"
        )}
      />

      <div
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-md transition-colors",
          isSelected
            ? "bg-primary/15 text-primary"
            : "bg-muted/50 text-muted-foreground group-hover:text-foreground"
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            <HighlightedText
              text={command.label}
              matchedIndices={matchedIndices}
            />
          </span>
        </div>
        {command.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {command.description}
          </p>
        )}
      </div>

      {command.shortcut && (
        <kbd
          className={cn(
            "px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors",
            isSelected
              ? "bg-background/50 border-border text-foreground"
              : "bg-muted/50 border-border/50 text-muted-foreground"
          )}
        >
          {command.shortcut}
        </kbd>
      )}
    </button>
  );
}

function HighlightedText({
  text,
  matchedIndices,
}: {
  text: string;
  matchedIndices: number[];
}) {
  if (matchedIndices.length === 0) {
    return <>{text}</>;
  }

  const indexSet = new Set(matchedIndices);
  const segments: { text: string; highlight: boolean }[] = [];
  let currentSegment = "";
  let currentHighlight = indexSet.has(0);

  for (let i = 0; i < text.length; i++) {
    const isMatch = indexSet.has(i);
    if (isMatch !== currentHighlight) {
      if (currentSegment) {
        segments.push({ text: currentSegment, highlight: currentHighlight });
      }
      currentSegment = text[i];
      currentHighlight = isMatch;
    } else {
      currentSegment += text[i];
    }
  }

  if (currentSegment) {
    segments.push({ text: currentSegment, highlight: currentHighlight });
  }

  return (
    <>
      {segments.map((segment, i) =>
        segment.highlight ? (
          <span key={i} className="text-primary font-semibold">
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </>
  );
}
