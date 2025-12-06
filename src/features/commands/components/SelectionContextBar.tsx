import { Square, Minus, Frame, Group, Trash2, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectionContext } from "../types/command";

interface SelectionContextBarProps {
  context: SelectionContext;
  onQuickAction?: (action: string) => void;
}

export function SelectionContextBar({
  context,
  onQuickAction,
}: SelectionContextBarProps) {
  if (!context.hasSelection) return null;

  const { selectionCount, selectedTypes, canGroup, canAlign } = context;

  const getTypeIcon = () => {
    if (selectedTypes.includes("artboard")) return Frame;
    if (selectedTypes.includes("line")) return Minus;
    return Square;
  };

  const TypeIcon = getTypeIcon();

  const getTypeLabel = () => {
    if (selectedTypes.length === 1) {
      const type = selectedTypes[0];
      return selectionCount === 1 ? type : `${type}es`;
    }
    return "items";
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
          <TypeIcon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {selectionCount} {getTypeLabel()} selected
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1">
        {canGroup && (
          <QuickActionButton
            icon={Group}
            label="Group"
            shortcut="G"
            onClick={() => onQuickAction?.("group")}
          />
        )}
        {canAlign && (
          <QuickActionButton
            icon={AlignLeft}
            label="Align"
            onClick={() => onQuickAction?.("align")}
          />
        )}
        <QuickActionButton
          icon={Trash2}
          label="Delete"
          shortcut="⌫"
          onClick={() => onQuickAction?.("delete")}
          variant="destructive"
        />
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

function QuickActionButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  variant = "default",
}: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
        variant === "destructive"
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {shortcut && (
        <kbd className="ml-0.5 px-1 py-0.5 text-[9px] font-mono bg-background/50 border border-border/50 rounded">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
