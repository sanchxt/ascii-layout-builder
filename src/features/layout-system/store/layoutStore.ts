import { create } from "zustand";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import type { Box } from "@/types/box";
import type { LayoutConfig } from "../types/layout";
import {
  calculateLayout,
  generateLayoutChildPositions,
  hasLayout,
} from "../lib/layoutEngine";
import { BOX_CONSTANTS } from "@/lib/constants";

let isLayoutUpdateInProgress = false;

let overflowClearTimeout: ReturnType<typeof setTimeout> | null = null;

interface LayoutUIState {
  overflowBoxIds: string[];
  setOverflowBoxIds: (ids: string[]) => void;
  clearOverflowBoxIds: () => void;
}

export const useLayoutUIStore = create<LayoutUIState>((set) => ({
  overflowBoxIds: [],
  setOverflowBoxIds: (ids) => set({ overflowBoxIds: ids }),
  clearOverflowBoxIds: () => set({ overflowBoxIds: [] }),
}));

function setOverflowWithAutoClear(ids: string[], delayMs: number = 8000): void {
  if (overflowClearTimeout) {
    clearTimeout(overflowClearTimeout);
  }

  useLayoutUIStore.getState().setOverflowBoxIds(ids);

  if (ids.length > 0) {
    overflowClearTimeout = setTimeout(() => {
      useLayoutUIStore.getState().clearOverflowBoxIds();
      overflowClearTimeout = null;
    }, delayMs);
  }
}

export function applyLayoutToContainer(
  containerId: string,
  config: LayoutConfig,
  childCount: number
): void {
  const boxStore = useBoxStore.getState();
  const artboardStore = useArtboardStore.getState();

  const artboard = artboardStore.getArtboard(containerId);
  const box = boxStore.getBox(containerId);

  if (!artboard && !box) {
    console.warn(`Container ${containerId} not found`);
    return;
  }

  const container: Box = artboard
    ? {
        id: artboard.id,
        x: 0,
        y: 0,
        width: artboard.width,
        height: artboard.height,
        borderStyle: "single",
        padding: 16,
        text: {
          value: "",
          alignment: "left",
          fontSize: "medium",
          formatting: [],
        },
        children: [],
        zIndex: 0,
      }
    : box!;

  const positions = generateLayoutChildPositions(container, config, childCount);

  const newBoxes: Box[] = positions.map((pos, index) => ({
    id: crypto.randomUUID(),
    x: pos.x,
    y: pos.y,
    width: pos.width,
    height: pos.height,
    borderStyle: "single" as const,
    padding: BOX_CONSTANTS.DEFAULT_PADDING,
    text: {
      value: "",
      alignment: "left" as const,
      fontSize: "medium" as const,
      formatting: [],
    },
    children: [],
    parentId: artboard ? undefined : containerId,
    artboardId: artboard ? containerId : box?.artboardId,
    zIndex: index + 1,
    layoutChildProps: {
      flexGrow: 1,
    },
  }));

  if (box) {
    boxStore.updateBox(containerId, {
      layout: config,
      children: newBoxes.map((b) => b.id),
    });
  }

  newBoxes.forEach((newBox) => {
    boxStore.addBox(newBox);
  });
}

export function removeLayoutFromContainer(containerId: string): void {
  const boxStore = useBoxStore.getState();
  const box = boxStore.getBox(containerId);

  if (!box) return;

  boxStore.updateBox(containerId, {
    layout: undefined,
  });
}

export function recalculateLayout(containerId: string): void {
  if (isLayoutUpdateInProgress) return;

  const boxStore = useBoxStore.getState();
  const box = boxStore.getBox(containerId);

  if (!box || !hasLayout(box)) return;

  isLayoutUpdateInProgress = true;

  try {
    const children = boxStore.boxes.filter((b) => b.parentId === containerId);

    if (children.length === 0) {
      setOverflowWithAutoClear([]);
      return;
    }

    const result = calculateLayout(box, children, box.layout!);

    result.positions.forEach((pos) => {
      boxStore.updateBox(pos.id, {
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
      });
    });

    if (result.overflowChildIds && result.overflowChildIds.length > 0) {
      setOverflowWithAutoClear(result.overflowChildIds);
    } else {
      setOverflowWithAutoClear([]);
    }
  } finally {
    isLayoutUpdateInProgress = false;
  }
}

