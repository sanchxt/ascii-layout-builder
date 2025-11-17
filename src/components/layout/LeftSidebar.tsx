import { Button } from "@/components/ui/button";
import { MousePointer2, Square, Type, Frame } from "lucide-react";

export const LeftSidebar = () => {
  return (
    <div className="w-16 border-r border-gray-200 bg-white flex flex-col items-center py-4 gap-2">
      {/* selection tool */}
      <Button
        variant="ghost"
        size="icon"
        title="Selection Tool (V)"
        disabled
        className="h-10 w-10"
      >
        <MousePointer2 className="h-5 w-5" />
      </Button>

      {/* box tool */}
      <Button
        variant="ghost"
        size="icon"
        title="Box Tool (B)"
        disabled
        className="h-10 w-10"
      >
        <Square className="h-5 w-5" />
      </Button>

      {/* text tool */}
      <Button
        variant="ghost"
        size="icon"
        title="Text Tool (T)"
        disabled
        className="h-10 w-10"
      >
        <Type className="h-5 w-5" />
      </Button>

      {/* artboard tool */}
      <Button
        variant="ghost"
        size="icon"
        title="Artboard Tool (A)"
        disabled
        className="h-10 w-10"
      >
        <Frame className="h-5 w-5" />
      </Button>

      {/* spacer */}
      <div className="flex-1" />

      {/* info text */}
      <div className="text-xs text-gray-400 text-center px-1">
        Tools
        <br />
        Phase 2
      </div>
    </div>
  );
};
