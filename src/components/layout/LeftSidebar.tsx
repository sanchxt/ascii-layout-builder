import { Button } from "@/components/ui/button";
import { MousePointer2, Square, Type, Frame } from "lucide-react";
import { useCanvasStore } from "@/features/canvas/store/canvasStore";
import type { ToolType } from "@/types/canvas";

export const LeftSidebar = () => {
  const { interaction, setSelectedTool } = useCanvasStore();

  const handleToolClick = (tool: ToolType) => {
    setSelectedTool(tool);
  };

  const getButtonVariant = (tool: ToolType) => {
    return interaction.selectedTool === tool ? "default" : "ghost";
  };

  return (
    <div className="w-16 border-r border-gray-200 bg-white flex flex-col items-center py-4 gap-2">
      <Button
        variant={getButtonVariant("select")}
        size="icon"
        title="Selection Tool (V)"
        onClick={() => handleToolClick("select")}
        className="h-10 w-10"
      >
        <MousePointer2 className="h-5 w-5" />
      </Button>

      <Button
        variant={getButtonVariant("box")}
        size="icon"
        title="Box Tool (B)"
        onClick={() => handleToolClick("box")}
        className="h-10 w-10"
      >
        <Square className="h-5 w-5" />
      </Button>

      <Button
        variant={getButtonVariant("text")}
        size="icon"
        title="Text Tool (T)"
        onClick={() => handleToolClick("text")}
        className="h-10 w-10"
      >
        <Type className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        title="Artboard Tool (A) - Coming Soon"
        disabled
        className="h-10 w-10"
      >
        <Frame className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <div className="text-xs text-gray-400 text-center px-1">
        Phase 2
        <br />
        Complete
      </div>
    </div>
  );
};
