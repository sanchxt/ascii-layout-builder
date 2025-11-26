import { Button } from "@/components/ui/button";
import { Save, Share2, Undo2, Redo2 } from "lucide-react";

export const Toolbar = () => {
  return (
    <div className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 z-50 relative">
      {/* Left: Branding & File Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-zinc-900">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-bold tracking-tight hidden sm:inline-block">
            WARPSCEW
          </span>
        </div>

        <div className="h-6 w-px bg-zinc-200 mx-2" />

        <div className="flex flex-col justify-center">
          <input
            type="text"
            defaultValue="Untitled Layout"
            className="text-sm font-medium text-zinc-900 bg-transparent border-none focus:ring-0 p-0 h-auto hover:text-blue-600 transition-colors cursor-pointer"
          />
          <span className="text-[10px] text-zinc-400">Edited just now</span>
        </div>
      </div>

      {/* Center: History (Visual placeholder) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-900"
          disabled
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-900"
          disabled
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-600 hover:text-zinc-900"
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button
          size="sm"
          className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
        >
          <Share2 className="h-3.5 w-3.5 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
};
