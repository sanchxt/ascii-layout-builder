import { useEffect, useRef, useState } from "react";
import type { Box as BoxType } from "@/types/box";
import { TEXT_CONSTANTS } from "@/lib/constants";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import { useTextEdit } from "../hooks/useTextEdit";
import { TextFormattingToolbar } from "./TextFormattingToolbar";

interface TextEditorProps {
  box: BoxType;
  onUpdate: (id: string, updates: Partial<BoxType>) => void;
}

export const TextEditor = ({ box, onUpdate }: TextEditorProps) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const exitEditMode = useCanvasStore((state) => state.exitEditMode);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  const {
    hasSelection,
    isFormatActive,
    toggleFormat,
    handleKeyboardShortcut,
    applyColor,
    removeColor,
    updateSelection,
  } = useTextEdit({
    formatting: box.text.formatting,
    onFormattingChange: (formatting) => {
      onUpdate(box.id, {
        text: {
          ...box.text,
          formatting,
        },
      });
    },
    contentEditableRef,
  });

  useEffect(() => {
    if (contentEditableRef.current) {
      contentEditableRef.current.textContent = box.text.value;

      contentEditableRef.current.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(contentEditableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  useEffect(() => {
    if (contentEditableRef.current) {
      if (hasSelection) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          setToolbarPosition({
            top: rect.top - 40,
            left: rect.left + rect.width / 2,
          });
        }
      } else {
        const editorRect = contentEditableRef.current.getBoundingClientRect();
        setToolbarPosition({
          top: editorRect.top - 40,
          left: editorRect.left + editorRect.width / 2,
        });
      }
    }
  }, [hasSelection, updateSelection]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText || e.currentTarget.textContent || "";

    if (text.length > TEXT_CONSTANTS.MAX_LENGTH) {
      e.currentTarget.textContent = text.slice(0, TEXT_CONSTANTS.MAX_LENGTH);
      return;
    }

    onUpdate(box.id, {
      text: {
        ...box.text,
        value: text,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      exitEditMode();
      return;
    }

    if (handleKeyboardShortcut(e.nativeEvent)) {
      return;
    }

    e.stopPropagation();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div
        ref={contentEditableRef}
        contentEditable
        suppressContentEditableWarning
        className="absolute inset-0 outline-none text-sm text-gray-700 whitespace-pre-wrap wrap-break-word overflow-hidden"
        style={{
          textAlign: box.text.alignment,
          fontSize:
            box.text.fontSize === "small"
              ? "0.75rem"
              : box.text.fontSize === "large"
              ? "1.25rem"
              : "0.875rem",
          padding: box.padding,
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      />

      <TextFormattingToolbar
        isFormatActive={isFormatActive}
        toggleFormat={toggleFormat}
        applyColor={applyColor}
        removeColor={removeColor}
        position={toolbarPosition}
        hasSelection={hasSelection}
      />
    </>
  );
};
