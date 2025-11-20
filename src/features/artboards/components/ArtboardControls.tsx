import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Tablet, Monitor, Plus, Trash2 } from "lucide-react";
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

  const handlePresetClick = (preset: "mobile" | "tablet" | "desktop") => {
    switch (preset) {
      case "mobile":
        createMobile();
        break;
      case "tablet":
        createTablet();
        break;
      case "desktop":
        createDesktop();
        break;
    }
  };

  const handleCustomCreate = () => {
    const width = parseInt(customWidth, 10);
    const height = parseInt(customHeight, 10);

    if (isNaN(width) || isNaN(height) || width < 100 || height < 100) {
      alert("Please enter valid dimensions (minimum 100×100)");
      return;
    }

    if (width > 5000 || height > 5000) {
      alert("Maximum dimensions are 5000×5000");
      return;
    }

    createCustom(width, height);
    setIsCustomDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedArtboardIds.length === 0) return;

    const confirmMessage =
      selectedArtboardIds.length === 1
        ? "Delete this artboard? Boxes inside will remain on the canvas."
        : `Delete ${selectedArtboardIds.length} artboards? Boxes inside will remain on the canvas.`;

    if (window.confirm(confirmMessage)) {
      deleteArtboards(selectedArtboardIds);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {activeArtboard && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs font-medium text-blue-900 mb-1">
            Active Artboard
          </div>
          <div className="text-sm text-blue-700 font-semibold">
            {activeArtboard.name}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {activeArtboard.width} × {activeArtboard.height}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          New Artboard
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePresetClick("mobile")}
          className="w-full justify-start gap-2"
          title={ARTBOARD_PRESETS.mobile.description}
        >
          <Smartphone className="h-4 w-4" />
          <span className="flex-1 text-left">
            {ARTBOARD_PRESETS.mobile.name}
          </span>
          <span className="text-xs text-gray-500">
            {ARTBOARD_PRESETS.mobile.dimensions.width}×
            {ARTBOARD_PRESETS.mobile.dimensions.height}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePresetClick("tablet")}
          className="w-full justify-start gap-2"
          title={ARTBOARD_PRESETS.tablet.description}
        >
          <Tablet className="h-4 w-4" />
          <span className="flex-1 text-left">
            {ARTBOARD_PRESETS.tablet.name}
          </span>
          <span className="text-xs text-gray-500">
            {ARTBOARD_PRESETS.tablet.dimensions.width}×
            {ARTBOARD_PRESETS.tablet.dimensions.height}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePresetClick("desktop")}
          className="w-full justify-start gap-2"
          title={ARTBOARD_PRESETS.desktop.description}
        >
          <Monitor className="h-4 w-4" />
          <span className="flex-1 text-left">
            {ARTBOARD_PRESETS.desktop.name}
          </span>
          <span className="text-xs text-gray-500">
            {ARTBOARD_PRESETS.desktop.dimensions.width}×
            {ARTBOARD_PRESETS.desktop.dimensions.height}
          </span>
        </Button>

        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Plus className="h-4 w-4" />
              Custom Size
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Custom Artboard</DialogTitle>
              <DialogDescription>
                Enter custom dimensions for your artboard. Minimum size is
                100×100 pixels.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="width" className="text-right">
                  Width
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="col-span-3"
                  placeholder="1440"
                  min="100"
                  max="5000"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="height" className="text-right">
                  Height
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="col-span-3"
                  placeholder="900"
                  min="100"
                  max="5000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" onClick={handleCustomCreate}>
                Create Artboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {hasSelection && (
        <div className="pt-2 border-t border-gray-200">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="w-full justify-start gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedArtboardIds.length})
          </Button>
        </div>
      )}

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        <p className="mb-1">
          <strong>Tip:</strong> Click an artboard to make it active. New boxes
          will be placed on the active artboard.
        </p>
        <p>Use Shift+Click to select multiple artboards.</p>
      </div>
    </div>
  );
};
