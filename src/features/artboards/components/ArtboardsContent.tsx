import { useMemo, useState } from "react";
import {
  Frame,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  Circle,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Trash2,
} from "lucide-react";
import { useArtboardStore } from "../store/artboardStore";
import { getBoxesInArtboard } from "../utils/artboardHelpers";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useArtboardCreation } from "../hooks/useArtboardCreation";
import { ARTBOARD_PRESETS } from "../utils/artboardPresets";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ArtboardRowProps {
  artboardId: string;
  isActive: boolean;
  isSelected: boolean;
  boxCount: number;
}

const ArtboardRow = ({
  artboardId,
  isActive,
  isSelected,
  boxCount,
}: ArtboardRowProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState("");

  const getArtboard = useArtboardStore((state) => state.getArtboard);
  const selectArtboard = useArtboardStore((state) => state.selectArtboard);
  const setActiveArtboard = useArtboardStore(
    (state) => state.setActiveArtboard
  );
  const toggleVisibility = useArtboardStore((state) => state.toggleVisibility);
  const toggleLock = useArtboardStore((state) => state.toggleLock);
  const updateName = useArtboardStore((state) => state.updateName);
  const bringToFront = useArtboardStore((state) => state.bringToFront);
  const sendToBack = useArtboardStore((state) => state.sendToBack);

  const artboard = getArtboard(artboardId);
  if (!artboard) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey;
    selectArtboard(artboard.id, isMultiSelect);
    if (!isMultiSelect) {
      setActiveArtboard(artboard.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (artboard.locked) return;
    setTempName(artboard.name);
    setIsRenaming(true);
  };

  const handleRenameSubmit = () => {
    if (tempName.trim()) {
      updateName(artboard.id, tempName.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRenameSubmit();
    else if (e.key === "Escape") setIsRenaming(false);
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-150",
        "border-l-2",
        isSelected
          ? "bg-blue-50/80 border-l-blue-500"
          : "bg-transparent border-l-transparent hover:bg-zinc-50",
        artboard.locked && "opacity-60"
      )}
    >
      <div className="w-2 shrink-0">
        {isActive && <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />}
      </div>

      <Frame
        className={cn(
          "w-3.5 h-3.5 shrink-0",
          isSelected ? "text-blue-500" : "text-zinc-400"
        )}
      />

      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            className="w-full px-1.5 py-0.5 text-xs bg-white border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="text-xs font-medium text-zinc-800 truncate">
              {artboard.name}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              {artboard.width}×{artboard.height} · {boxCount}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            bringToFront(artboard.id);
          }}
          className="p-1 rounded hover:bg-zinc-200/80 transition-colors"
          title="Bring to Front"
        >
          <ChevronsUp className="w-3 h-3 text-zinc-500" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            sendToBack(artboard.id);
          }}
          className="p-1 rounded hover:bg-zinc-200/80 transition-colors"
          title="Send to Back"
        >
          <ChevronsDown className="w-3 h-3 text-zinc-500" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleVisibility(artboard.id);
          }}
          className="p-1 rounded hover:bg-zinc-200/80 transition-colors"
          title={artboard.visible ? "Hide" : "Show"}
        >
          {artboard.visible ? (
            <Eye className="w-3 h-3 text-zinc-400" />
          ) : (
            <EyeOff className="w-3 h-3 text-zinc-400" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLock(artboard.id);
          }}
          className="p-1 rounded hover:bg-zinc-200/80 transition-colors"
          title={artboard.locked ? "Unlock" : "Lock"}
        >
          {artboard.locked ? (
            <Lock className="w-3 h-3 text-amber-500" />
          ) : (
            <Unlock className="w-3 h-3 text-zinc-400" />
          )}
        </button>
      </div>
    </div>
  );
};

