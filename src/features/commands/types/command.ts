export type CommandCategory = "layout" | "tool" | "view" | "action" | "edit";

export interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  category: CommandCategory;
  keywords?: string[];
  handler: () => void;
  isAvailable?: () => boolean;
  icon?: string;
}

export interface CommandGroup {
  id: string;
  label: string;
  commands: Command[];
}

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  mode: "search" | "layout";
  layoutTargetId: string | null;
  layoutTargetType: "box" | "artboard" | null;
}

export interface CommandPaletteActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  moveSelection: (direction: "up" | "down") => void;
  setMode: (mode: CommandPaletteState["mode"]) => void;
  executeSelected: () => void;
  setLayoutTarget: (id: string | null, type: "box" | "artboard" | null) => void;
  clearLayoutTarget: () => void;
}

export interface InlineCommandState {
  isActive: boolean;
  targetId: string | null;
  targetType: "box" | "artboard" | null;
  query: string;
  position: { x: number; y: number } | null;
}

export interface InlineCommandActions {
  activate: (
    targetId: string,
    targetType: "box" | "artboard",
    position: { x: number; y: number }
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
