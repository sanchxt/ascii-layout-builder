import { Settings, Sliders, Code2 } from "lucide-react";
import { ResizablePanel, PanelAction } from "@/components/ui/resizable-panel";
import { Navigator } from "./Navigator";
import { PropertiesContent } from "@/features/boxes/components/PropertiesContent";
import { LinePropertiesContent } from "@/features/lines/components/LinePropertiesContent";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import { useOutputDrawerStore } from "@/features/output-drawer/store/outputDrawerStore";
import { cn } from "@/lib/utils";

export const RightSidebar = () => {
  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);
  const selectedLineIds = useLineStore((state) => state.selectedLineIds);
  const hasBoxSelection = selectedBoxIds.length > 0;
  const hasLineSelection = selectedLineIds.length > 0;
  const hasSelection = hasBoxSelection || hasLineSelection;
  const selectionCount = selectedBoxIds.length + selectedLineIds.length;

  const isOutputOpen = useOutputDrawerStore((state) => state.isOpen);
  const toggleOutput = useOutputDrawerStore((state) => state.toggle);

  return (
    <aside className="w-72 flex flex-col border-l border-border bg-gradient-to-b from-sidebar to-sidebar/80 overflow-hidden">
      <div className="shrink-0 h-10 px-3 flex items-center justify-between border-b border-sidebar-border bg-card/60">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Design
        </span>
        <button
          onClick={toggleOutput}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
            isOutputOpen
              ? "bg-accent text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          title="Toggle Output Panel (ASCII & Code)"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Output</span>
        </button>
      </div>

      <Navigator />

      <ResizablePanel
        id="properties"
        title="Properties"
        icon={Sliders}
        collapsible={true}
        showDivider={false}
        badge={hasSelection ? selectionCount : undefined}
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
        {hasLineSelection ? <LinePropertiesContent /> : <PropertiesContent />}
      </ResizablePanel>
    </aside>
  );
};
