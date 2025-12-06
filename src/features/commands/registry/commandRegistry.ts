import type { Command, CommandGroup, CommandCategory } from "../types/command";
import { CATEGORY_CONFIG } from "../types/command";
import { LAYOUT_PRESETS } from "@/features/layout-system/types/layout";

const commands: Map<string, Command> = new Map();

export function registerCommand(command: Command): void {
  commands.set(command.id, command);
}

export function registerCommands(commandList: Command[]): void {
  commandList.forEach((cmd) => commands.set(cmd.id, cmd));
}

export function unregisterCommand(id: string): void {
  commands.delete(id);
}

export function getCommand(id: string): Command | undefined {
  return commands.get(id);
}

export function getAllCommands(): Command[] {
  return Array.from(commands.values());
}

export function getCommandsByCategory(category: CommandCategory): Command[] {
  return getAllCommands().filter((cmd) => cmd.category === category);
}

export function getAvailableCommands(): Command[] {
  return getAllCommands().filter(
    (cmd) => !cmd.isAvailable || cmd.isAvailable()
  );
}

export function searchCommands(query: string): Command[] {
  if (!query.trim()) {
    return getAvailableCommands();
  }

  const lowerQuery = query.toLowerCase();

  return getAvailableCommands()
    .filter((cmd) => {
      if (cmd.label.toLowerCase().includes(lowerQuery)) return true;
      if (cmd.description?.toLowerCase().includes(lowerQuery)) return true;
      if (cmd.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery)))
        return true;
      if (cmd.id.toLowerCase().includes(lowerQuery)) return true;
      return false;
    })
    .sort((a, b) => {
      const aLabelMatch = a.label.toLowerCase().startsWith(lowerQuery);
      const bLabelMatch = b.label.toLowerCase().startsWith(lowerQuery);
      if (aLabelMatch && !bLabelMatch) return -1;
      if (!aLabelMatch && bLabelMatch) return 1;
      return 0;
    });
}

export function getGroupedCommands(): CommandGroup[] {
  const groups: Record<CommandCategory, Command[]> = {
    tool: [],
    edit: [],
    layout: [],
    alignment: [],
    layer: [],
    view: [],
    action: [],
  };

  getAvailableCommands().forEach((cmd) => {
    if (groups[cmd.category]) {
      groups[cmd.category].push(cmd);
    }
  });

  return Object.entries(groups)
    .filter(([, cmds]) => cmds.length > 0)
    .map(([category, cmds]) => {
      const config = CATEGORY_CONFIG[category as CommandCategory];
      return {
        id: category,
        label: config.label,
        icon: config.icon,
        commands: cmds,
      };
    })
    .sort((a, b) => {
      const orderA = CATEGORY_CONFIG[a.id as CommandCategory]?.order ?? 99;
      const orderB = CATEGORY_CONFIG[b.id as CommandCategory]?.order ?? 99;
      return orderA - orderB;
    });
}

export function createLayoutPresetCommands(
  executeLayout: (
    config: (typeof LAYOUT_PRESETS)[number]["config"],
    count: number
  ) => void
): Command[] {
  return LAYOUT_PRESETS.filter((preset) => preset.config.type !== "none").map(
    (preset) => ({
      id: `layout-${preset.id}`,
      label: preset.name,
      description: preset.description,
      category: "layout" as const,
      keywords: [preset.id, preset.config.type, "layout", "preset"],
      handler: () => executeLayout(preset.config, preset.childCount),
      icon: preset.config.type === "flex" ? "Columns" : "Grid",
      meta: {
        layoutPreview: {
          type: preset.config.type as "flex" | "grid",
          direction:
            preset.config.type === "flex" ? preset.config.direction : undefined,
          columns:
            preset.config.type === "grid" ? preset.config.columns : undefined,
          rows: preset.config.type === "grid" ? preset.config.rows : undefined,
          count: preset.childCount,
        },
      },
    })
  );
}

export function clearCommands(): void {
  commands.clear();
}

