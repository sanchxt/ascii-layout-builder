import type { Line, ArrowHeadStyle, LineDirection } from "@/types/line";
import type { Box } from "@/types/box";
import type { Artboard } from "@/types/artboard";
import type { CodeGeneratorOptions } from "../types/code";
import { DEFAULT_CODE_OPTIONS } from "../types/code";
import { getLineAbsolutePosition } from "@/features/lines/utils/lineHierarchy";

export function generateLineCode(
  lines: Line[],
  artboard?: Artboard,
  options: CodeGeneratorOptions = DEFAULT_CODE_OPTIONS,
  boxes: Box[] = []
): string {
  const opts = { ...DEFAULT_CODE_OPTIONS, ...options };

  const relevantLines = artboard
    ? lines.filter((line) => line.artboardId === artboard.id)
    : lines.filter((line) => !line.artboardId);

  const linesToRender = relevantLines.filter(
    (line) =>
      line.visible !== false &&
      (line.outputMode === "svg" || line.outputMode === "comment")
  );

  if (linesToRender.length === 0) {
    return "";
  }

  const output: string[] = [];

  const sortedLines = [...linesToRender].sort((a, b) => a.zIndex - b.zIndex);

  sortedLines.forEach((line) => {
    if (line.outputMode === "svg") {
      output.push(generateSvgLine(line, artboard, opts, boxes));
    } else if (line.outputMode === "comment") {
      output.push(generateCommentLine(line, opts, boxes));
    }
  });

  return output.join("\n");
}

function generateSvgLine(
  line: Line,
  artboard?: Artboard,
  options: CodeGeneratorOptions = DEFAULT_CODE_OPTIONS,
  boxes: Box[] = []
): string {
  const { indent, includeComments } = options;
  const indentStr = indent || "  ";

  // Get absolute position (handles nested lines with parentId)
  const absPos = line.parentId
    ? getLineAbsolutePosition(line, boxes)
    : { startX: line.startX, startY: line.startY, endX: line.endX, endY: line.endY };

  // Adjust for artboard offset
  const startX = artboard ? absPos.startX - artboard.x : absPos.startX;
  const startY = artboard ? absPos.startY - artboard.y : absPos.startY;
  const endX = artboard ? absPos.endX - artboard.x : absPos.endX;
  const endY = artboard ? absPos.endY - artboard.y : absPos.endY;

  const width = Math.abs(endX - startX) || 2;
  const height = Math.abs(endY - startY) || 2;
  const svgWidth = Math.max(width + 20, 40);
  const svgHeight = Math.max(height + 20, 40);

  const strokeDasharray = getStrokeDasharray(line.lineStyle);

  const padding = 10;
  const x1 = line.direction === "horizontal" ? padding : svgWidth / 2;
  const y1 = line.direction === "vertical" ? padding : svgHeight / 2;
  const x2 =
    line.direction === "horizontal" ? svgWidth - padding : svgWidth / 2;
  const y2 =
    line.direction === "vertical" ? svgHeight - padding : svgHeight / 2;

  const lines: string[] = [];

  if (includeComments && line.name) {
    lines.push(`<!-- Line: ${line.name} -->`);
  }

  lines.push(`<svg`);
  lines.push(`${indentStr}class="absolute"`);
  lines.push(
    `${indentStr}style="left: ${Math.min(startX, endX) - padding}px; top: ${
      Math.min(startY, endY) - padding
    }px;"`
  );
  lines.push(`${indentStr}width="${svgWidth}"`);
  lines.push(`${indentStr}height="${svgHeight}"`);
  lines.push(`${indentStr}viewBox="0 0 ${svgWidth} ${svgHeight}"`);
  lines.push(`>`);

  if (line.startArrow !== "none" || line.endArrow !== "none") {
    lines.push(`${indentStr}<defs>`);

    if (line.startArrow !== "none") {
      lines.push(
        generateArrowMarker(
          `arrow-start-${line.id}`,
          line.startArrow,
          "start",
          indentStr + "  "
        )
      );
    }

    if (line.endArrow !== "none") {
      lines.push(
        generateArrowMarker(
          `arrow-end-${line.id}`,
          line.endArrow,
          "end",
          indentStr + "  "
        )
      );
    }

    lines.push(`${indentStr}</defs>`);
  }

  const lineAttrs: string[] = [
    `x1="${x1}"`,
    `y1="${y1}"`,
    `x2="${x2}"`,
    `y2="${y2}"`,
    `stroke="black"`,
    `stroke-width="2"`,
  ];

  if (strokeDasharray) {
    lineAttrs.push(`stroke-dasharray="${strokeDasharray}"`);
  }

  if (line.startArrow !== "none") {
    lineAttrs.push(`marker-start="url(#arrow-start-${line.id})"`);
  }

  if (line.endArrow !== "none") {
    lineAttrs.push(`marker-end="url(#arrow-end-${line.id})"`);
  }

  lines.push(`${indentStr}<line ${lineAttrs.join(" ")} />`);

  if (line.label?.text) {
    const labelX = (x1 + x2) / 2;
    const labelY = line.direction === "horizontal" ? y1 - 5 : (y1 + y2) / 2;
    const textAnchor = "middle";

    lines.push(
      `${indentStr}<text x="${labelX}" y="${labelY}" text-anchor="${textAnchor}" class="text-xs">${escapeHTML(
        line.label.text
      )}</text>`
    );
  }

  lines.push(`</svg>`);

  return lines.join("\n");
}

