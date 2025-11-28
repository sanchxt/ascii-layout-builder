export interface CodeOutput {
  html: string;
  css: string;
  tailwind: string;
}

export interface BoxCodeInfo {
  id: string;
  name: string;
  selector: string;
  className: string;
  styles: CSSProperties;
  tailwindClasses: string[];
  content: string;
  children: BoxCodeInfo[];
}

export interface CSSProperties {
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  flexWrap?: string;
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  justifyItems?: string;

  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;

  padding?: string;
  margin?: string;

  position?: string;
  top?: string;
  left?: string;

  border?: string;
  borderStyle?: string;
  borderWidth?: string;
  borderColor?: string;

  flex?: string;
  flexGrow?: string;
  flexShrink?: string;
  alignSelf?: string;

  gridColumn?: string;
  gridRow?: string;

  textAlign?: string;
  fontSize?: string;
}

export interface CodeGeneratorOptions {
  includeComments?: boolean;

  useSemantic?: boolean;

  classPrefix?: string;

  useRem?: boolean;

  remBase?: number;

  indent?: string;

  minify?: boolean;
}

export const DEFAULT_CODE_OPTIONS: CodeGeneratorOptions = {
  includeComments: false,
  useSemantic: false,
  classPrefix: "box",
  useRem: false,
  remBase: 16,
  indent: "  ",
  minify: false,
};

export const TAILWIND_MAPPINGS: Record<string, Record<string, string>> = {
  display: {
    flex: "flex",
    grid: "grid",
    block: "block",
  },
  flexDirection: {
    row: "flex-row",
    column: "flex-col",
    "row-reverse": "flex-row-reverse",
    "column-reverse": "flex-col-reverse",
  },
  justifyContent: {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    "space-between": "justify-between",
    "space-around": "justify-around",
    "space-evenly": "justify-evenly",
  },
  alignItems: {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  },
  alignContent: {
    start: "content-start",
    center: "content-center",
    end: "content-end",
    "space-between": "content-between",
    "space-around": "content-around",
    "space-evenly": "content-evenly",
  },
  alignSelf: {
    start: "self-start",
    center: "self-center",
    end: "self-end",
    stretch: "self-stretch",
  },
  justifyItems: {
    start: "justify-items-start",
    center: "justify-items-center",
    end: "justify-items-end",
    stretch: "justify-items-stretch",
  },
  flexWrap: {
    wrap: "flex-wrap",
    nowrap: "flex-nowrap",
    "wrap-reverse": "flex-wrap-reverse",
  },
  textAlign: {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  },
};

export const TAILWIND_SPACING: Record<number, string> = {
  0: "0",
  4: "1",
  8: "2",
  12: "3",
  16: "4",
  20: "5",
  24: "6",
  28: "7",
  32: "8",
  36: "9",
  40: "10",
  44: "11",
  48: "12",
  56: "14",
  64: "16",
  80: "20",
  96: "24",
};

export function getClosestTailwindSpacing(px: number): string {
  const values = Object.keys(TAILWIND_SPACING).map(Number);
  const closest = values.reduce((prev, curr) =>
    Math.abs(curr - px) < Math.abs(prev - px) ? curr : prev
  );
  return TAILWIND_SPACING[closest];
}
