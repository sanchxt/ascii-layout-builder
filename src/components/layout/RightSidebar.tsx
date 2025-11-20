import { Settings } from "lucide-react";
import { BoxPropertiesPanel } from "@/features/boxes/components/BoxPropertiesPanel";
import { AsciiPreview } from "@/features/ascii-output/components/AsciiPreview";
import { LayersPanel } from "@/features/boxes/components/LayersPanel";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLayersUIStore } from "@/features/boxes/store/layersUIStore";

export const RightSidebar = () => {
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const isPanelCollapsed = useLayersUIStore((state) => state.isPanelCollapsed);
  const hasSelection = selectedBoxIds.length > 0;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
      <div className="flex-1 flex flex-col border-b border-gray-200 min-h-0">
        <AsciiPreview />
      </div>

      <div
        className={isPanelCollapsed ? "h-14" : "h-64"}
        style={{ transition: "height 0.2s ease" }}
      >
        <LayersPanel />
      </div>

      <div className="h-80 flex flex-col">
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
