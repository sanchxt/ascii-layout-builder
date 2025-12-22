import { useMemo, useState, useRef } from "react";
import { Play, Plus, Search, X, RotateCcw, Download, Upload } from "lucide-react";
import { useAnimationStore } from "../store/animationStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { StateCard } from "./StateCard";
import { useStateDragDrop } from "../hooks/useStateDragDrop";
import {
  downloadAnimationJSON,
  validateImportData,
  readFileAsText,
} from "../utils/exportImport";
import { ANIMATION_CONSTANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const StateList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeArtboardId = useArtboardStore((s) => s.activeArtboardId);
  const allStates = useAnimationStore((s) => s.states);
  const createStateFromCurrentLayout = useAnimationStore(
    (s) => s.createStateFromCurrentLayout
  );
  const syncAllStatesFromLayout = useAnimationStore(
    (s) => s.syncAllStatesFromLayout
  );
  const exportAnimationData = useAnimationStore((s) => s.exportAnimationData);
  const importAnimationData = useAnimationStore((s) => s.importAnimationData);

  // Filter and sort states for active artboard
  const states = useMemo(() => {
    if (!activeArtboardId) return [];
    return allStates
      .filter((s) => s.artboardId === activeArtboardId)
      .sort((a, b) => a.order - b.order);
  }, [activeArtboardId, allStates]);

  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return states;
    const query = searchQuery.toLowerCase();
    return states.filter(
      (state) =>
        state.name.toLowerCase().includes(query) ||
        state.trigger.type.toLowerCase().includes(query)
    );
  }, [states, searchQuery]);

  // Drag and drop
  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useStateDragDrop({ states });

  const canAddState =
    activeArtboardId &&
    states.length < ANIMATION_CONSTANTS.MAX_STATES_PER_ARTBOARD;

  const handleAddState = () => {
    if (!activeArtboardId || !canAddState) return;
    createStateFromCurrentLayout(activeArtboardId);
  };

  const handleResetAll = () => {
    if (!activeArtboardId || states.length === 0) return;
    syncAllStatesFromLayout(activeArtboardId);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleExport = () => {
    if (!activeArtboardId || states.length === 0) return;

    const { states: exportStates, transitions } =
      exportAnimationData(activeArtboardId);

    downloadAnimationJSON(exportStates, transitions, activeArtboardId, {
      elementCount: exportStates.reduce((sum, s) => sum + s.elements.length, 0),
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeArtboardId) return;

    try {
      const content = await readFileAsText(file);
      const result = validateImportData(content);

      if (!result.valid || !result.data) {
        console.error("Import validation failed:", result.errors);
        alert(`Import failed: ${result.errors.join(", ")}`);
        return;
      }

      if (result.warnings.length > 0) {
        console.warn("Import warnings:", result.warnings);
      }

      // Show confirmation dialog
      const existingCount = states.length;
      const mode =
        existingCount > 0
          ? window.confirm(
              `Replace existing ${existingCount} state(s)? Click OK to replace, Cancel to merge.`
            )
            ? "replace"
            : "merge"
          : "replace";

      const { statesImported, transitionsImported } = importAnimationData(
        activeArtboardId,
        result.data.states,
        result.data.transitions,
        mode
      );

      console.log(
        `Imported ${statesImported} states and ${transitionsImported} transitions`
      );
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import animation data");
    }

    // Reset file input
    e.target.value = "";
  };

  // No artboard selected
  if (!activeArtboardId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Play className="w-10 h-10 text-muted-foreground/30 mb-2" />
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          No artboard selected
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          Select an artboard to manage its animation states
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header toolbar */}
      <div className="shrink-0 px-2 py-1.5 border-b border-border bg-muted/30 flex items-center gap-1">
        {isSearchOpen ? (
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-7 py-1 text-xs bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              autoFocus
            />
            <button
              onClick={handleClearSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
              title="Search states"
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {states.length > 0 && (
              <>
                <button
                  onClick={handleResetAll}
                  className="p-1.5 rounded-md hover:bg-purple-500/10 transition-colors group"
                  title="Reset all states to current layout"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-500" />
                </button>
                <button
                  onClick={handleExport}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors"
                  title="Export animation states"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </>
            )}
            <button
              onClick={handleImportClick}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
              title="Import animation states"
            >
              <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.anim.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex-1" />
            <button
              onClick={handleAddState}
              disabled={!canAddState}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={
                canAddState
                  ? "Create state from current layout"
                  : `Maximum ${ANIMATION_CONSTANTS.MAX_STATES_PER_ARTBOARD} states reached`
              }
            >
              <Plus className="w-3 h-3" />
              <span>Add State</span>
            </button>
          </>
        )}
      </div>

      {/* States list */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredStates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Play className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              {searchQuery.trim() ? "No matches" : "No states yet"}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {searchQuery.trim()
                ? "Try a different search"
                : "Click 'Add State' to capture the current layout"}
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredStates.map((state) => {
              const isDragging = dragState.draggedStateId === state.id;
              const isDropTarget = dragState.dropTargetStateId === state.id;
              const dropPosition = isDropTarget ? dragState.dropPosition : null;

              return (
                <div
                  key={state.id}
                  draggable
                  onDragStart={(e) => handleDragStart(state.id, e)}
                  onDragOver={(e) => handleDragOver(state.id, e)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(state.id, e)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "relative transition-opacity",
                    isDragging && "opacity-50"
                  )}
                >
                  {/* Drop indicator - before */}
                  {isDropTarget && dropPosition === "before" && (
                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full z-10" />
                  )}

                  <StateCard state={state} isDragging={isDragging} />

                  {/* Drop indicator - after */}
                  {isDropTarget && dropPosition === "after" && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full z-10" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {searchQuery.trim() && filteredStates.length > 0 && (
        <div className="shrink-0 px-3 py-1.5 border-t border-border bg-muted/50">
          <p className="text-[10px] text-muted-foreground">
            {filteredStates.length} of {states.length} states
          </p>
        </div>
      )}

      {!searchQuery.trim() && states.length > 0 && (
        <div className="shrink-0 px-3 py-1.5 border-t border-border bg-muted/50">
          <p className="text-[10px] text-muted-foreground">
            {states.length} state{states.length !== 1 ? "s" : ""} •{" "}
            {ANIMATION_CONSTANTS.MAX_STATES_PER_ARTBOARD - states.length}{" "}
            remaining
          </p>
        </div>
      )}
    </div>
  );
};
