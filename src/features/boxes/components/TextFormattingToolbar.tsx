import { Bold, Italic, Code, Palette, X } from "lucide-react";
import { TEXT_CONSTANTS } from "@/lib/constants";
import type { FormatType } from "../utils/textFormatting";

interface TextFormattingToolbarProps {
  isFormatActive: (type: FormatType) => boolean;
  toggleFormat: (type: FormatType) => void;
  applyColor: (color: string) => void;
  removeColor: () => void;
  position: { top: number; left: number };
  hasSelection: boolean;
}

export const TextFormattingToolbar = ({
  isFormatActive,
  toggleFormat,
  applyColor,
  removeColor,
  position,
  hasSelection,
}: TextFormattingToolbarProps) => {
  const formatButtons: Array<{
    type: FormatType;
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    shortcut: string;
  }> = [
    { type: "bold", icon: Bold, label: "Bold", shortcut: "⌘B" },
    { type: "italic", icon: Italic, label: "Italic", shortcut: "⌘I" },
    { type: "code", icon: Code, label: "Code", shortcut: "⌘`" },
  ];

  return (
    <div
      className="absolute z-50 flex items-center gap-1 bg-gray-900 text-white rounded-lg shadow-lg px-2 py-1.5"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {formatButtons.map(({ type, icon: Icon, label, shortcut }) => (
        <button
          key={type}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleFormat(type)}
          disabled={!hasSelection}
          className={`p-1.5 rounded transition-colors ${
            isFormatActive(type)
              ? "bg-blue-500 text-white"
              : !hasSelection
              ? "text-gray-500 cursor-not-allowed"
              : "hover:bg-gray-700"
          }`}
          title={
            !hasSelection ? "Select text to format" : `${label} (${shortcut})`
          }
          type="button"
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="w-px h-4 bg-gray-700 mx-1" />

      <div className="relative group">
        <button
          onMouseDown={(e) => e.preventDefault()}
          disabled={!hasSelection}
          className={`p-1.5 rounded transition-colors ${
            isFormatActive("color")
              ? "bg-blue-500 text-white"
              : !hasSelection
              ? "text-gray-500 cursor-not-allowed"
              : "hover:bg-gray-700"
          }`}
          title={!hasSelection ? "Select text to highlight" : "Highlight Color"}
          type="button"
        >
          <Palette size={16} />
        </button>

        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col gap-1 bg-gray-900 rounded-lg p-2 shadow-lg">
          {TEXT_CONSTANTS.HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyColor(color)}
              className="w-6 h-6 rounded border-2 border-white/20 hover:border-white transition-colors"
              style={{ backgroundColor: color }}
              title={`Highlight with ${color}`}
              type="button"
            />
          ))}

          {isFormatActive("color") && (
            <>
              <div className="w-full h-px bg-gray-700 my-1" />
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={removeColor}
                className="p-1 rounded hover:bg-gray-700 transition-colors flex items-center justify-center"
                title="Remove highlight"
                type="button"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
