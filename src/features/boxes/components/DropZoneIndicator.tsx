import { BOX_CONSTANTS } from "@/lib/constants";
import { getAbsolutePosition } from "../utils/boxHierarchy";
import { useBoxStore } from "../store/boxStore";

interface DropZoneIndicatorProps {
  targetBoxId: string;
  isValid: boolean;
  validationMessage?: string;
}

export const DropZoneIndicator = ({
  targetBoxId,
  isValid,
  validationMessage,
}: DropZoneIndicatorProps) => {
  const boxes = useBoxStore((state) => state.boxes);
  const targetBox = boxes.find((b) => b.id === targetBoxId);

  if (!targetBox) return null;

  const absPosition = getAbsolutePosition(targetBox, boxes);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: absPosition.x,
        top: absPosition.y,
        width: targetBox.width,
        height: targetBox.height,
        zIndex: 9999,
      }}
    >
      <div
        className={`absolute inset-0 rounded-sm ${
          isValid ? "animate-pulse border-4" : "border-2 border-dashed"
        }`}
        style={{
          borderColor: isValid
            ? BOX_CONSTANTS.NESTING_HIGHLIGHT_COLOR
            : "var(--canvas-invalid)",
          boxShadow: isValid
            ? `0 0 0 4px color-mix(in oklch, ${BOX_CONSTANTS.NESTING_HIGHLIGHT_COLOR} 20%, transparent)`
            : "none",
        }}
      />

      {isValid && (
        <div
          className="absolute border-2 border-dashed opacity-50"
          style={{
            borderColor: BOX_CONSTANTS.NESTING_HIGHLIGHT_COLOR,
            top: BOX_CONSTANTS.NESTING_DROP_ZONE_THRESHOLD,
            left: BOX_CONSTANTS.NESTING_DROP_ZONE_THRESHOLD,
            right: BOX_CONSTANTS.NESTING_DROP_ZONE_THRESHOLD,
            bottom: BOX_CONSTANTS.NESTING_DROP_ZONE_THRESHOLD,
          }}
        />
      )}

      {!isValid && validationMessage && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2
                     bg-canvas-invalid text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{
            zIndex: 10000,
          }}
        >
          <div className="relative">
            {validationMessage}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2
                         w-0 h-0 border-l-4 border-r-4 border-t-4
                         border-transparent border-t-canvas-invalid"
            />
          </div>
        </div>
      )}

      {isValid && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2
                     bg-canvas-valid text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{
            zIndex: 10000,
          }}
        >
          <div className="relative flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Drop to nest inside
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2
                         w-0 h-0 border-l-4 border-r-4 border-t-4
                         border-transparent border-t-canvas-valid"
            />
          </div>
        </div>
      )}
    </div>
  );
};
