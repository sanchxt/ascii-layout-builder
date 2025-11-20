import { Settings } from "lucide-react";
import { BoxPropertiesPanel } from "@/features/boxes/components/BoxPropertiesPanel";
import { AsciiPreview } from "@/features/ascii-output/components/AsciiPreview";
import { LayersPanel } from "@/features/boxes/components/LayersPanel";
import { ArtboardControls } from "@/features/artboards/components/ArtboardControls";
import { ArtboardsPanel } from "@/features/artboards/components/ArtboardsPanel";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLayersUIStore } from "@/features/boxes/store/layersUIStore";

export const RightSidebar = () => {
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const isPanelCollapsed = useLayersUIStore((state) => state.isPanelCollapsed);
  const hasSelection = selectedBoxIds.length > 0;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="h-80 shrink-0 flex flex-col border-b border-gray-200">
        <AsciiPreview />
      </div>

      <div className="shrink-0 border-b border-gray-200 max-h-48 overflow-y-auto">
        <ArtboardControls />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="shrink-0 border-b border-gray-200">
          <ArtboardsPanel />
        </div>

        <div
          className={`shrink-0 ${isPanelCollapsed ? "h-14" : "h-64"}`}
          style={{ transition: "height 0.2s ease" }}
        >
          <LayersPanel />
        </div>

        <div className="shrink-0 h-80 flex flex-col border-t border-gray-200">
          <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
            <h2 className="font-semibold text-gray-900">Properties</h2>
            {hasSelection && <Settings className="h-4 w-4 text-gray-500" />}
          </div>

          <div className="flex-1 overflow-hidden">
            <BoxPropertiesPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
