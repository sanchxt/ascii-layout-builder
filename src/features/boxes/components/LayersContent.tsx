import { useMemo, useState } from "react";
import { Layers, Search, X, ChevronsDown, ChevronsUp } from "lucide-react";
import { useBoxStore } from "../store/boxStore";
import { useLayersUIStore } from "../store/layersUIStore";
import { LayerItem } from "./LayerItem";
import { getRootBoxes } from "../utils/boxHierarchy";
import { useLayerDragDrop } from "../hooks/useLayerDragDrop";

export const LayersContent = () => {
  const boxes = useBoxStore((state) => state.boxes);

  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useLayerDragDrop();

  const searchQuery = useLayersUIStore((state) => state.searchQuery);
  const setSearchQuery = useLayersUIStore((state) => state.setSearchQuery);
  const expandAll = useLayersUIStore((state) => state.expandAll);
  const collapseAll = useLayersUIStore((state) => state.collapseAll);

  const [localSearch, setLocalSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const rootBoxes = useMemo(() => {
    return getRootBoxes(boxes).sort((a, b) => a.zIndex - b.zIndex);
  }, [boxes]);

  const filteredRootBoxes = useMemo(() => {
    if (!searchQuery.trim()) {
      return rootBoxes;
    }

    const query = searchQuery.toLowerCase();

    const matchesSearch = (box: (typeof boxes)[0]): boolean => {
      if (box.name?.toLowerCase().includes(query)) return true;
      if (box.text.value.toLowerCase().includes(query)) return true;
      return box.children.some((childId) => {
        const childBox = boxes.find((b) => b.id === childId);
        return childBox ? matchesSearch(childBox) : false;
      });
    };

    return rootBoxes.filter(matchesSearch);
  }, [rootBoxes, searchQuery, boxes]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    const timer = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleExpandAll = () => {
    const allBoxIds = boxes
      .filter((b) => b.children.length > 0)
      .map((b) => b.id);
    expandAll(allBoxIds);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-2 py-1.5 border-b border-zinc-100 bg-zinc-50/30 flex items-center gap-1">
        {isSearchOpen ? (
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search layers..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-7 pr-7 py-1 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleClearSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-100"
            >
              <X className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
              title="Search layers"
            >
              <Search className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <div className="flex-1" />
            <button
              onClick={handleExpandAll}
              className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
              title="Expand All"
            >
              <ChevronsDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <button
              onClick={collapseAll}
              className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
              title="Collapse All"
            >
              <ChevronsUp className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredRootBoxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Layers className="w-10 h-10 text-zinc-200 mb-2" />
            <p className="text-xs font-medium text-zinc-500 mb-0.5">
              {searchQuery.trim() ? "No matches" : "No layers"}
            </p>
            <p className="text-[10px] text-zinc-400">
              {searchQuery.trim()
                ? "Try a different search"
                : "Create a box to get started"}
            </p>
          </div>
        ) : (
          <div className="py-0.5">
            {filteredRootBoxes.map((box) => (
              <LayerItem
                key={box.id}
                box={box}
                depth={0}
                allBoxes={boxes}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                dragState={dragState}
              />
            ))}
          </div>
        )}
      </div>

      {searchQuery.trim() && filteredRootBoxes.length > 0 && (
        <div className="shrink-0 px-3 py-1.5 border-t border-zinc-100 bg-zinc-50/50">
          <p className="text-[10px] text-zinc-500">
            {filteredRootBoxes.length} of {rootBoxes.length} layers
          </p>
        </div>
      )}
    </div>
  );
};
