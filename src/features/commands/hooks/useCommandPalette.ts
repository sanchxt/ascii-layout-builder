import { useEffect, useCallback, useMemo, useState } from "react";
import { useCommandStore } from "../store/commandStore";
import {
  registerCommands,
  getAllCommands,
  getCommand,
  createLayoutPresetCommands,
  createToolCommands,
  createViewCommands,
  createEditCommands,
  createAlignmentCommands,
  createLayerCommands,
  createActionCommands,
  clearCommands,
} from "../registry/commandRegistry";
import { fuzzySearch, detectLayoutSyntax } from "../registry/searchUtils";
import { useLayoutGeneration } from "@/features/layout-system/hooks/useLayoutGeneration";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useSelectionStore } from "@/features/selection/store/selectionStore";
import { useHistoryStore } from "@/features/history/store/historyStore";
import { useOutputDrawerStore } from "@/features/output-drawer/store/outputDrawerStore";
import { useThemeStore } from "@/features/theme/store/themeStore";
import { parseLayoutCommand } from "@/features/layout-system/lib/layoutParser";
import type {
  SelectionContext,
  SearchResult,
  RecentCommandEntry,
} from "../types/command";
import type { AlignmentType } from "@/features/alignment/types/alignment";
import type { DistributionType } from "@/features/alignment/types/alignment";

interface UseCommandPaletteReturn {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  searchResults: SearchResult[];
  allCommands: import("../types/command").Command[];
  recentCommands: RecentCommandEntry[];
  layoutSuggestions: string[];
  isLayoutMode: boolean;
  selectionContext: SelectionContext;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  moveSelection: (direction: "up" | "down") => void;
  executeSelected: () => void;
  executeCommand: (id: string) => void;
  onQuickAction: (action: string) => void;
}

