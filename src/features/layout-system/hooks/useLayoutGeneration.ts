import { useCallback } from "react";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import type { LayoutConfig } from "../types/layout";
import {
  parseLayoutCommand,
  parsedCommandToConfig,
  getChildCount,
} from "../lib/layoutParser";
import {
  generateLayoutInArtboard,
  generateLayoutInBox,
} from "../store/layoutStore";

interface UseLayoutGenerationReturn {
  executeLayoutCommand: (
    command: string,
    explicitTargetId?: string | null,
    explicitTargetType?: "box" | "artboard" | null
  ) => {
    success: boolean;
    error?: string;
  };

  applyLayoutPreset: (
    containerId: string,
    config: LayoutConfig,
    childCount: number
  ) => void;

  generateInActiveArtboard: (config: LayoutConfig, childCount: number) => void;

  generateInSelectedBox: (config: LayoutConfig, childCount: number) => void;

  canGenerateLayout: () => boolean;

  getLayoutTarget: () => {
    type: "artboard" | "box" | "none";
    id: string | null;
  };
}

export function useLayoutGeneration(): UseLayoutGenerationReturn {
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const getBox = useBoxStore((state) => state.getBox);
  const activeArtboardId = useArtboardStore((state) => state.activeArtboardId);

  const getLayoutTarget = useCallback(() => {
    if (selectedBoxIds.length === 1) {
      return { type: "box" as const, id: selectedBoxIds[0] };
    }

    if (activeArtboardId) {
      return { type: "artboard" as const, id: activeArtboardId };
    }

    return { type: "none" as const, id: null };
  }, [selectedBoxIds, activeArtboardId]);

  const canGenerateLayout = useCallback(() => {
    const target = getLayoutTarget();
    return target.type !== "none";
  }, [getLayoutTarget]);

  const executeLayoutCommand = useCallback(
    (
      command: string,
      explicitTargetId?: string | null,
      explicitTargetType?: "box" | "artboard" | null
    ): { success: boolean; error?: string } => {
      const parsed = parseLayoutCommand(command);

      if (!parsed.valid) {
        return {
          success: false,
          error: parsed.error || "Invalid command format",
        };
      }

      const config = parsedCommandToConfig(parsed);
      if (!config) {
        return { success: false, error: "Failed to create layout config" };
      }

      const childCount = getChildCount(parsed);
      if (childCount === 0) {
        return { success: false, error: "No children to create" };
      }

      let targetId: string | null;
      let targetType: "box" | "artboard" | "none";

      if (explicitTargetId && explicitTargetType) {
        targetId = explicitTargetId;
        targetType = explicitTargetType;
      } else {
        const target = getLayoutTarget();
        targetId = target.id;
        targetType = target.type;
      }

      if (targetType === "none" || !targetId) {
        return {
          success: false,
          error: "No container selected. Select a box or artboard first.",
        };
      }

      try {
        if (targetType === "artboard") {
          generateLayoutInArtboard(targetId, config, childCount);
        } else {
          generateLayoutInBox(targetId, config, childCount);
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Layout generation failed",
        };
      }
    },
    [getLayoutTarget]
  );

  const applyLayoutPreset = useCallback(
    (containerId: string, config: LayoutConfig, childCount: number) => {
      const box = getBox(containerId);

      if (box) {
        generateLayoutInBox(containerId, config, childCount);
      } else {
        generateLayoutInArtboard(containerId, config, childCount);
      }
    },
    [getBox]
  );

  const generateInActiveArtboard = useCallback(
    (config: LayoutConfig, childCount: number) => {
      if (!activeArtboardId) {
        console.warn("No active artboard");
        return;
      }
      generateLayoutInArtboard(activeArtboardId, config, childCount);
    },
    [activeArtboardId]
  );

  const generateInSelectedBox = useCallback(
    (config: LayoutConfig, childCount: number) => {
      if (selectedBoxIds.length !== 1) {
        console.warn("Select exactly one box");
        return;
      }
      generateLayoutInBox(selectedBoxIds[0], config, childCount);
    },
    [selectedBoxIds]
  );

  return {
    executeLayoutCommand,
    applyLayoutPreset,
    generateInActiveArtboard,
    generateInSelectedBox,
    canGenerateLayout,
    getLayoutTarget,
  };
}
