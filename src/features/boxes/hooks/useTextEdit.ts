import { useCallback, useEffect, useRef, useState } from "react";
import type { TextFormat } from "@/types/box";
import {
  applyFormat,
  removeFormat,
  isFormatActiveInRange,
  type FormatType,
} from "../utils/textFormatting";

interface SelectionRange {
  start: number;
  end: number;
}

interface UseTextEditOptions {
  formatting: TextFormat[];
  onFormattingChange: (formatting: TextFormat[]) => void;
  contentEditableRef: React.RefObject<HTMLDivElement | null>;
}

export const useTextEdit = ({
  formatting,
  onFormattingChange,
  contentEditableRef,
}: UseTextEditOptions) => {
  const [selection, setSelection] = useState<SelectionRange>({
    start: 0,
    end: 0,
  });
  const [hasSelection, setHasSelection] = useState(false);

  const savedSelectionRef = useRef<SelectionRange>({ start: 0, end: 0 });

  const updateSelection = useCallback(() => {
    const browserSelection = window.getSelection();
    if (!browserSelection || !contentEditableRef.current) {
      setHasSelection(false);
      return;
    }

    const container = contentEditableRef.current;
    if (
      !browserSelection.anchorNode ||
      !container.contains(browserSelection.anchorNode)
    ) {
      setHasSelection(false);
      return;
    }

    const range = browserSelection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    const end = start + range.toString().length;

    const newSelection = { start, end };
    setSelection(newSelection);
    const hasActiveSelection = start !== end;
    setHasSelection(hasActiveSelection);

    if (hasActiveSelection) {
      savedSelectionRef.current = newSelection;
    }
  }, [contentEditableRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateSelection);
    return () => {
      document.removeEventListener("selectionchange", updateSelection);
    };
  }, [updateSelection]);

  const isFormatActive = useCallback(
    (type: FormatType): boolean => {
      if (!hasSelection) return false;
      return isFormatActiveInRange(
        formatting,
        selection.start,
        selection.end,
        type
      );
    },
    [formatting, selection, hasSelection]
  );

  const toggleFormat = useCallback(
    (type: FormatType, value?: string) => {
      const { start, end } = savedSelectionRef.current;

      if (start === end) return;

      const isActive = isFormatActiveInRange(formatting, start, end, type);

      let newFormatting: TextFormat[];
      if (isActive) {
        newFormatting = removeFormat(formatting, start, end, type);
      } else {
        newFormatting = applyFormat(formatting, start, end, type, value);
      }

      onFormattingChange(newFormatting);
    },
    [formatting, onFormattingChange]
  );

  const handleKeyboardShortcut = useCallback(
    (e: KeyboardEvent): boolean => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (!modKey) return false;

      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          toggleFormat("bold");
          return true;

        case "i":
          e.preventDefault();
          toggleFormat("italic");
          return true;

        case "`":
          e.preventDefault();
          toggleFormat("code");
          return true;

        default:
          return false;
      }
    },
    [toggleFormat]
  );

  const applyColor = useCallback(
    (color: string) => {
      const { start, end } = savedSelectionRef.current;

      if (start === end) return;

      const newFormatting = applyFormat(formatting, start, end, "color", color);
      onFormattingChange(newFormatting);
    },
    [formatting, onFormattingChange]
  );

  const removeColor = useCallback(() => {
    const { start, end } = savedSelectionRef.current;

    if (start === end) return;

    const newFormatting = removeFormat(formatting, start, end, "color");
    onFormattingChange(newFormatting);
  }, [formatting, onFormattingChange]);

  const getActiveFormats = useCallback((): FormatType[] => {
    if (!hasSelection) return [];

    const types: FormatType[] = ["bold", "italic", "code", "color"];
    return types.filter((type) =>
      isFormatActiveInRange(formatting, selection.start, selection.end, type)
    );
  }, [formatting, selection, hasSelection]);

  return {
    selection,
    hasSelection,
    isFormatActive,
    toggleFormat,
    handleKeyboardShortcut,
    applyColor,
    removeColor,
    getActiveFormats,
    updateSelection,
  };
};