export function useCommandPalette(): UseCommandPaletteReturn {
  const store = useCommandStore();
  const {
    isOpen,
    query,
    selectedIndex,
    open,
    close,
    toggle,
    setQuery,
    setSelectedIndex,
    moveSelection,
    layoutTargetId,
    layoutTargetType,
    setLayoutTarget,
    recentCommands,
    recordCommandExecution,
  } = store;

  const { executeLayoutCommand, getLayoutTarget } = useLayoutGeneration();

  const canvasStore = useCanvasStore();

  const boxStore = useBoxStore();

  const selectionStore = useSelectionStore();
  const selectedIds = selectionStore.selectedIds;

  const historyStore = useHistoryStore();

  const outputStore = useOutputDrawerStore();

  const themeStore = useThemeStore();

  const selectionContext = useMemo((): SelectionContext => {
    const selectionStoreBoxIds = selectedIds
      .filter((item) => item.type === "box")
      .map((item) => item.id);
    const boxStoreSelectedIds = boxStore.selectedBoxIds;

    const selectedBoxIds = [
      ...new Set([...selectionStoreBoxIds, ...boxStoreSelectedIds]),
    ];

    const selectedLineIds = selectedIds
      .filter((item) => item.type === "line")
      .map((item) => item.id);

    const selectedTypes: ("box" | "line" | "artboard")[] = [];
    if (selectedBoxIds.length > 0) selectedTypes.push("box");
    if (selectedLineIds.length > 0) selectedTypes.push("line");

    const totalSelectionCount = selectedBoxIds.length + selectedLineIds.length;
    const hasSelection = totalSelectionCount > 0;
    const canGroup = selectedBoxIds.length >= 2;
    const canAlign = selectedBoxIds.length >= 2;
    const canDistribute = selectedBoxIds.length >= 3;

    let canUngroup = false;
    if (selectedBoxIds.length === 1) {
      const box = boxStore.boxes.find((b) => b.id === selectedBoxIds[0]);
      canUngroup = box ? (box.children?.length ?? 0) > 0 : false;
    }

    const activeItem = boxStore.activeBoxId
      ? {
          id: boxStore.activeBoxId,
          type: "box" as const,
          name: undefined,
        }
      : selectionStore.activeItemId && selectionStore.activeItemType
      ? {
          id: selectionStore.activeItemId,
          type: selectionStore.activeItemType as "box" | "line" | "artboard",
          name: undefined,
        }
      : null;

    return {
      hasSelection,
      selectionCount: totalSelectionCount,
      selectedTypes,
      activeItem,
      canGroup,
      canUngroup,
      canAlign,
      canDistribute,
    };
  }, [
    selectedIds,
    boxStore.boxes,
    boxStore.selectedBoxIds,
    boxStore.activeBoxId,
    selectionStore.activeItemId,
    selectionStore.activeItemType,
  ]);

  const getSelectedBoxIds = useCallback(() => {
    return selectionStore.getSelectedBoxIds();
  }, [selectionStore]);

  const [commandsVersion, setCommandsVersion] = useState(0);

  useEffect(() => {
    const layoutCommands = createLayoutPresetCommands((config, count) => {
      const targetId = useCommandStore.getState().layoutTargetId;
      const targetType = useCommandStore.getState().layoutTargetType;

      if (!targetId || !targetType) {
        console.warn("No target for layout");
        return;
      }

      let command: string;
      if (config.type === "flex") {
        command = `flex ${config.direction} ${count}`;
      } else if (config.type === "grid") {
        command = `grid ${config.columns}x${config.rows}`;
      } else {
        return;
      }

      executeLayoutCommand(command, targetId, targetType);
      close();
    });

    const toolCommands = createToolCommands(
      (tool) => canvasStore.setSelectedTool(tool),
      close
    );

    const viewCommands = createViewCommands(
      {
        toggleGrid: canvasStore.toggleGrid,
        toggleSnapToGrid: canvasStore.toggleSnapToGrid,
        toggleSmartGuides: canvasStore.toggleSmartGuides,
        zoomIn: canvasStore.zoomIn,
        zoomOut: canvasStore.zoomOut,
        resetZoom: canvasStore.resetZoom,
      },
      {
        toggle: outputStore.toggle,
      },
      {
        toggleThemeBuilder: themeStore.toggleThemeBuilder,
      },
      close
    );

    const editCommands = createEditCommands(
      {
        deleteSelectedBoxes: () => {
          const selectionIds = selectionStore.getSelectedBoxIds();
          const boxStoreIds = boxStore.selectedBoxIds;
          const allIds = [...new Set([...selectionIds, ...boxStoreIds])];
          if (allIds.length > 0) {
            boxStore.deleteBoxes(allIds);
            selectionStore.clearSelection();
          }
        },
        duplicateBoxes: (ids: string[]) => boxStore.duplicateBoxes(ids),
        copyBoxes: () => boxStore.copyBoxes(),
        pasteBoxes: () => boxStore.pasteBoxes(),
        selectAll: () => {
          selectionStore.selectAll();
          boxStore.selectAll();
        },
        deselectAll: () => {
          selectionStore.clearSelection();
          boxStore.clearSelection();
        },
      },
      {
        undo: () => historyStore.undo(),
        redo: () => historyStore.redo(),
        canUndo: () => historyStore.canUndo(),
        canRedo: () => historyStore.canRedo(),
      },
      getSelectedBoxIds,
      close
    );

    const alignmentCommands = createAlignmentCommands(
      (ids, alignment) => boxStore.alignBoxes(ids, alignment as AlignmentType),
      (ids, distribution) =>
        boxStore.distributeBoxes(ids, distribution as DistributionType),
      getSelectedBoxIds,
      close
    );

    const layerCommands = createLayerCommands(
      {
        groupBoxes: (ids: string[]) => boxStore.groupBoxes(ids),
        ungroupBox: (id: string) => boxStore.ungroupBox(id),
        bringToFront: (id: string) => {
          const maxZIndex = Math.max(...boxStore.boxes.map((b) => b.zIndex), 0);
          boxStore.updateBox(id, { zIndex: maxZIndex + 1 });
        },
        sendToBack: (id: string) => {
          const minZIndex = Math.min(...boxStore.boxes.map((b) => b.zIndex), 0);
          boxStore.updateBox(id, { zIndex: minZIndex - 1 });
        },
        bringForward: (id: string) => {
          const box = boxStore.boxes.find((b) => b.id === id);
          if (box) {
            boxStore.updateBox(id, { zIndex: box.zIndex + 1 });
          }
        },
        sendBackward: (id: string) => {
          const box = boxStore.boxes.find((b) => b.id === id);
          if (box) {
            boxStore.updateBox(id, { zIndex: box.zIndex - 1 });
          }
        },
      },
      getSelectedBoxIds,
      (id: string) => boxStore.boxes.find((b) => b.id === id),
      close
    );

    const actionCommands = createActionCommands(
      {
        toggleMode: () => {
          const currentMode = themeStore.mode;
          themeStore.setMode(currentMode === "dark" ? "light" : "dark");
        },
      },
      close
    );

    clearCommands();
    registerCommands([
      ...layoutCommands,
      ...toolCommands,
      ...viewCommands,
      ...editCommands,
      ...alignmentCommands,
      ...layerCommands,
      ...actionCommands,
    ]);

    setCommandsVersion((v) => v + 1);
  }, [
    close,
    executeLayoutCommand,
    canvasStore,
    boxStore,
    selectionStore,
    historyStore,
    outputStore,
    themeStore,
    getSelectedBoxIds,
  ]);

  const allCommands = useMemo(() => getAllCommands(), [commandsVersion]);

  const layoutDetection = useMemo(() => detectLayoutSyntax(query), [query]);
  const isLayoutMode = layoutDetection.isLayout;
  const layoutSuggestions = layoutDetection.suggestions;

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return fuzzySearch(query, allCommands, recentCommands);
  }, [query, allCommands, recentCommands]);

  const totalItems = useMemo(() => {
    if (!query.trim()) {
      return allCommands.length;
    }
    return searchResults.length;
  }, [query, allCommands, searchResults]);

  useEffect(() => {
    if (selectedIndex >= totalItems && totalItems > 0) {
      setSelectedIndex(totalItems - 1);
    }
  }, [totalItems, selectedIndex, setSelectedIndex]);

  const executeSelected = useCallback(() => {
    if (isLayoutMode && query.trim()) {
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
      }
      return;
    }

    if (searchResults.length > 0 && selectedIndex < searchResults.length) {
      const command = searchResults[selectedIndex].command;
      recordCommandExecution(command.id);
      command.handler();
    } else if (!query.trim() && selectedIndex < allCommands.length) {
      const command = allCommands[selectedIndex];
      recordCommandExecution(command.id);
      command.handler();
    }
  }, [
    isLayoutMode,
    query,
    selectedIndex,
    searchResults,
    allCommands,
    executeLayoutCommand,
    layoutTargetId,
    layoutTargetType,
    close,
    recordCommandExecution,
  ]);

  const executeCommand = useCallback(
    (id: string) => {
      const command = getCommand(id);
      if (command) {
        recordCommandExecution(id);
        command.handler();
      }
    },
    [recordCommandExecution]
  );

  const onQuickAction = useCallback(
    (action: string) => {
      const selectedBoxIds = getSelectedBoxIds();
      switch (action) {
        case "group":
          if (selectedBoxIds.length >= 2) {
            boxStore.groupBoxes(selectedBoxIds);
          }
          break;
        case "delete":
          if (selectedBoxIds.length > 0) {
            boxStore.deleteBoxes(selectedBoxIds);
          }
          break;
        case "align":
          break;
      }
      close();
    },
    [getSelectedBoxIds, boxStore, close]
  );

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
    getLayoutTarget,
    setLayoutTarget,
  ]);

  return {
    isOpen,
    query,
    selectedIndex,
    searchResults,
    allCommands,
    recentCommands,
    layoutSuggestions,
    isLayoutMode,
    selectionContext,
    open,
    close,
    toggle,
    setQuery,
    moveSelection,
    executeSelected,
    executeCommand,
    onQuickAction,
  };
}
