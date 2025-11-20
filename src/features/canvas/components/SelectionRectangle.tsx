import type { SelectionRect } from "@/types/canvas";

interface SelectionRectangleProps {
  selectionRect: SelectionRect;
}

export const SelectionRectangle = ({
  selectionRect,
}: SelectionRectangleProps) => {
  const { startX, startY, endX, endY } = selectionRect;

  // Calculate normalized rectangle (top-left to bottom-right)
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: "2px dashed #3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        zIndex: 9999,
      }}
    />
  );
};
