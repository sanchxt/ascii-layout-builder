import { useMemo, useState } from "react";
import {
  Frame,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  Circle,
} from "lucide-react";
import { useArtboardStore } from "../store/artboardStore";
import { getBoxesInArtboard } from "../utils/artboardHelpers";
import { useBoxStore } from "@/features/boxes/store/boxStore";

interface ArtboardItemProps {
  artboardId: string;
  isActive: boolean;
  isSelected: boolean;
  boxCount: number;
}

const ArtboardItem = ({
  artboardId,
  isActive,
  isSelected,
  boxCount,
}: ArtboardItemProps) => {
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

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setTempName("");
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      handleRenameCancel();
    }
  };

  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleVisibility(artboard.id);
  };

  const handleLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLock(artboard.id);
  };

  const handleBringToFront = (e: React.MouseEvent) => {
    e.stopPropagation();
    bringToFront(artboard.id);
  };

  const handleSendToBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    sendToBack(artboard.id);
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`
        group relative flex items-center gap-2 px-3 py-2
        cursor-pointer border-l-2 transition-all
        ${
          isSelected
            ? "bg-blue-50 border-l-blue-500"
            : "bg-white border-l-transparent hover:bg-gray-50"
        }
        ${artboard.locked ? "opacity-60" : ""}
      `}
    >
      {isActive && (
        <Circle className="w-2 h-2 fill-blue-500 text-blue-500 shrink-0" />
      )}
      {!isActive && <div className="w-2 h-2 shrink-0" />}

      <Frame className="w-4 h-4 text-gray-500 shrink-0" />

      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            className="w-full px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 truncate">
              {artboard.name}
            </span>
            <span className="text-xs text-gray-500">
              {artboard.width}×{artboard.height} · {boxCount} boxes
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleBringToFront}
          className="p-1 rounded hover:bg-gray-200"
          title="Bring to Front"
        >
          <ChevronsUp className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <button
          onClick={handleSendToBack}
          className="p-1 rounded hover:bg-gray-200"
          title="Send to Back"
        >
          <ChevronsDown className="w-3.5 h-3.5 text-gray-600" />
        </button>

        <button
          onClick={handleVisibilityToggle}
          className="p-1 rounded hover:bg-gray-200"
          title={artboard.visible ? "Hide" : "Show"}
        >
          {artboard.visible ? (
            <Eye className="w-3.5 h-3.5 text-gray-600" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        <button
          onClick={handleLockToggle}
          className="p-1 rounded hover:bg-gray-200"
          title={artboard.locked ? "Unlock" : "Lock"}
        >
          {artboard.locked ? (
            <Lock className="w-3.5 h-3.5 text-gray-600" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};

export const ArtboardsPanel = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const artboards = useArtboardStore((state) => state.artboards);
  const activeArtboardId = useArtboardStore((state) => state.activeArtboardId);
  const selectedArtboardIds = useArtboardStore(
    (state) => state.selectedArtboardIds
  );
  const boxes = useBoxStore((state) => state.boxes);

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

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  const totalArtboards = artboards.length;
  const visibleArtboards = artboards.filter((a) => a.visible).length;

  return (
    <div className="flex flex-col h-full border-t border-gray-200">
      <div
        className="flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={togglePanel}
      >
        <div className="flex items-center gap-2">
          <Frame className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Artboards</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {totalArtboards}
          </span>
        </div>

        <button className="p-1 rounded hover:bg-gray-200 transition-colors">
          {isPanelCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {!isPanelCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {sortedArtboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Frame className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                No Artboards Yet
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Create your first artboard to organize your layouts
              </p>
            </div>
          ) : (
            <div className="py-1">
              {sortedArtboards.map((artboard) => (
                <ArtboardItem
                  key={artboard.id}
                  artboardId={artboard.id}
                  isActive={artboard.id === activeArtboardId}
                  isSelected={selectedArtboardIds.includes(artboard.id)}
                  boxCount={artboardBoxCounts[artboard.id] || 0}
                />
              ))}
            </div>
          )}

          {totalArtboards > 0 && (
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2">
              <div className="text-xs text-gray-600">
                {visibleArtboards} of {totalArtboards} visible
                {selectedArtboardIds.length > 0 &&
                  ` · ${selectedArtboardIds.length} selected`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