export function createToolCommands(
  setSelectedTool: (
    tool: "select" | "box" | "text" | "artboard" | "line"
  ) => void,
  close: () => void
): Command[] {
  return [
    {
      id: "tool-select",
      label: "Selection Tool",
      description: "Select and move elements",
      shortcut: "V",
      category: "tool",
      keywords: ["select", "pointer", "cursor", "move", "arrow"],
      icon: "MousePointer2",
      priority: "high",
      handler: () => {
        setSelectedTool("select");
        close();
      },
    },
    {
      id: "tool-box",
      label: "Box Tool",
      description: "Draw rectangular boxes",
      shortcut: "B",
      category: "tool",
      keywords: ["box", "rectangle", "frame", "container", "shape"],
      icon: "Square",
      handler: () => {
        setSelectedTool("box");
        close();
      },
    },
    {
      id: "tool-text",
      label: "Text Tool",
      description: "Add text labels",
      shortcut: "T",
      category: "tool",
      keywords: ["text", "type", "label", "write", "font"],
      icon: "Type",
      handler: () => {
        setSelectedTool("text");
        close();
      },
    },
    {
      id: "tool-artboard",
      label: "Artboard Tool",
      description: "Create artboards for different screen sizes",
      shortcut: "A",
      category: "tool",
      keywords: ["artboard", "canvas", "screen", "page", "frame"],
      icon: "Frame",
      handler: () => {
        setSelectedTool("artboard");
        close();
      },
    },
    {
      id: "tool-line",
      label: "Line Tool",
      description: "Draw connection lines",
      shortcut: "L",
      category: "tool",
      keywords: ["line", "connector", "arrow", "path"],
      icon: "Minus",
      handler: () => {
        setSelectedTool("line");
        close();
      },
    },
  ];
}

export function createViewCommands(
  canvasActions: {
    toggleGrid: () => void;
    toggleSnapToGrid: () => void;
    toggleSmartGuides: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
  },
  outputActions: {
    toggle: () => void;
  },
  themeActions: {
    toggleThemeBuilder: () => void;
  },
  close: () => void
): Command[] {
  return [
    {
      id: "view-toggle-grid",
      label: "Toggle Grid",
      description: "Show or hide the canvas grid",
      shortcut: "⌘'",
      category: "view",
      keywords: ["grid", "background", "guides", "toggle"],
      icon: "Grid",
      handler: () => {
        canvasActions.toggleGrid();
        close();
      },
    },
    {
      id: "view-toggle-snap",
      label: "Toggle Snap to Grid",
      description: "Enable or disable snapping to grid",
      category: "view",
      keywords: ["snap", "grid", "align", "magnetic"],
      icon: "Magnet",
      handler: () => {
        canvasActions.toggleSnapToGrid();
        close();
      },
    },
    {
      id: "view-toggle-guides",
      label: "Toggle Smart Guides",
      description: "Show alignment guides when dragging",
      category: "view",
      keywords: ["guides", "smart", "align", "snap"],
      icon: "Ruler",
      handler: () => {
        canvasActions.toggleSmartGuides();
        close();
      },
    },
    {
      id: "view-toggle-output",
      label: "Toggle Output Panel",
      description: "Show or hide the ASCII/Code output panel",
      shortcut: "⌘/",
      category: "view",
      keywords: ["output", "preview", "ascii", "code", "panel"],
      icon: "Code2",
      handler: () => {
        outputActions.toggle();
        close();
      },
    },
    {
      id: "view-zoom-in",
      label: "Zoom In",
      description: "Increase canvas zoom level",
      shortcut: "⌘+",
      category: "view",
      keywords: ["zoom", "in", "magnify", "bigger"],
      icon: "ZoomIn",
      handler: () => {
        canvasActions.zoomIn();
        close();
      },
    },
    {
      id: "view-zoom-out",
      label: "Zoom Out",
      description: "Decrease canvas zoom level",
      shortcut: "⌘-",
      category: "view",
      keywords: ["zoom", "out", "smaller"],
      icon: "ZoomOut",
      handler: () => {
        canvasActions.zoomOut();
        close();
      },
    },
    {
      id: "view-reset-zoom",
      label: "Reset Zoom",
      description: "Reset zoom to 100%",
      shortcut: "⌘0",
      category: "view",
      keywords: ["zoom", "reset", "100", "default"],
      icon: "Maximize2",
      handler: () => {
        canvasActions.resetZoom();
        close();
      },
    },
    {
      id: "view-theme-builder",
      label: "Open Theme Builder",
      description: "Customize the application theme",
      category: "view",
      keywords: ["theme", "color", "customize", "dark", "light"],
      icon: "Palette",
      handler: () => {
        themeActions.toggleThemeBuilder();
        close();
      },
    },
  ];
}

