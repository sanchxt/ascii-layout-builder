import { useMemo, useState } from "react";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Search,
  X,
} from "lucide-react";
import { useBoxStore } from "../store/boxStore";
import { useLayersUIStore } from "../store/layersUIStore";
import { LayerItem } from "./LayerItem";
import { getRootBoxes } from "../utils/boxHierarchy";
import { useLayerDragDrop } from "../hooks/useLayerDragDrop";

export const LayersPanel = () => {
  const boxes = useBoxStore((state) => state.boxes);

  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useLayerDragDrop();

  const isPanelCollapsed = useLayersUIStore((state) => state.isPanelCollapsed);
  const togglePanel = useLayersUIStore((state) => state.togglePanel);
  const searchQuery = useLayersUIStore((state) => state.searchQuery);
  const setSearchQuery = useLayersUIStore((state) => state.setSearchQuery);
  const expandAll = useLayersUIStore((state) => state.expandAll);
  const collapseAll = useLayersUIStore((state) => state.collapseAll);

  const [localSearch, setLocalSearch] = useState("");

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

  // !!!! TODO: auto expand parents of matching boxes on search
  // disabled due to render loop issues - will fix in future update
  // useEffect(() => {
  //   if (searchQuery.trim()) {
  //     const boxesToExpand: string[] = [];
  //     const findMatchingParents = (box: typeof boxes[0]) => {
  //       const query = searchQuery.toLowerCase();
  //       box.children.forEach((childId) => {
  //         const childBox = boxes.find((b) => b.id === childId);
  //         if (childBox) {
  //           const matches =
  //             childBox.name?.toLowerCase().includes(query) ||
  //             childBox.text.value.toLowerCase().includes(query);
  //           if (matches) {
  //             boxesToExpand.push(box.id);
  //           }
  //           findMatchingParents(childBox);
  //         }
  //       });
  //     };
  //     rootBoxes.forEach(findMatchingParents);
  //     if (boxesToExpand.length > 0) {
  //       expandAll(boxesToExpand);
  //     }
  //   }
  // }, [searchQuery]);

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
  };

  const handleExpandAll = () => {
    const allBoxIds = boxes
      .filter((b) => b.children.length > 0)
      .map((b) => b.id);
    expandAll(allBoxIds);
  };

  const handleCollapseAll = () => {
    collapseAll();
  };

  const totalBoxCount = boxes.length;
  const visibleBoxCount = filteredRootBoxes.length;

  return (
    <div className="flex flex-col h-full border-t border-gray-200">
      <div
        className="flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={togglePanel}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Layers</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {totalBoxCount}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isPanelCollapsed && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandAll();
                }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                title="Expand All"
              >
                <ChevronsDown className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCollapseAll();
                }}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                title="Collapse All"
              >
                <ChevronsUp className="w-4 h-4 text-gray-600" />
              </button>
            </>
          )}

          {isPanelCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </div>
      </div>

      {!isPanelCollapsed && (
        <>
          <div className="px-3 py-2 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search layers..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {localSearch && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {filteredRootBoxes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Layers className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  {searchQuery.trim()
                    ? "No layers match your search"
                    : "No layers yet"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery.trim()
                    ? "Try a different search term"
                    : "Create a box to get started"}
                </p>
              </div>
            ) : (
              <div className="py-1">
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
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing {visibleBoxCount} of {totalBoxCount} layers
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
