import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Trash2,
  Layout,
} from "lucide-react";
import { useArtboardCreation } from "../hooks/useArtboardCreation";
import { useArtboardStore } from "../store/artboardStore";
import { ARTBOARD_PRESETS } from "../utils/artboardPresets";

export const ArtboardControls = () => {
  const { createMobile, createTablet, createDesktop, createCustom } =
    useArtboardCreation();
  const selectedArtboardIds = useArtboardStore(
    (state) => state.selectedArtboardIds
  );
  const deleteArtboards = useArtboardStore((state) => state.deleteArtboards);
  const getActiveArtboard = useArtboardStore(
    (state) => state.getActiveArtboard
  );

  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState("1440");
  const [customHeight, setCustomHeight] = useState("900");

  const activeArtboard = getActiveArtboard();
  const hasSelection = selectedArtboardIds.length > 0;

  const handleCustomCreate = () => {
    const width = parseInt(customWidth, 10);
    const height = parseInt(customHeight, 10);
    if (isNaN(width) || isNaN(height) || width < 100 || height < 100) return;
    createCustom(width, height);
    setIsCustomDialogOpen(false);
  };

  const PresetButton = ({ icon: Icon, label, sub, onClick }: any) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all group"
    >
      <Icon className="w-5 h-5 text-zinc-400 group-hover:text-blue-500" />
      <div className="text-center">
        <div className="text-[10px] font-medium text-zinc-700 group-hover:text-blue-700">
          {label}
        </div>
        <div className="text-[9px] text-zinc-400 group-hover:text-blue-400">
          {sub}
        </div>
      </div>
    </button>
  );

  return (
    <div className="p-4 space-y-4 bg-zinc-50/50">
      {activeArtboard && (
        <div className="flex items-center gap-3 px-3 py-2 bg-white border border-blue-100 rounded-lg shadow-sm">
          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
            <Layout className="w-4 h-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">
              Active Artboard
            </div>
            <div className="text-xs font-medium text-zinc-900 truncate">
              {activeArtboard.name}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Create New
        </div>

        <div className="grid grid-cols-3 gap-2">
          <PresetButton
            icon={Smartphone}
            label="Mobile"
            sub={`${ARTBOARD_PRESETS.mobile.dimensions.width}×${ARTBOARD_PRESETS.mobile.dimensions.height}`}
            onClick={createMobile}
          />
          <PresetButton
            icon={Tablet}
            label="Tablet"
            sub={`${ARTBOARD_PRESETS.tablet.dimensions.width}×${ARTBOARD_PRESETS.tablet.dimensions.height}`}
            onClick={createTablet}
          />
          <PresetButton
            icon={Monitor}
            label="Desktop"
            sub={`${ARTBOARD_PRESETS.desktop.dimensions.width}×${ARTBOARD_PRESETS.desktop.dimensions.height}`}
            onClick={createDesktop}
          />
        </div>

        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-8 border-dashed text-zinc-500 hover:text-zinc-900"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Custom Size
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[300px]">
            <DialogHeader>
              <DialogTitle className="text-sm">Custom Artboard</DialogTitle>
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
              <Button size="sm" onClick={handleCustomCreate} className="w-full">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {hasSelection && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteArtboards(selectedArtboardIds)}
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected ({selectedArtboardIds.length})
          </Button>
        </div>
      )}
    </div>
  );
};