export function updateLayoutConfig(
  containerId: string,
  updates: Partial<LayoutConfig>
): void {
  const boxStore = useBoxStore.getState();
  const box = boxStore.getBox(containerId);

  if (!box || !box.layout) return;

  const newConfig = { ...box.layout, ...updates } as LayoutConfig;

  const currentChildren = boxStore.boxes.filter(
    (b) => b.parentId === containerId
  );
  const currentChildCount = currentChildren.length;

  let targetCellCount = currentChildCount;
  if (newConfig.type === "grid") {
    targetCellCount = newConfig.columns * newConfig.rows;
  }

  boxStore.updateBox(containerId, {
    layout: newConfig,
  });

  if (newConfig.type === "grid" && targetCellCount > currentChildCount) {
    const updatedBox = boxStore.getBox(containerId);
    if (!updatedBox) return;

    const allPositions = generateLayoutChildPositions(
      updatedBox,
      newConfig,
      targetCellCount
    );

    const newPositions = allPositions.slice(currentChildCount);

    const newBoxes: Box[] = newPositions.map((pos, index) => ({
      id: crypto.randomUUID(),
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      borderStyle: "single" as const,
      padding: BOX_CONSTANTS.DEFAULT_PADDING,
      text: {
        value: "",
        alignment: "left" as const,
        fontSize: "medium" as const,
        formatting: [],
      },
      children: [],
      parentId: containerId,
      artboardId: updatedBox.artboardId,
      zIndex: currentChildCount + index + 1,
      layoutChildProps: {
        flexGrow: 1,
      },
    }));

    newBoxes.forEach((newBox) => {
      boxStore.addBox(newBox);
    });

    const allChildIds = [
      ...currentChildren.map((c) => c.id),
      ...newBoxes.map((b) => b.id),
    ];
    boxStore.updateBox(containerId, {
      children: allChildIds,
    });
  }

  recalculateLayout(containerId);
}

export function getLayoutInfo(containerId: string): {
  hasLayout: boolean;
  config: LayoutConfig | undefined;
  childCount: number;
} {
  const boxStore = useBoxStore.getState();
  const box = boxStore.getBox(containerId);

  if (!box) {
    return { hasLayout: false, config: undefined, childCount: 0 };
  }

  return {
    hasLayout: hasLayout(box),
    config: box.layout,
    childCount: box.children.length,
  };
}

export function isLayoutUpdating(): boolean {
  return isLayoutUpdateInProgress;
}

export function batchUpdateBoxes(
  updates: Array<{ id: string; changes: Partial<Box> }>
): void {
  if (isLayoutUpdateInProgress) return;

  isLayoutUpdateInProgress = true;
  const boxStore = useBoxStore.getState();

  try {
    updates.forEach(({ id, changes }) => {
      boxStore.updateBox(id, changes);
    });
  } finally {
    isLayoutUpdateInProgress = false;
  }
}

export function generateLayoutInArtboard(
  artboardId: string,
  config: LayoutConfig,
  childCount: number
): void {
  const artboardStore = useArtboardStore.getState();
  const boxStore = useBoxStore.getState();
  const artboard = artboardStore.getArtboard(artboardId);

  if (!artboard) {
    console.warn(`Artboard ${artboardId} not found`);
    return;
  }

  const containerForCalc: Box = {
    id: artboardId,
    x: 0,
    y: 0,
    width: artboard.width,
    height: artboard.height,
    borderStyle: "single",
    padding: 24,
    text: { value: "", alignment: "left", fontSize: "medium", formatting: [] },
    children: [],
    zIndex: 0,
  };

  const positions = generateLayoutChildPositions(
    containerForCalc,
    config,
    childCount
  );

  const newBoxes: Box[] = positions.map((pos, index) => ({
    id: crypto.randomUUID(),
    x: pos.x,
    y: pos.y,
    width: pos.width,
    height: pos.height,
    borderStyle: "single" as const,
    padding: BOX_CONSTANTS.DEFAULT_PADDING,
    text: {
      value: "",
      alignment: "left" as const,
      fontSize: "medium" as const,
      formatting: [],
    },
    children: [],
    artboardId: artboardId,
    zIndex: index + 1,
    layoutChildProps: {
      flexGrow: 1,
    },
  }));

  newBoxes.forEach((newBox) => {
    boxStore.addBox(newBox);
  });

  boxStore.selectBox(newBoxes[0].id);
  newBoxes.slice(1).forEach((b) => boxStore.selectBox(b.id, true));
}

export function generateLayoutInBox(
  boxId: string,
  config: LayoutConfig,
  childCount: number
): void {
  const boxStore = useBoxStore.getState();
  const parentBox = boxStore.getBox(boxId);

  if (!parentBox) {
    console.warn(`Box ${boxId} not found`);
    return;
  }

  const positions = generateLayoutChildPositions(parentBox, config, childCount);

  const newBoxes: Box[] = positions.map((pos, index) => ({
    id: crypto.randomUUID(),
    x: pos.x,
    y: pos.y,
    width: pos.width,
    height: pos.height,
    borderStyle: "single" as const,
    padding: BOX_CONSTANTS.DEFAULT_PADDING,
    text: {
      value: "",
      alignment: "left" as const,
      fontSize: "medium" as const,
      formatting: [],
    },
    children: [],
    parentId: boxId,
    artboardId: parentBox.artboardId,
    zIndex: index + 1,
    layoutChildProps: {
      flexGrow: 1,
    },
  }));

  boxStore.updateBox(boxId, {
    layout: config,
    children: newBoxes.map((b) => b.id),
  });

  newBoxes.forEach((newBox) => {
    boxStore.addBox(newBox);
  });

  boxStore.selectBox(newBoxes[0].id);
  newBoxes.slice(1).forEach((b) => boxStore.selectBox(b.id, true));
}
