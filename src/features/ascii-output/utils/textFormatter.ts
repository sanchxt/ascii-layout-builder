import type { TextContent, TextFormat } from "@/types/box";

export function applyMarkdownFormatting(
  text: string,
  formatting: TextFormat[]
): string {
  if (!formatting || formatting.length === 0) {
    return text;
  }

  const sortedFormats = [...formatting].sort((a, b) => b.start - a.start);

  let result = text;

  for (const format of sortedFormats) {
    const { start, end, type, value } = format;

    if (start < 0 || end > result.length || start >= end) {
      continue;
    }

    const beforeText = result.substring(0, start);
    const formattedText = result.substring(start, end);
    const afterText = result.substring(end);

    let wrappedText: string;

    switch (type) {
      case "bold":
        wrappedText = `**${formattedText}**`;
        break;
      case "italic":
        wrappedText = `*${formattedText}*`;
        break;
      case "code":
        wrappedText = `\`${formattedText}\``;
        break;
      case "color":
        if (value) {
          wrappedText = `<span style="color: ${value}">${formattedText}</span>`;
        } else {
          wrappedText = formattedText;
        }
        break;
      default:
        wrappedText = formattedText;
    }

    result = beforeText + wrappedText + afterText;
  }

  return result;
}

export function wrapText(text: string, maxWidth: number): string[] {
  if (maxWidth <= 0) {
    return [];
  }

  if (!text || text.trim() === "") {
    return [""];
  }

  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }

        if (word.length > maxWidth) {
          let remaining = word;
          while (remaining.length > maxWidth) {
            lines.push(remaining.substring(0, maxWidth));
            remaining = remaining.substring(maxWidth);
          }
          currentLine = remaining;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

export function alignLine(
  line: string,
  alignment: "left" | "center" | "right",
  width: number
): string {
  const trimmedLine = line.trim();
  const padding = width - trimmedLine.length;

  if (padding <= 0) {
    return trimmedLine.substring(0, width);
  }

  switch (alignment) {
    case "left":
      return trimmedLine + " ".repeat(padding);
    case "center": {
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return " ".repeat(leftPad) + trimmedLine + " ".repeat(rightPad);
    }
    case "right":
      return " ".repeat(padding) + trimmedLine;
    default:
      return trimmedLine;
  }
}

export function alignText(
  lines: string[],
  alignment: "left" | "center" | "right",
  width: number
): string[] {
  return lines.map((line) => alignLine(line, alignment, width));
}

export function formatTextContent(
  textContent: TextContent,
  maxWidth: number
): string[] {
  const formattedText = applyMarkdownFormatting(
    textContent.value,
    textContent.formatting
  );

  const wrappedLines = wrapText(formattedText, maxWidth);

  const alignedLines = alignText(wrappedLines, textContent.alignment, maxWidth);

  return alignedLines;
}

export function truncateLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) {
    return lines;
  }

  const truncated = lines.slice(0, maxLines - 1);
  const lastLine = lines[maxLines - 1];

  if (lastLine.length > 3) {
    truncated.push(lastLine.substring(0, lastLine.length - 3) + "...");
  } else {
    truncated.push("...");
  }

  return truncated;
}