export function createEditCommands(
  boxActions: {
    deleteSelectedBoxes: () => void;
    duplicateBoxes: (ids: string[]) => void;
    copyBoxes: () => void;
    pasteBoxes: () => void;
    selectAll: () => void;
    deselectAll: () => void;
  },
  historyActions: {
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
  },
  getSelectedBoxIds: () => string[],
  close: () => void
): Command[] {
  return [
    {
      id: "edit-undo",
      label: "Undo",
      description: "Undo the last action",
      shortcut: "⌘Z",
      category: "edit",
      keywords: ["undo", "back", "revert"],
      icon: "Undo2",
      priority: "high",
      handler: () => {
        historyActions.undo();
        close();
      },
      isAvailable: historyActions.canUndo,
    },
    {
      id: "edit-redo",
      label: "Redo",
      description: "Redo the last undone action",
      shortcut: "⌘⇧Z",
      category: "edit",
      keywords: ["redo", "forward"],
      icon: "Redo2",
      handler: () => {
        historyActions.redo();
        close();
      },
      isAvailable: historyActions.canRedo,
    },
    {
      id: "edit-delete",
      label: "Delete Selected",
      description: "Delete selected elements",
      shortcut: "⌫",
      category: "edit",
      keywords: ["delete", "remove", "clear"],
      icon: "Trash2",
      handler: () => {
        boxActions.deleteSelectedBoxes();
        close();
      },
      meta: {
        requiresSelection: true,
      },
    },
    {
      id: "edit-duplicate",
      label: "Duplicate",
      description: "Duplicate selected elements",
      shortcut: "⌘D",
      category: "edit",
      keywords: ["duplicate", "copy", "clone"],
      icon: "Copy",
      handler: () => {
        const selectedIds = getSelectedBoxIds();
        if (selectedIds.length > 0) {
          boxActions.duplicateBoxes(selectedIds);
        }
        close();
      },
      meta: {
        requiresSelection: true,
      },
    },
    {
      id: "edit-copy",
      label: "Copy",
      description: "Copy selected elements to clipboard",
      shortcut: "⌘C",
      category: "edit",
      keywords: ["copy", "clipboard"],
      icon: "Clipboard",
      handler: () => {
        boxActions.copyBoxes();
        close();
      },
      meta: {
        requiresSelection: true,
      },
    },
    {
      id: "edit-paste",
      label: "Paste",
      description: "Paste from clipboard",
      shortcut: "⌘V",
      category: "edit",
      keywords: ["paste", "clipboard"],
      icon: "ClipboardPaste",
      handler: () => {
        boxActions.pasteBoxes();
        close();
      },
    },
    {
      id: "edit-select-all",
      label: "Select All",
      description: "Select all elements",
      shortcut: "⌘A",
      category: "edit",
      keywords: ["select", "all"],
      icon: "CheckSquare",
      handler: () => {
        boxActions.selectAll();
        close();
      },
    },
    {
      id: "edit-deselect",
      label: "Deselect All",
      description: "Clear selection",
      shortcut: "Esc",
      category: "edit",
      keywords: ["deselect", "clear", "none"],
      icon: "Square",
      handler: () => {
        boxActions.deselectAll();
        close();
      },
    },
  ];
}

export function createAlignmentCommands(
  alignBoxes: (ids: string[], alignment: string) => void,
  distributeBoxes: (ids: string[], distribution: string) => void,
  getSelectedBoxIds: () => string[],
  close: () => void
): Command[] {
  const createAlignCommand = (
    id: string,
    label: string,
    alignment: string,
    icon: string,
    keywords: string[]
  ): Command => ({
    id: `align-${id}`,
    label,
    description: `Align selected elements to ${id}`,
    category: "alignment",
    keywords: ["align", ...keywords],
    icon,
    handler: () => {
      const selectedIds = getSelectedBoxIds();
      if (selectedIds.length >= 2) {
        alignBoxes(selectedIds, alignment);
      }
      close();
    },
    meta: {
      requiresSelection: true,
      minSelectionCount: 2,
    },
  });

  const createDistributeCommand = (
    id: string,
    label: string,
    distribution: string,
    icon: string,
    keywords: string[]
  ): Command => ({
    id: `distribute-${id}`,
    label,
    description: `Distribute selected elements ${id}`,
    category: "alignment",
    keywords: ["distribute", "space", ...keywords],
    icon,
    handler: () => {
      const selectedIds = getSelectedBoxIds();
      if (selectedIds.length >= 3) {
        distributeBoxes(selectedIds, distribution);
      }
      close();
    },
    meta: {
      requiresSelection: true,
      minSelectionCount: 3,
    },
  });

  return [
    createAlignCommand("left", "Align Left", "left", "AlignStartVertical", [
      "left",
    ]),
    createAlignCommand(
      "center-h",
      "Align Center Horizontal",
      "centerHorizontal",
      "AlignCenterVertical",
      ["center", "horizontal", "middle"]
    ),
    createAlignCommand("right", "Align Right", "right", "AlignEndVertical", [
      "right",
    ]),
    createAlignCommand("top", "Align Top", "top", "AlignStartHorizontal", [
      "top",
    ]),
    createAlignCommand(
      "center-v",
      "Align Center Vertical",
      "centerVertical",
      "AlignCenterHorizontal",
      ["center", "vertical", "middle"]
    ),
    createAlignCommand(
      "bottom",
      "Align Bottom",
      "bottom",
      "AlignEndHorizontal",
      ["bottom"]
    ),
    createDistributeCommand(
      "horizontal",
      "Distribute Horizontally",
      "horizontal",
      "AlignHorizontalDistributeCenter",
      ["horizontal", "even"]
    ),
    createDistributeCommand(
      "vertical",
      "Distribute Vertically",
      "vertical",
      "AlignVerticalDistributeCenter",
      ["vertical", "even"]
    ),
  ];
}

