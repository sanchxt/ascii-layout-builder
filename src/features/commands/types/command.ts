export type CommandCategory =
  | "tool"
  | "layout"
  | "view"
  | "edit"
  | "action"
  | "alignment"
  | "layer";

export type CommandPriority = "high" | "normal" | "low";

export type SelectableType = "box" | "line" | "artboard";

export interface CommandMeta {
  layoutPreview?: {
    type: "flex" | "grid";
    direction?: "row" | "column";
    columns?: number;
    rows?: number;
    count?: number;
  };
  requiresSelection?: boolean;
  selectionType?: SelectableType[];
  minSelectionCount?: number;
  maxSelectionCount?: number;
}

export interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  category: CommandCategory;
  keywords?: string[];
  icon?: string;
  handler: () => void;
  isAvailable?: () => boolean;
  priority?: CommandPriority;
  meta?: CommandMeta;
}

export interface CommandGroup {
  id: string;
  label: string;
  commands: Command[];
  icon?: string;
}

export interface RecentCommandEntry {
  commandId: string;
  timestamp: number;
  executionCount: number;
}

export interface SelectionContext {
  hasSelection: boolean;
  selectionCount: number;
  selectedTypes: SelectableType[];
  activeItem: {
    id: string;
    type: SelectableType;
    name?: string;
  } | null;
  canGroup: boolean;
  canUngroup: boolean;
  canAlign: boolean;
  canDistribute: boolean;
}

export interface SearchResult {
  command: Command;
  score: number;
  matchedIndices: number[];
}

export type SearchResults =
  | { type: "browse"; recent: Command[]; grouped: CommandGroup[] }
  | {
      type: "layout";
      parsed: {
        valid: boolean;
        type?: string;
        direction?: string;
        count?: number;
        columns?: number;
        rows?: number;
      };
      suggestions: string[];
      layoutCommands: Command[];
    }
  | { type: "search"; results: SearchResult[]; grouped: CommandGroup[] };

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  layoutTargetId: string | null;
  layoutTargetType: "box" | "artboard" | null;
  recentCommands: RecentCommandEntry[];
}

export interface CommandPaletteActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  moveSelection: (direction: "up" | "down") => void;
  executeSelected: () => void;
  setLayoutTarget: (id: string | null, type: "box" | "artboard" | null) => void;
  clearLayoutTarget: () => void;
  recordCommandExecution: (commandId: string) => void;
}

export interface InlineCommandState {
  isActive: boolean;
  targetId: string | null;
  targetType: "box" | "artboard" | null;
  targetName?: string;
  query: string;
  position: { x: number; y: number } | null;
}

export interface InlineCommandActions {
  activate: (
    targetId: string,
    targetType: "box" | "artboard",
    position: { x: number; y: number },
    targetName?: string
  ) => void;
  deactivate: () => void;
  setQuery: (query: string) => void;
  execute: () => void;
}

export interface CommandStore
  extends CommandPaletteState,
    CommandPaletteActions {
  inline: InlineCommandState;
  inlineActions: InlineCommandActions;
}

export const CATEGORY_CONFIG: Record<
  CommandCategory,
  { label: string; icon: string; order: number }
> = {
  tool: { label: "Tools", icon: "MousePointer2", order: 1 },
  edit: { label: "Edit", icon: "Pencil", order: 2 },
  layout: { label: "Layout", icon: "LayoutGrid", order: 3 },
  alignment: { label: "Alignment", icon: "AlignLeft", order: 4 },
  layer: { label: "Layers", icon: "Layers", order: 5 },
  view: { label: "View", icon: "Eye", order: 6 },
  action: { label: "Actions", icon: "Zap", order: 7 },
};
