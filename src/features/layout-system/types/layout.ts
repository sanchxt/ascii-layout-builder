export type LayoutType = "none" | "flex" | "grid";
export type FlexDirection = "row" | "column";
export type FlexAlign = "start" | "center" | "end" | "stretch";
export type FlexJustify =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";

export type ChildSizingMode = "auto" | "fill";

export interface LayoutPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function normalizeLayoutPadding(
  padding: number | Partial<LayoutPadding> | undefined
): LayoutPadding {
  if (padding === undefined) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
}

export function isUniformPadding(padding: LayoutPadding | undefined): boolean {
  if (!padding) return true;
  return (
    padding.top === padding.right &&
    padding.right === padding.bottom &&
    padding.bottom === padding.left
  );
}

export interface FlexLayout {
  type: "flex";
  direction: FlexDirection;
  gap: number;
  alignItems: FlexAlign;
  justifyContent: FlexJustify;
  wrap: boolean;
  alignContent?: FlexJustify;
  childSizingMode?: ChildSizingMode;
  layoutPadding?: LayoutPadding;
}

export interface GridLayout {
  type: "grid";
  columns: number;
  rows: number;
  gap: number;
  columnGap?: number;
  rowGap?: number;
  alignItems?: FlexAlign;
  justifyItems?: FlexAlign;
  childSizingMode?: ChildSizingMode;
  layoutPadding?: LayoutPadding;
}

export interface NoLayout {
  type: "none";
}

export type LayoutConfig = FlexLayout | GridLayout | NoLayout;

export interface BoxLayoutChildProps {
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  gridColumn?: string;
  gridRow?: string;
  alignSelf?: FlexAlign;
}

export interface BoxLayoutProps {
  layout?: LayoutConfig;
  layoutChildProps?: BoxLayoutChildProps;
}

export interface LayoutChildPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutCalculationResult {
  positions: LayoutChildPosition[];
  overflow: boolean;
  overflowChildIds?: string[];
  errors?: string[];
}

export interface ContainerSpace {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_FLEX_LAYOUT: FlexLayout = {
  type: "flex",
  direction: "row",
  gap: 16,
  alignItems: "start",
  justifyContent: "start",
  wrap: false,
  childSizingMode: "auto",
};

export const DEFAULT_GRID_LAYOUT: GridLayout = {
  type: "grid",
  columns: 2,
  rows: 2,
  gap: 16,
  alignItems: "start",
  justifyItems: "start",
  childSizingMode: "auto",
};

export const NO_LAYOUT: NoLayout = {
  type: "none",
};

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  config: LayoutConfig;
  childCount: number;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "flex-row-2",
    name: "2 Columns",
    description: "Flex row with 2 equal columns",
    config: { ...DEFAULT_FLEX_LAYOUT, direction: "row" },
    childCount: 2,
  },
  {
    id: "flex-row-3",
    name: "3 Columns",
    description: "Flex row with 3 equal columns",
    config: { ...DEFAULT_FLEX_LAYOUT, direction: "row" },
    childCount: 3,
  },
  {
    id: "flex-row-4",
    name: "4 Columns",
    description: "Flex row with 4 equal columns",
    config: { ...DEFAULT_FLEX_LAYOUT, direction: "row" },
    childCount: 4,
  },
  {
    id: "flex-col-2",
    name: "2 Rows",
    description: "Flex column with 2 equal rows",
    config: { ...DEFAULT_FLEX_LAYOUT, direction: "column" },
    childCount: 2,
  },
  {
    id: "flex-col-3",
    name: "3 Rows",
    description: "Flex column with 3 equal rows",
    config: { ...DEFAULT_FLEX_LAYOUT, direction: "column" },
    childCount: 3,
  },
  {
    id: "grid-2x2",
    name: "2x2 Grid",
    description: "Grid with 2 columns and 2 rows",
    config: { ...DEFAULT_GRID_LAYOUT, columns: 2, rows: 2 },
    childCount: 4,
  },
  {
    id: "grid-3x3",
    name: "3x3 Grid",
    description: "Grid with 3 columns and 3 rows",
    config: { ...DEFAULT_GRID_LAYOUT, columns: 3, rows: 3 },
    childCount: 9,
  },
  {
    id: "grid-2x4",
    name: "2x4 Grid",
    description: "Grid with 2 columns and 4 rows",
    config: { ...DEFAULT_GRID_LAYOUT, columns: 2, rows: 4 },
    childCount: 8,
  },
  {
    id: "grid-4x2",
    name: "4x2 Grid",
    description: "Grid with 4 columns and 2 rows",
    config: { ...DEFAULT_GRID_LAYOUT, columns: 4, rows: 2 },
    childCount: 8,
  },
];
