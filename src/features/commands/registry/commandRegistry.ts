import type { Command, CommandGroup } from "../types/command";
import { LAYOUT_PRESETS } from "@/features/layout-system/types/layout";

const commands: Map<string, Command> = new Map();

export function registerCommand(command: Command): void {
  commands.set(command.id, command);
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

export function getCommandsByCategory(
  category: Command["category"]
): Command[] {
  return getAllCommands().filter((cmd) => cmd.category === category);
}

export function searchCommands(query: string): Command[] {
  if (!query.trim()) {
    return getAllCommands().filter(
      (cmd) => !cmd.isAvailable || cmd.isAvailable()
    );
  }

  const lowerQuery = query.toLowerCase();

  return getAllCommands()
    .filter((cmd) => {
      if (cmd.isAvailable && !cmd.isAvailable()) return false;

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
  const groups: Record<string, Command[]> = {
    layout: [],
    tool: [],
    view: [],
    action: [],
    edit: [],
  };

  getAllCommands().forEach((cmd) => {
    if (!cmd.isAvailable || cmd.isAvailable()) {
      groups[cmd.category].push(cmd);
    }
  });

  return [
    { id: "layout", label: "Layout", commands: groups.layout },
    { id: "tool", label: "Tools", commands: groups.tool },
    { id: "view", label: "View", commands: groups.view },
    { id: "action", label: "Actions", commands: groups.action },
    { id: "edit", label: "Edit", commands: groups.edit },
  ].filter((group) => group.commands.length > 0);
}

export function createLayoutPresetCommands(
  executeLayout: (
    config: (typeof LAYOUT_PRESETS)[number]["config"],
    count: number
  ) => void
): Command[] {
  return LAYOUT_PRESETS.map((preset) => ({
    id: `layout-${preset.id}`,
    label: preset.name,
    description: preset.description,
    category: "layout" as const,
    keywords: [preset.id, preset.config.type],
    handler: () => executeLayout(preset.config, preset.childCount),
    icon: preset.config.type === "flex" ? "Columns" : "Grid",
  }));
}

export function clearCommands(): void {
  commands.clear();
}
