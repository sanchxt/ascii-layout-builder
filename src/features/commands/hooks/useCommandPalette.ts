import { useEffect, useCallback, useMemo } from "react";
import { useCommandStore } from "../store/commandStore";
import {
  searchCommands,
  registerCommand,
  createLayoutPresetCommands,
} from "../registry/commandRegistry";
import { useLayoutGeneration } from "@/features/layout-system/hooks/useLayoutGeneration";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import {
  parseLayoutCommand,
  getCommandSuggestions,
} from "@/features/layout-system/lib/layoutParser";
import type { Command } from "../types/command";

interface UseCommandPaletteReturn {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  mode: "search" | "layout";
  filteredCommands: Command[];
  layoutSuggestions: string[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  moveSelection: (direction: "up" | "down") => void;
  executeSelected: () => void;
  executeCommand: (id: string) => void;
  switchToLayoutMode: () => void;
}

export function useCommandPalette(): UseCommandPaletteReturn {
  const store = useCommandStore();
  const {
    isOpen,
    query,
    selectedIndex,
    mode,
    open,
    close,
    toggle,
    setQuery,
    setSelectedIndex,
    moveSelection,
    setMode,
    layoutTargetId,
    layoutTargetType,
    setLayoutTarget,
  } = store;

  const { executeLayoutCommand, canGenerateLayout, getLayoutTarget } =
    useLayoutGeneration();
  const setSelectedTool = useCanvasStore((state) => state.setSelectedTool);

  useEffect(() => {
    const layoutCommands = createLayoutPresetCommands((config, count) => {
      const targetId = useCommandStore.getState().layoutTargetId;
      const targetType = useCommandStore.getState().layoutTargetType;

      if (!targetId || !targetType) {
        console.warn("No target for layout");
        return;
      }

      executeLayoutCommand(
        config.type === "flex"
          ? `flex ${config.direction} ${count}`
          : `grid ${config.columns}x${config.rows}`,
        targetId,
        targetType
      );
      close();
    });

    const toolCommands: Command[] = [
      {
        id: "tool-select",
        label: "Selection Tool",
        shortcut: "V",
        category: "tool",
        handler: () => {
          setSelectedTool("select");
          close();
        },
        icon: "MousePointer2",
      },
      {
        id: "tool-box",
        label: "Box Tool",
        shortcut: "B",
        category: "tool",
        handler: () => {
          setSelectedTool("box");
          close();
        },
        icon: "Square",
      },
      {
        id: "tool-text",
        label: "Text Tool",
        shortcut: "T",
        category: "tool",
        handler: () => {
          setSelectedTool("text");
          close();
        },
        icon: "Type",
      },
      {
        id: "tool-artboard",
        label: "Artboard Tool",
        shortcut: "A",
        category: "tool",
        handler: () => {
          setSelectedTool("artboard");
          close();
        },
        icon: "Frame",
      },
    ];

    [...layoutCommands, ...toolCommands].forEach(registerCommand);
  }, [close, executeLayoutCommand, getLayoutTarget, setSelectedTool]);

  const filteredCommands = useMemo(() => {
    if (mode === "layout") return [];
    return searchCommands(query);
  }, [query, mode]);

  const layoutSuggestions = useMemo(() => {
    if (mode !== "layout") return [];
    return getCommandSuggestions(query);
  }, [query, mode]);

  useEffect(() => {
    const maxIndex =
      mode === "layout"
        ? layoutSuggestions.length - 1
        : filteredCommands.length - 1;
    if (selectedIndex > maxIndex && maxIndex >= 0) {
      setSelectedIndex(maxIndex);
    }
  }, [
    filteredCommands.length,
    layoutSuggestions.length,
    selectedIndex,
    mode,
    setSelectedIndex,
  ]);

  const executeSelected = useCallback(() => {
    if (mode === "layout") {
      const parsed = parseLayoutCommand(query);
      if (parsed.valid) {
        const result = executeLayoutCommand(
          query,
          layoutTargetId,
          layoutTargetType
        );
        if (result.success) {
          close();
        }
      } else if (
        layoutSuggestions.length > 0 &&
        selectedIndex < layoutSuggestions.length
      ) {
        const suggestion = layoutSuggestions[selectedIndex];
        setQuery(suggestion);
      }
    } else {
      if (
        filteredCommands.length > 0 &&
        selectedIndex < filteredCommands.length
      ) {
        const command = filteredCommands[selectedIndex];
        command.handler();
      }
    }
  }, [
    mode,
    query,
    selectedIndex,
    filteredCommands,
    layoutSuggestions,
    executeLayoutCommand,
    close,
    setQuery,
    layoutTargetId,
    layoutTargetType,
  ]);

  const executeCommand = useCallback(
    (id: string) => {
      const command = filteredCommands.find((cmd) => cmd.id === id);
      if (command) {
        command.handler();
      }
    },
    [filteredCommands]
  );

  const switchToLayoutMode = useCallback(() => {
    setMode("layout");
  }, [setMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!isOpen) {
          const target = getLayoutTarget();
          setLayoutTarget(
            target.id,
            target.type === "none" ? null : target.type
          );
        }
        toggle();
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          close();
          break;
        case "ArrowUp":
          e.preventDefault();
          moveSelection("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          moveSelection("down");
          break;
        case "Enter":
          e.preventDefault();
          executeSelected();
          break;
        case "Tab":
          e.preventDefault();
          setMode(mode === "search" ? "layout" : "search");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    close,
    toggle,
    moveSelection,
    executeSelected,
    mode,
    setMode,
    getLayoutTarget,
    setLayoutTarget,
  ]);

  return {
    isOpen,
    query,
    selectedIndex,
    mode,
    filteredCommands,
    layoutSuggestions,
    open,
    close,
    toggle,
    setQuery,
    moveSelection,
    executeSelected,
    executeCommand,
    switchToLayoutMode,
  };
}