function generateCommentLine(
  line: Line,
  options: CodeGeneratorOptions = DEFAULT_CODE_OPTIONS,
  boxes: Box[] = []
): string {
  const { includeComments } = options;

  // Get absolute position (handles nested lines with parentId)
  const absPos = line.parentId
    ? getLineAbsolutePosition(line, boxes)
    : { startX: line.startX, startY: line.startY, endX: line.endX, endY: line.endY };

  const directionChar = line.direction === "horizontal" ? "→" : "↓";
  const startArrowChar = getArrowCharForComment(
    line.startArrow,
    line.direction,
    "start"
  );
  const endArrowChar = getArrowCharForComment(
    line.endArrow,
    line.direction,
    "end"
  );

  const labelPart = line.label?.text ? ` "${line.label.text}"` : "";
  const namePart = line.name ? `${line.name}: ` : "";

  const lineVisual = `${startArrowChar}${"─".repeat(5)}${endArrowChar}`;

  if (includeComments) {
    return `<!-- ${namePart}${lineVisual}${labelPart} (${absPos.startX},${absPos.startY} ${directionChar} ${absPos.endX},${absPos.endY}) -->`;
  }

  return `<!-- Line${labelPart}: ${absPos.startX},${absPos.startY} ${directionChar} ${absPos.endX},${absPos.endY} -->`;
}

function generateArrowMarker(
  id: string,
  style: ArrowHeadStyle,
  position: "start" | "end",
  indent: string
): string {
  const isStart = position === "start";
  const orient = isStart ? "auto-start-reverse" : "auto";

  if (style === "simple") {
    return `${indent}<marker id="${id}" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="${orient}">
${indent}  <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="black" stroke-width="1.5" />
${indent}</marker>`;
  } else if (style === "filled") {
    return `${indent}<marker id="${id}" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="${orient}">
${indent}  <polygon points="0,0 10,5 0,10" fill="black" />
${indent}</marker>`;
  }

  return "";
}

function getStrokeDasharray(style: "solid" | "dashed" | "dotted"): string {
  switch (style) {
    case "dashed":
      return "8,4";
    case "dotted":
      return "2,4";
    default:
      return "";
  }
}

function getArrowCharForComment(
  style: ArrowHeadStyle,
  direction: LineDirection,
  position: "start" | "end"
): string {
  if (style === "none") {
    return direction === "horizontal" ? "─" : "│";
  }

  if (direction === "horizontal") {
    if (style === "simple") {
      return position === "start" ? "←" : "→";
    } else {
      return position === "start" ? "◀" : "▶";
    }
  } else {
    if (style === "simple") {
      return position === "start" ? "↑" : "↓";
    } else {
      return position === "start" ? "▲" : "▼";
    }
  }
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateLineTailwind(
  line: Line,
  artboard?: Artboard,
  options: CodeGeneratorOptions = DEFAULT_CODE_OPTIONS,
  boxes: Box[] = []
): string {
  if (line.outputMode === "comment") {
    return generateCommentLine(line, options, boxes);
  }

  if (line.outputMode === "svg") {
    return generateSvgLine(line, artboard, options, boxes);
  }

  return "";
}

export function generateAllLinesTailwind(
  lines: Line[],
  artboard?: Artboard,
  options: CodeGeneratorOptions = DEFAULT_CODE_OPTIONS,
  boxes: Box[] = []
): string {
  return generateLineCode(lines, artboard, options, boxes);
}
