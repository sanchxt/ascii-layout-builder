import { useMemo } from "react";
import { Frame, Layers, Plus, Play } from "lucide-react";
import { PanelTabs, TabPanel } from "@/components/ui/panel-tabs";
import { ResizablePanel, PanelAction } from "@/components/ui/resizable-panel";
import { useSidebarUIStore } from "./store/sidebarUIStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useAnimationStore } from "@/features/animation/store/animationStore";
import { ArtboardsContent } from "@/features/artboards/components/ArtboardsContent";
import { LayersContent } from "@/features/boxes/components/LayersContent";
import { StateList } from "@/features/animation/components";

export const Navigator = () => {
  const activeTab = useSidebarUIStore((state) => state.activeNavigatorTab);
  const setTab = useSidebarUIStore((state) => state.setNavigatorTab);

  const artboards = useArtboardStore((state) => state.artboards);
  const boxes = useBoxStore((state) => state.boxes);
  const editorMode = useAnimationStore((state) => state.editorMode);
  const states = useAnimationStore((state) => state.states);
  const activeArtboardId = useArtboardStore((state) => state.activeArtboardId);

  // Get state count for the active artboard
  const activeArtboardStateCount = useMemo(() => {
    if (!activeArtboardId) return 0;
    return states.filter((s) => s.artboardId === activeArtboardId).length;
  }, [states, activeArtboardId]);

  const tabs = useMemo(() => {
    if (editorMode === "animation") {
      return [
        {
          id: "artboards" as const,
          label: "Artboards",
          badge: artboards.length,
        },
        {
          id: "states" as const,
          label: "States",
          badge: activeArtboardStateCount,
        },
      ];
    }
    return [
      { id: "artboards" as const, label: "Artboards", badge: artboards.length },
      { id: "layers" as const, label: "Layers", badge: boxes.length },
    ];
  }, [editorMode, artboards.length, boxes.length, activeArtboardStateCount]);

  const getHeaderIcon = () => {
    if (activeTab === "artboards") return Frame;
    if (activeTab === "states") return Play;
    return Layers;
  };

  const getBadge = () => {
    if (activeTab === "artboards") return artboards.length;
    if (activeTab === "states") return activeArtboardStateCount;
    return boxes.length;
  };

  const getActionTitle = () => {
    if (activeTab === "artboards") return "New Artboard";
    if (activeTab === "states") return "New State";
    return "New Box";
  };

  return (
    <ResizablePanel
      id="navigator"
      title="Navigator"
      icon={getHeaderIcon()}
      badge={getBadge()}
      headerActions={
        <PanelAction
          icon={Plus}
          onClick={() => {
            /* will open create menu */
          }}
          title={getActionTitle()}
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
        <TabPanel isActive={activeTab === "states"}>
          <StateList />
        </TabPanel>
      </PanelTabs>
    </ResizablePanel>
  );
};