export const ArtboardsContent = () => {
  const { createMobile, createTablet, createDesktop, createCustom } =
    useArtboardCreation();
  const artboards = useArtboardStore((state) => state.artboards);
  const activeArtboardId = useArtboardStore((state) => state.activeArtboardId);
  const selectedArtboardIds = useArtboardStore(
    (state) => state.selectedArtboardIds
  );
  const deleteArtboards = useArtboardStore((state) => state.deleteArtboards);
  const boxes = useBoxStore((state) => state.boxes);

  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState("1440");
  const [customHeight, setCustomHeight] = useState("900");

  const sortedArtboards = useMemo(() => {
    return [...artboards].sort((a, b) => b.zIndex - a.zIndex);
  }, [artboards]);

  const artboardBoxCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    artboards.forEach((artboard) => {
      counts[artboard.id] = getBoxesInArtboard(artboard.id, boxes).length;
    });
    return counts;
  }, [artboards, boxes]);

  const handleCustomCreate = () => {
    const width = parseInt(customWidth, 10);
    const height = parseInt(customHeight, 10);
    if (isNaN(width) || isNaN(height) || width < 100 || height < 100) return;
    createCustom(width, height);
    setIsCustomDialogOpen(false);
  };

  const hasSelection = selectedArtboardIds.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-3 py-2 border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex gap-1.5">
          <button
            onClick={() => createMobile()}
            className="flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg border border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all group hover-lift"
          >
            <Smartphone className="w-4 h-4 text-zinc-400 group-hover:text-blue-500" />
            <span className="text-[10px] font-medium text-zinc-600 group-hover:text-blue-600">
              {ARTBOARD_PRESETS.mobile.dimensions.width}×
              {ARTBOARD_PRESETS.mobile.dimensions.height}
            </span>
          </button>
          <button
            onClick={() => createTablet()}
            className="flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg border border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all group hover-lift"
          >
            <Tablet className="w-4 h-4 text-zinc-400 group-hover:text-blue-500" />
            <span className="text-[10px] font-medium text-zinc-600 group-hover:text-blue-600">
              {ARTBOARD_PRESETS.tablet.dimensions.width}×
              {ARTBOARD_PRESETS.tablet.dimensions.height}
            </span>
          </button>
          <button
            onClick={() => createDesktop()}
            className="flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg border border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all group hover-lift"
          >
            <Monitor className="w-4 h-4 text-zinc-400 group-hover:text-blue-500" />
            <span className="text-[10px] font-medium text-zinc-600 group-hover:text-blue-600">
              {ARTBOARD_PRESETS.desktop.dimensions.width}×
              {ARTBOARD_PRESETS.desktop.dimensions.height}
            </span>
          </button>
          <Dialog
            open={isCustomDialogOpen}
            onOpenChange={setIsCustomDialogOpen}
          >
            <DialogTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg border border-dashed border-zinc-300 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                <Plus className="w-4 h-4 text-zinc-400 group-hover:text-blue-500" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[280px]">
              <DialogHeader>
                <DialogTitle className="text-sm">Custom Size</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="space-y-1">
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  size="sm"
                  onClick={handleCustomCreate}
                  className="w-full"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedArtboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Frame className="w-10 h-10 text-zinc-200 mb-2" />
            <p className="text-xs font-medium text-zinc-500 mb-0.5">
              No artboards
            </p>
            <p className="text-[10px] text-zinc-400">
              Create one to get started
            </p>
          </div>
        ) : (
          <div className="py-1">
            {sortedArtboards.map((artboard) => (
              <ArtboardRow
                key={artboard.id}
                artboardId={artboard.id}
                isActive={artboard.id === activeArtboardId}
                isSelected={selectedArtboardIds.includes(artboard.id)}
                boxCount={artboardBoxCounts[artboard.id] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {hasSelection && (
        <div className="shrink-0 px-3 py-2 border-t border-zinc-100 bg-zinc-50/50">
          <button
            onClick={() => deleteArtboards(selectedArtboardIds)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete ({selectedArtboardIds.length})
          </button>
        </div>
      )}
    </div>
  );
};
