import { Button } from "@/components/ui/button";
import { MousePointer2, Square, Type, Frame, Minus } from "lucide-react";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import type { ToolType } from "@/types/canvas";
import { cn } from "@/lib/utils";

export const LeftSidebar = () => {
  const { interaction, setSelectedTool } = useCanvasStore();

  const tools: { id: ToolType; icon: any; label: string; shortcut: string }[] =
    [
      {
        id: "select",
        icon: MousePointer2,
        label: "Selection",
        shortcut: "V",
      },
      {
        id: "box",
        icon: Square,
        label: "Box",
        shortcut: "B",
      },
      {
        id: "text",
        icon: Type,
        label: "Text",
        shortcut: "T",
      },
      {
        id: "artboard",
        icon: Frame,
        label: "Artboard",
        shortcut: "A",
      },
      {
        id: "line",
        icon: Minus,
        label: "Line",
        shortcut: "L",
      },
    ];

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-40">
      <div className="bg-white rounded-xl shadow-lg border border-zinc-200/80 p-1.5 flex flex-col gap-1 backdrop-blur-sm">
        {tools.map((tool) => {
          const isActive = interaction.selectedTool === tool.id;
          return (
            <div key={tool.id} className="relative group">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTool(tool.id)}
                className={cn(
                  "h-10 w-10 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <tool.icon className="h-5 w-5" />
              </Button>

              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tool.label}{" "}
                <span className="text-zinc-500 ml-1">{tool.shortcut}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
