import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Square,
} from "lucide-react";
import type { Box } from "@/types/box";
import { useBoxStore } from "../store/boxStore";
import { useLayersUIStore } from "../store/layersUIStore";
import { cn } from "@/lib/utils";

interface DragStateType {
  draggedBoxId: string | null;
  dropTargetBoxId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
}

interface LayerItemProps {
  box: Box;
  depth: number;
  allBoxes: Box[];
  onDragStart?: (boxId: string, e: React.DragEvent) => void;
  onDragOver?: (
    boxId: string,
    e: React.DragEvent,
    position: "before" | "after" | "inside"
  ) => void;
  onDrop?: (boxId: string, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  dragState?: DragStateType;
}

export const LayerItem = ({
  box,
  depth,
  allBoxes,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragState,
}: LayerItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedBoxIds = useBoxStore((state) => state.selectedBoxIds);

  const selectBox = useBoxStore((state) => state.selectBox);
  const toggleBoxVisibility = useBoxStore((state) => state.toggleBoxVisibility);
  const toggleBoxLock = useBoxStore((state) => state.toggleBoxLock);
  const updateBoxName = useBoxStore((state) => state.updateBoxName);
  const getBox = useBoxStore((state) => state.getBox);

  const expandedBoxIds = useLayersUIStore((state) => state.expandedBoxIds);
  const toggleExpanded = useLayersUIStore((state) => state.toggleExpanded);

  const isSelected = selectedBoxIds.includes(box.id);
  const hasChildren = box.children.length > 0;
  const expanded = expandedBoxIds.has(box.id);
  const isVisible = box.visible !== false;
  const isLocked = box.locked === true;

  const isDragging = dragState?.draggedBoxId === box.id;
  const isDropTarget = dragState?.dropTargetBoxId === box.id;
  const dropPosition = isDropTarget ? dragState?.dropPosition : null;

  const getDisplayName = () => {
    if (box.name) return box.name;
    if (box.text.value) {
      const truncated = box.text.value.trim().slice(0, 30);
      return truncated || `Box ${box.id.slice(0, 6)}`;
    }
    return `Box ${box.id.slice(0, 6)}`;
  };

  const displayName = getDisplayName();

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(box.name || "");
    setIsEditing(true);
  };

  const handleEditComplete = () => {
    if (editValue.trim()) {
      updateBoxName(box.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditComplete();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectBox(box.id, e.shiftKey || e.metaKey || e.ctrlKey);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      toggleExpanded(box.id);
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBoxVisibility(box.id);
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBoxLock(box.id);
  };

  const handleDragStartLocal = (e: React.DragEvent) => {
    if (isEditing || isLocked) {
      e.preventDefault();
      return;
    }
    onDragStart?.(box.id, e);
  };

  const handleDragOverLocal = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: "before" | "after" | "inside";
    if (y < height * 0.25) {
      position = "before";
    } else if (y > height * 0.75) {
      position = "after";
    } else {
      position = "inside";
    }

    onDragOver?.(box.id, e, position);
  };

  const handleDropLocal = (e: React.DragEvent) => {
    onDrop?.(box.id, e);
  };

  const handleDragEndLocal = () => {
    onDragEnd?.();
  };

  return (
    <div className="select-none">
      {isDropTarget && dropPosition === "before" && (
        <div className="h-0.5 bg-blue-500 mx-2 -mt-0.5" />
      )}

      <div
        draggable={!isEditing && !isLocked}
        onDragStart={handleDragStartLocal}
        onDragOver={handleDragOverLocal}
        onDrop={handleDropLocal}
        onDragEnd={handleDragEndLocal}
        className={cn(
          "group flex items-center h-8 px-2 cursor-pointer hover:bg-gray-100 transition-colors relative",
          isSelected && "bg-blue-50 border-l-2 border-blue-500",
          !isVisible && "opacity-50",
          isDragging && "opacity-40 bg-gray-200",
          isDropTarget &&
            dropPosition === "inside" &&
            "bg-blue-100 border border-blue-400 border-dashed"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className="w-4 h-4 mr-1 flex items-center justify-center">
          {hasChildren ? (
            <button
              onClick={handleToggleExpand}
              className="hover:bg-gray-200 rounded p-0.5 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-gray-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-600" />
              )}
            </button>
          ) : null}
        </div>

        <Square className="w-3 h-3 mr-2 text-gray-500 shrink-0" />

        <div className="flex-1 min-w-0 mr-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm text-gray-900 truncate block">
              {displayName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleVisibility}
            className={cn(
              "p-1 rounded hover:bg-gray-200 transition-colors",
              !isVisible && "opacity-100"
            )}
            title={isVisible ? "Hide" : "Show"}
          >
            {isVisible ? (
              <Eye className="w-3.5 h-3.5 text-gray-600" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>

          <button
            onClick={handleToggleLock}
            className={cn(
              "p-1 rounded hover:bg-gray-200 transition-colors",
              isLocked && "opacity-100"
            )}
            title={isLocked ? "Unlock" : "Lock"}
          >
            {isLocked ? (
              <Lock className="w-3.5 h-3.5 text-gray-600" />
            ) : (
              <LockOpen className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {isDropTarget && dropPosition === "after" && (
        <div className="h-0.5 bg-blue-500 mx-2 -mb-0.5" />
      )}

      {hasChildren && expanded && (
        <div>
          {box.children.map((childId) => {
            const childBox = getBox(childId);
            if (!childBox) return null;

            return (
              <LayerItem
                key={childId}
                box={childBox}
                depth={depth + 1}
                allBoxes={allBoxes}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                dragState={dragState}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
