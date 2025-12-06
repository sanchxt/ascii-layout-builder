import { Code2, Braces } from "lucide-react";
import { SlideOverDrawer } from "@/components/ui/slide-over-drawer";
import { useOutputDrawerStore } from "../store/outputDrawerStore";
import { AsciiPreviewContent } from "@/features/ascii-output/components/AsciiPreviewContent";
import { CodePreview } from "@/features/code-output/components/CodePreview";
import { cn } from "@/lib/utils";

type OutputTab = "ascii" | "code";

const TABS: { id: OutputTab; label: string; icon: React.ReactNode }[] = [
  { id: "ascii", label: "ASCII Preview", icon: <Code2 className="w-4 h-4" /> },
  { id: "code", label: "Code Output", icon: <Braces className="w-4 h-4" /> },
];

export const OutputDrawer = () => {
  const isOpen = useOutputDrawerStore((state) => state.isOpen);
  const close = useOutputDrawerStore((state) => state.close);
  const activeTab = useOutputDrawerStore((state) => state.activeTab);
  const setActiveTab = useOutputDrawerStore((state) => state.setActiveTab);

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={close}
      width={380}
      showBackdrop={true}
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      <div className="h-full flex flex-col">
        <div className="shrink-0 border-b border-border bg-card">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3",
                  "text-sm font-medium transition-all duration-200",
                  "border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "text-foreground border-foreground bg-background"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === "ascii" && <AsciiPreviewContent />}
          {activeTab === "code" && <CodePreview />}
        </div>
      </div>
    </SlideOverDrawer>
  );
};
