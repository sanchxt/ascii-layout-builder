import type { Box } from "@/types/box";
import { getResizeHandles } from "../utils/boxGeometry";
import { BOX_CONSTANTS } from "@/lib/constants";
import { useBoxResize } from "../hooks/useBoxResize";

interface BoxResizeHandlesProps {
  box: Box;
  onUpdate: (id: string, updates: Partial<Box>) => void;
  getCanvasBounds: () => DOMRect | null;
}

export const BoxResizeHandles = ({
  box,
  onUpdate,
  getCanvasBounds,
}: BoxResizeHandlesProps) => {
  const handles = getResizeHandles(box);
  const { handleMouseDown } = useBoxResize(box, onUpdate, getCanvasBounds);

  return (
    <>
      {handles.map((handle) => (
        <div
          key={handle.handle}
          className="absolute bg-white border-2 border-blue-500 rounded-sm hover:bg-blue-100 transition-colors"
          style={{
            left: handle.x - box.x - BOX_CONSTANTS.HANDLE_SIZE / 2,
            top: handle.y - box.y - BOX_CONSTANTS.HANDLE_SIZE / 2,
            width: BOX_CONSTANTS.HANDLE_SIZE,
            height: BOX_CONSTANTS.HANDLE_SIZE,
            cursor: handle.cursor,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown(handle.handle, e);
          }}
        />
      ))}
    </>
  );
};
