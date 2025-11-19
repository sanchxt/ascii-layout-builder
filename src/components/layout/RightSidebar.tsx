import { Settings } from "lucide-react";
import { BoxPropertiesPanel } from "@/features/boxes/components/BoxPropertiesPanel";
import { AsciiPreview } from "@/features/ascii-output/components/AsciiPreview";
import { useBoxStore } from "@/features/boxes/store/boxStore";

export const RightSidebar = () => {
  const { selectedBoxIds } = useBoxStore();
  const hasSelection = selectedBoxIds.length > 0;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
      <div className="flex-1 flex flex-col border-b border-gray-200">
        <AsciiPreview />
      </div>

      <div className="h-96 flex flex-col">
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
          <h2 className="font-semibold text-gray-900">Properties</h2>
          {hasSelection && <Settings className="h-4 w-4 text-gray-500" />}
        </div>

        <div className="flex-1 overflow-hidden">
          <BoxPropertiesPanel />
        </div>
      </div>
    </div>
  );
};