export function createLayerCommands(
  boxActions: {
    groupBoxes: (ids: string[]) => void;
    ungroupBox: (id: string) => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    bringForward: (id: string) => void;
    sendBackward: (id: string) => void;
  },
  getSelectedBoxIds: () => string[],
  getBox: (id: string) => { children: string[] } | undefined,
  close: () => void
): Command[] {
  return [
    {
      id: "layer-group",
      label: "Group",
      description: "Group selected elements",
      shortcut: "⌘G",
      category: "layer",
      keywords: ["group", "combine", "merge"],
      icon: "Group",
      handler: () => {
        const selectedIds = getSelectedBoxIds();
        if (selectedIds.length >= 2) {
          boxActions.groupBoxes(selectedIds);
        }
        close();
      },
      meta: {
        requiresSelection: true,
        minSelectionCount: 2,
      },
    },
    {
      id: "layer-ungroup",
      label: "Ungroup",
      description: "Ungroup selected group",
      shortcut: "⌘⇧G",
      category: "layer",
      keywords: ["ungroup", "separate", "split"],
      icon: "Ungroup",
      handler: () => {
        const selectedIds = getSelectedBoxIds();
        if (selectedIds.length === 1) {
          const box = getBox(selectedIds[0]);
          if (box && box.children.length > 0) {
            boxActions.ungroupBox(selectedIds[0]);
          }
        }
        close();
      },
      meta: {
        requiresSelection: true,
        maxSelectionCount: 1,
      },
    },
    {
      id: "layer-bring-front",
      label: "Bring to Front",
      description: "Move element to the front",
      shortcut: "⌘]",
      category: "layer",
      keywords: ["front", "top", "above", "forward"],
      icon: "BringToFront",
      handler: () => {
        const selectedIds = getSelectedBoxIds();
        if (selectedIds.length === 1) {
          boxActions.bringToFront(selectedIds[0]);
        }
        close();
      },
      meta: {
        requiresSelection: true,
        maxSelectionCount: 1,
      },
    },
    {
      id: "layer-send-back",
      label: "Send to Back",
      description: "Move element to the back",
      shortcut: "⌘[",
      category: "layer",
      keywords: ["back", "bottom", "below", "behind"],
      icon: "SendToBack",
      handler: () => {
        const selectedIds = getSelectedBoxIds();
        if (selectedIds.length === 1) {
          boxActions.sendToBack(selectedIds[0]);
        }
        close();
      },
      meta: {
        requiresSelection: true,
        maxSelectionCount: 1,
      },
    },
    {
      id: "layer-bring-forward",
      label: "Bring Forward",
      description: "Move element one layer up",
      category: "layer",
      keywords: ["forward", "up", "layer"],
      icon: "ArrowUp",
      handler: () => {
        const selectedIds = getSelectedBoxIds();
        if (selectedIds.length === 1) {
          boxActions.bringForward(selectedIds[0]);
        }
        close();
      },
      meta: {
        requiresSelection: true,
        maxSelectionCount: 1,
      },
    },
    {
      id: "layer-send-backward",
      label: "Send Backward",
      description: "Move element one layer down",
      category: "layer",
      keywords: ["backward", "down", "layer"],
      icon: "ArrowDown",
      handler: () => {
        const selectedIds = getSelectedBoxIds();
        if (selectedIds.length === 1) {
          boxActions.sendBackward(selectedIds[0]);
        }
        close();
      },
      meta: {
        requiresSelection: true,
        maxSelectionCount: 1,
      },
    },
  ];
}

export function createActionCommands(
  themeActions: {
    toggleMode: () => void;
  },
  close: () => void
): Command[] {
  return [
    {
      id: "action-toggle-theme",
      label: "Toggle Dark/Light Theme",
      description: "Switch between dark and light mode",
      category: "action",
      keywords: ["theme", "dark", "light", "mode", "toggle"],
      icon: "Moon",
      handler: () => {
        themeActions.toggleMode();
        close();
      },
    },
  ];
}
