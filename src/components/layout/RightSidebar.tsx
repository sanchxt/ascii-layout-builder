import { Code2, Settings, Sliders } from "lucide-react";
import { ResizablePanel, PanelAction } from "@/components/ui/resizable-panel";
import { Navigator } from "./Navigator";
import { AsciiPreviewContent } from "@/features/ascii-output/components/AsciiPreviewContent";
import { PropertiesContent } from "@/features/boxes/components/PropertiesContent";
import { useBoxStore } from "@/features/boxes/store/boxStore";

export const RightSidebar = () => {
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const hasSelection = selectedBoxIds.length > 0;

  return (
    <aside className="w-80 flex flex-col border-l border-zinc-200/80 bg-linear-to-b from-zinc-50 to-zinc-100/50 overflow-hidden">
      <ResizablePanel
        id="preview"
        title="Preview"
        icon={Code2}
        collapsible={true}
        showDivider={true}
      >
        <AsciiPreviewContent />
      </ResizablePanel>

      <Navigator />

      <ResizablePanel
        id="properties"
        title={hasSelection ? "Properties" : "Properties"}
        icon={Sliders}
        collapsible={true}
        showDivider={false}
        badge={hasSelection ? selectedBoxIds.length : undefined}
        headerActions={
          hasSelection ? (
            <PanelAction
              icon={Settings}
              onClick={() => {}}
              title="More options"
            />
          ) : null
        }
      >
        <PropertiesContent />
      </ResizablePanel>
    </aside>
  );
};
