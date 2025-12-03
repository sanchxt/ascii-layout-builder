import type { SelectionRect } from "@/types/canvas";

interface SelectionRectangleProps {
  selectionRect: SelectionRect;
}

export const SelectionRectangle = ({
  selectionRect,
}: SelectionRectangleProps) => {
  const { startX, startY, endX, endY } = selectionRect;

  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return (
    <div
      className="absolute pointer-events-none border-2 border-dashed border-canvas-selection bg-canvas-selection-bg"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 9999,
      }}
    />
  );
};
