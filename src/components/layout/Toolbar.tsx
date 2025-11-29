import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Save, Share2, Undo2, Redo2, Code2 } from "lucide-react";
import { LayoutToolbarMenu } from "@/features/commands/components/LayoutToolbarMenu";
import { useOutputDrawerStore } from "@/features/output-drawer/store/outputDrawerStore";
import { cn } from "@/lib/utils";

export const Toolbar = () => {
  const isOutputOpen = useOutputDrawerStore((state) => state.isOpen);
  const toggleOutput = useOutputDrawerStore((state) => state.toggle);

  return (
    <div className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 z-50 relative">
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

        <LayoutToolbarMenu />

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

      <div className="flex items-center gap-2">
        <Link
          to="/releases"
          className="hidden sm:inline-flex px-2 py-1 text-xs font-mono text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          v0.1.6
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleOutput}
          className={cn(
            "transition-colors",
            isOutputOpen
              ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
              : "text-zinc-600 hover:text-zinc-900"
          )}
          title="Toggle Output Panel"
        >
          <Code2 className="h-4 w-4 mr-2" />
          Output
        </Button>
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
