import type {
  Line,
  ArrowHeadStyle,
  LineOutputMode,
  LineLabelPosition,
} from "@/types/line";
import { LINE_CONSTANTS } from "@/lib/constants";
import { getMaxZIndexAcrossAll } from "../store/lineStore";
import { getLineDirection, constrainToDirection } from "./lineGeometry";

export function createLine(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  artboardId?: string
): Line {
  const direction = getLineDirection(startX, startY, endX, endY);
  const constrained = constrainToDirection(
    startX,
    startY,
    endX,
    endY,
    direction
  );

  return {
    id: crypto.randomUUID(),
    startX,
    startY,
    endX: constrained.endX,
    endY: constrained.endY,
    direction,
    startArrow: LINE_CONSTANTS.DEFAULT_ARROW_STYLE as ArrowHeadStyle,
    endArrow: LINE_CONSTANTS.DEFAULT_ARROW_STYLE as ArrowHeadStyle,
    lineStyle: LINE_CONSTANTS.DEFAULT_LINE_STYLE,
    outputMode: LINE_CONSTANTS.DEFAULT_OUTPUT_MODE as LineOutputMode,
    artboardId,
    zIndex: getMaxZIndexAcrossAll() + 1,
    visible: true,
    locked: false,
  };
}

export function createLineWithOptions(options: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startArrow?: ArrowHeadStyle;
  endArrow?: ArrowHeadStyle;
  lineStyle?: "solid" | "dashed" | "dotted";
  outputMode?: LineOutputMode;
  label?: { text: string; position: LineLabelPosition };
  artboardId?: string;
}): Line {
  const direction = getLineDirection(
    options.startX,
    options.startY,
    options.endX,
    options.endY
  );
  const constrained = constrainToDirection(
    options.startX,
    options.startY,
    options.endX,
    options.endY,
    direction
  );

  return {
    id: crypto.randomUUID(),
    startX: options.startX,
    startY: options.startY,
    endX: constrained.endX,
    endY: constrained.endY,
    direction,
    startArrow:
      options.startArrow ??
      (LINE_CONSTANTS.DEFAULT_ARROW_STYLE as ArrowHeadStyle),
    endArrow:
      options.endArrow ??
      (LINE_CONSTANTS.DEFAULT_ARROW_STYLE as ArrowHeadStyle),
    lineStyle: options.lineStyle ?? LINE_CONSTANTS.DEFAULT_LINE_STYLE,
    outputMode:
      options.outputMode ??
      (LINE_CONSTANTS.DEFAULT_OUTPUT_MODE as LineOutputMode),
    label: options.label,
    artboardId: options.artboardId,
    zIndex: getMaxZIndexAcrossAll() + 1,
    visible: true,
    locked: false,
  };
}

export function getLineName(line: Line): string {
  if (line.name) return line.name;

  const directionLabel = line.direction === "horizontal" ? "H" : "V";
  const arrowLabel = getArrowLabel(line.startArrow, line.endArrow);

  return `${directionLabel}-Line${arrowLabel ? ` ${arrowLabel}` : ""}`;
}

function getArrowLabel(
  startArrow: ArrowHeadStyle,
  endArrow: ArrowHeadStyle
): string {
  if (startArrow === "none" && endArrow === "none") return "";
  if (startArrow !== "none" && endArrow !== "none") return "<->";
  if (endArrow !== "none") return "->";
  if (startArrow !== "none") return "<-";
  return "";
}

export function getLineDashArray(lineStyle: Line["lineStyle"]): string {
  switch (lineStyle) {
    case "dashed":
      return "8 4";
    case "dotted":
      return "2 4";
    case "solid":
    default:
      return "none";
  }
}

export function formatLabelPosition(position: LineLabelPosition): string {
  switch (position) {
    case "start":
      return "Start";
    case "middle":
      return "Middle";
    case "end":
      return "End";
  }
}

export function formatOutputMode(mode: LineOutputMode): string {
  switch (mode) {
    case "ascii":
      return "ASCII Only";
    case "svg":
      return "SVG Element";
    case "comment":
      return "HTML Comment";
  }
}

export function formatArrowStyle(style: ArrowHeadStyle): string {
  switch (style) {
    case "none":
      return "None";
    case "simple":
      return "Simple";
    case "filled":
      return "Filled";
  }
}

export function getArrowPreviewChar(
  style: ArrowHeadStyle,
  direction: "right" | "left" | "up" | "down"
): string {
  if (style === "none") return "";

  const arrowChars = {
    simple: { right: "→", left: "←", up: "↑", down: "↓" },
    filled: { right: "▶", left: "◀", up: "▲", down: "▼" },
  };

  return arrowChars[style]?.[direction] ?? "";
}

export function lineHasArrows(line: Line): boolean {
  return line.startArrow !== "none" || line.endArrow !== "none";
}

export function lineHasLabel(line: Line): boolean {
  return !!line.label?.text;
}

export function getLineArrowChars(line: Line): {
  start: string;
  end: string;
} {
  const getDirection = (isStart: boolean): "right" | "left" | "up" | "down" => {
    if (line.direction === "horizontal") {
      if (isStart) {
        return line.startX < line.endX ? "left" : "right";
      } else {
        return line.startX < line.endX ? "right" : "left";
      }
    } else {
      if (isStart) {
        return line.startY < line.endY ? "up" : "down";
      } else {
        return line.startY < line.endY ? "down" : "up";
      }
    }
  };

  return {
    start: getArrowPreviewChar(line.startArrow, getDirection(true)),
    end: getArrowPreviewChar(line.endArrow, getDirection(false)),
  };
}
