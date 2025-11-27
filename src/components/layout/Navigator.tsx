import { useMemo } from "react";
import { Frame, Layers, Plus } from "lucide-react";
import { PanelTabs, TabPanel } from "@/components/ui/panel-tabs";
import { ResizablePanel, PanelAction } from "@/components/ui/resizable-panel";
import { useSidebarUIStore } from "./store/sidebarUIStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { ArtboardsContent } from "@/features/artboards/components/ArtboardsContent";
import { LayersContent } from "@/features/boxes/components/LayersContent";

export const Navigator = () => {
  const activeTab = useSidebarUIStore((state) => state.activeNavigatorTab);
  const setTab = useSidebarUIStore((state) => state.setNavigatorTab);

  const artboards = useArtboardStore((state) => state.artboards);
  const boxes = useBoxStore((state) => state.boxes);

  const tabs = useMemo(
    () => [
      { id: "artboards" as const, label: "Artboards", badge: artboards.length },
      { id: "layers" as const, label: "Layers", badge: boxes.length },
    ],
    [artboards.length, boxes.length]
  );

  const headerIcon = activeTab === "artboards" ? Frame : Layers;

  return (
    <ResizablePanel
      id="navigator"
      title="Navigator"
      icon={headerIcon}
      badge={activeTab === "artboards" ? artboards.length : boxes.length}
      headerActions={
        <PanelAction
          icon={Plus}
          onClick={() => {
            /* will open create menu */
          }}
          title={activeTab === "artboards" ? "New Artboard" : "New Box"}
        />
      }
    >
      <PanelTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setTab(id as typeof activeTab)}
      >
        <TabPanel isActive={activeTab === "artboards"}>
          <ArtboardsContent />
        </TabPanel>
        <TabPanel isActive={activeTab === "layers"}>
          <LayersContent />
        </TabPanel>
      </PanelTabs>
    </ResizablePanel>
  );
};
