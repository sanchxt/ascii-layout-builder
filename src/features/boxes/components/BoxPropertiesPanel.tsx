import { useBoxStore } from "../store/boxStore";
import type { BorderStyle } from "@/types/box";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { TEXT_CONSTANTS } from "@/lib/constants";

export const BoxPropertiesPanel = () => {
  const { getSelectedBoxes, updateBox } = useBoxStore();
  const selectedBoxes = getSelectedBoxes();

  if (selectedBoxes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
        No box selected
      </div>
    );
  }

  if (selectedBoxes.length > 1) {
    return (
      <div className="h-full p-4 space-y-2">
        <div className="text-sm font-medium text-gray-700">
          {selectedBoxes.length} boxes selected
        </div>
        <div className="text-xs text-gray-500">
          Multi-box editing coming soon
        </div>
      </div>
    );
  }

  const box = selectedBoxes[0];

  const handleUpdate = (field: string, value: string | number) => {
    updateBox(box.id, { [field]: value });
  };

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <div className="text-sm font-semibold text-gray-700 mb-2">
        Box Properties
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Position</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">X</label>
            <input
              type="number"
              value={Math.round(box.x)}
              onChange={(e) => handleUpdate("x", parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Y</label>
            <input
              type="number"
              value={Math.round(box.y)}
              onChange={(e) => handleUpdate("y", parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Size</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Width</label>
            <input
              type="number"
              value={Math.round(box.width)}
              onChange={(e) =>
                handleUpdate("width", parseFloat(e.target.value))
              }
              min={100}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Height</label>
            <input
              type="number"
              value={Math.round(box.height)}
              onChange={(e) =>
                handleUpdate("height", parseFloat(e.target.value))
              }
              min={60}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Border Style</div>
        <div className="flex gap-2">
          {(["single", "double", "dashed"] as BorderStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => handleUpdate("borderStyle", style)}
              className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                box.borderStyle === style
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Padding</div>
        <input
          type="number"
          value={box.padding}
          onChange={(e) => handleUpdate("padding", parseFloat(e.target.value))}
          min={0}
          max={50}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="text-xs font-medium text-gray-600">Text</div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Alignment</label>
          <div className="flex gap-1">
            {[
              { value: "left", icon: AlignLeft },
              { value: "center", icon: AlignCenter },
              { value: "right", icon: AlignRight },
            ].map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() =>
                  updateBox(box.id, {
                    text: {
                      ...box.text,
                      alignment: value as "left" | "center" | "right",
                    },
                  })
                }
                className={`flex-1 p-2 rounded border transition-colors ${
                  box.text.alignment === value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
                title={value.charAt(0).toUpperCase() + value.slice(1)}
              >
                <Icon size={16} className="mx-auto" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
          <select
            value={box.text.fontSize}
            onChange={(e) =>
              updateBox(box.id, {
                text: {
                  ...box.text,
                  fontSize: e.target.value as "small" | "medium" | "large",
                },
              })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="small">Small (12px)</option>
            <option value="medium">Medium (14px)</option>
            <option value="large">Large (20px)</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Characters:</span>
          <span
            className={
              box.text.value.length > TEXT_CONSTANTS.MAX_LENGTH * 0.9
                ? "text-orange-500"
                : ""
            }
          >
            {box.text.value.length} / {TEXT_CONSTANTS.MAX_LENGTH}
          </span>
        </div>

        {box.text.value && (
          <button
            onClick={() =>
              updateBox(box.id, {
                text: {
                  ...box.text,
                  value: "",
                  formatting: [],
                },
              })
            }
            className="w-full px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
          >
            Clear Text
          </button>
        )}

        {!box.text.value && (
          <div className="text-xs text-gray-400 italic text-center py-2">
            No text
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Layer Order</div>
        <input
          type="number"
          value={box.zIndex}
          onChange={(e) => handleUpdate("zIndex", parseInt(e.target.value))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
        <div>ID: {box.id.slice(0, 8)}...</div>
        <div>
          Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Delete</kbd> to
          remove
        </div>
        <div>
          Press{" "}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded">Cmd/Ctrl+D</kbd> to
          duplicate
        </div>
      </div>
    </div>
  );
};
