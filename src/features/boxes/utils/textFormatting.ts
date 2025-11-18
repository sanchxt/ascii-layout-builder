import type { TextFormat } from "@/types/box";

export type FormatType = "bold" | "italic" | "code" | "color";

export const parseMarkdown = (text: string): TextFormat[] => {
  const formats: TextFormat[] = [];

  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    formats.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "bold",
    });
  }

  const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
  while ((match = italicRegex.exec(text)) !== null) {
    formats.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "italic",
    });
  }

  const codeRegex = /`(.+?)`/g;
  while ((match = codeRegex.exec(text)) !== null) {
    formats.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "code",
    });
  }

  return mergeFormats(formats);
};

export const applyFormat = (
  formatting: TextFormat[],
  start: number,
  end: number,
  type: FormatType,
  value?: string
): TextFormat[] => {
  const cleaned = removeFormat(formatting, start, end, type);

  const newFormat: TextFormat = {
    start,
    end,
    type,
    ...(value && { value }),
  };

  return mergeFormats([...cleaned, newFormat]);
};

export const removeFormat = (
  formatting: TextFormat[],
  start: number,
  end: number,
  type?: FormatType
): TextFormat[] => {
  const result: TextFormat[] = [];

  for (const format of formatting) {
    if (type && format.type !== type) {
      result.push(format);
      continue;
    }

    if (format.end <= start || format.start >= end) {
      result.push(format);
      continue;
    }

    if (format.start >= start && format.end <= end) {
      continue;
    }

    if (format.start < start && format.end > end) {
      result.push({
        ...format,
        end: start,
      });
      result.push({
        ...format,
        start: end,
      });
    } else if (format.start < start) {
      result.push({
        ...format,
        end: start,
      });
    } else if (format.end > end) {
      result.push({
        ...format,
        start: end,
      });
    }
  }

  return result;
};

export const mergeFormats = (formatting: TextFormat[]): TextFormat[] => {
  if (formatting.length === 0) return [];

  const sorted = [...formatting].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.type.localeCompare(b.type);
  });

  const merged: TextFormat[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    if (
      current.type === next.type &&
      current.value === next.value &&
      current.end >= next.start
    ) {
      current = {
        ...current,
        end: Math.max(current.end, next.end),
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
};

export const isFormatActiveInRange = (
  formatting: TextFormat[],
  start: number,
  end: number,
  type: FormatType
): boolean => {
  const typeFormats = formatting.filter((f) => f.type === type);

  for (let pos = start; pos < end; pos++) {
    const hasFormat = typeFormats.some((f) => pos >= f.start && pos < f.end);
    if (!hasFormat) return false;
  }

  return true;
};

export const formatToHTML = (
  text: string,
  formatting: TextFormat[]
): string => {
  if (formatting.length === 0) return escapeHTML(text);

  const sorted = [...formatting].sort((a, b) => a.start - b.start);

  interface Segment {
    start: number;
    end: number;
    formats: TextFormat[];
  }

  const segments: Segment[] = [];
  let positions = [0];

  for (const format of sorted) {
    if (!positions.includes(format.start)) positions.push(format.start);
    if (!positions.includes(format.end)) positions.push(format.end);
  }
  if (!positions.includes(text.length)) positions.push(text.length);

  positions.sort((a, b) => a - b);

  for (let i = 0; i < positions.length - 1; i++) {
    const start = positions[i];
    const end = positions[i + 1];
    const formats = sorted.filter((f) => f.start <= start && f.end >= end);

    segments.push({ start, end, formats });
  }

  let html = "";
  for (const segment of segments) {
    const segmentText = text.slice(segment.start, segment.end);
    html += wrapWithFormats(segmentText, segment.formats);
  }

  return html;
};

const wrapWithFormats = (text: string, formats: TextFormat[]): string => {
  if (formats.length === 0) return escapeHTML(text);

  let result = escapeHTML(text);

  const sorted = [...formats].sort((a, b) => {
    const order = { bold: 0, italic: 1, code: 2, color: 3 };
    return order[a.type] - order[b.type];
  });

  for (const format of sorted.reverse()) {
    switch (format.type) {
      case "bold":
        result = `<strong>${result}</strong>`;
        break;
      case "italic":
        result = `<em>${result}</em>`;
        break;
      case "code":
        result = `<code class="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">${result}</code>`;
        break;
      case "color":
        result = `<span style="background-color: ${format.value}; padding: 2px 4px; border-radius: 2px;">${result}</span>`;
        break;
    }
  }

  return result;
};

const escapeHTML = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

export const adjustFormattingForEdit = (
  formatting: TextFormat[],
  position: number,
  deletedLength: number,
  insertedLength: number
): TextFormat[] => {
  const delta = insertedLength - deletedLength;

  return formatting
    .map((format) => {
      if (format.end <= position) {
        return format;
      }

      if (format.start >= position + deletedLength) {
        return {
          ...format,
          start: format.start + delta,
          end: format.end + delta,
        };
      }

      if (format.start < position && format.end > position) {
        return {
          ...format,
          end: Math.max(position + insertedLength, format.end + delta),
        };
      }

      if (format.start >= position && format.start < position + deletedLength) {
        const newStart = position + insertedLength;
        const newEnd = format.end + delta;

        if (newEnd <= newStart) {
          return null;
        }

        return {
          ...format,
          start: newStart,
          end: newEnd,
        };
      }

      return format;
    })
    .filter((f): f is TextFormat => f !== null);
};
