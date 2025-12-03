import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Square,
  Type,
} from "lucide-react";
import type { Box } from "@/types/box";
import type { Line } from "@/types/line";
import { useBoxStore } from "../store/boxStore";
import { useLayersUIStore } from "../store/layersUIStore";
import { cn } from "@/lib/utils";
import { LineLayerItem } from "@/features/lines/components/LineLayerItem";

interface DragStateType {
  draggedBoxId: string | null;
  dropTargetBoxId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
}

interface LayerItemProps {
  box: Box;
  depth: number;
  allBoxes: Box[];
  childLines?: Line[];
  allLines?: Line[];
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
  childLines = [],
  allLines = [],
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
  const hasChildBoxes = box.children.length > 0;
  const hasChildLines = childLines.length > 0;
  const hasChildren = hasChildBoxes || hasChildLines;
  const expanded = expandedBoxIds.has(box.id);
  const isVisible = box.visible !== false;
  const isLocked = box.locked === true;

  const isDragging = dragState?.draggedBoxId === box.id;
  const isDropTarget = dragState?.dropTargetBoxId === box.id;
  const dropPosition = isDropTarget ? dragState?.dropPosition : null;

  const getDisplayName = () => {
    if (box.name) return box.name;
    if (box.text.value) {
      const truncated = box.text.value.trim().slice(0, 20);
      return truncated || `Box ${box.id.slice(0, 4)}`;
    }
    return `Box ${box.id.slice(0, 4)}`;
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
    if (y < height * 0.25) position = "before";
    else if (y > height * 0.75) position = "after";
    else position = "inside";
    onDragOver?.(box.id, e, position);
  };

  const handleDropLocal = (e: React.DragEvent) => {
    onDrop?.(box.id, e);
  };

  const handleDragEndLocal = () => {
    onDragEnd?.();
  };

  return (
    <div className="select-none relative">
      {depth > 0 && (
        <div
          className="absolute top-0 bottom-0 border-l border-border"
          style={{ left: `${depth * 16 + 11}px` }}
        />
      )}

      {isDropTarget && dropPosition === "before" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-canvas-selection z-20" />
      )}

      <div
        draggable={!isEditing && !isLocked}
        onDragStart={handleDragStartLocal}
        onDragOver={handleDragOverLocal}
        onDrop={handleDropLocal}
        onDragEnd={handleDragEndLocal}
        className={cn(
          "group flex items-center h-9 pr-2 cursor-pointer transition-colors relative border-b border-transparent",
          isSelected
            ? "bg-canvas-selection-bg text-canvas-selection"
            : "hover:bg-muted text-foreground",
          !isVisible && "opacity-50",
          isDragging && "opacity-40 bg-muted",
          isDropTarget &&
            dropPosition === "inside" &&
            "bg-canvas-selection-bg ring-1 ring-inset ring-canvas-selection/50"
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0 mr-1">
          {hasChildren ? (
            <button
              onClick={handleToggleExpand}
              className="hover:bg-accent rounded p-0.5 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          ) : null}
        </div>

        {box.text.value ? (
          <Type
            className={cn(
              "w-3.5 h-3.5 mr-2 shrink-0",
              isSelected ? "text-canvas-selection" : "text-muted-foreground"
            )}
          />
        ) : (
          <Square
            className={cn(
              "w-3.5 h-3.5 mr-2 shrink-0",
              isSelected ? "text-canvas-selection" : "text-muted-foreground"
            )}
          />
        )}

        <div className="flex-1 min-w-0 mr-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-xs bg-background border border-canvas-selection rounded focus:outline-none shadow-sm text-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-xs font-medium truncate block">
              {displayName}
            </span>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            isSelected || isLocked || !isVisible
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <button
            onClick={handleToggleLock}
            className={cn(
              "p-1 rounded hover:bg-accent transition-colors",
              isLocked && "text-warning-foreground bg-warning/20 hover:bg-warning/30"
            )}
            title={isLocked ? "Unlock" : "Lock"}
          >
            {isLocked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <LockOpen className="w-3 h-3 text-muted-foreground" />
            )}
          </button>

          <button
            onClick={handleToggleVisibility}
            className="p-1 rounded hover:bg-accent transition-colors"
            title={isVisible ? "Hide" : "Show"}
          >
            {isVisible ? (
              <Eye className="w-3 h-3 text-muted-foreground" />
            ) : (
              <EyeOff className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {isDropTarget && dropPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-canvas-selection z-20" />
      )}

      {hasChildren && expanded && (
        <div>
          {box.children.map((childId) => {
            const childBox = getBox(childId);
            if (!childBox) return null;
            const childBoxLines = allLines.filter(
              (line) => line.parentId === childId
            );
            return (
              <LayerItem
                key={childId}
                box={childBox}
                depth={depth + 1}
                allBoxes={allBoxes}
                childLines={childBoxLines}
                allLines={allLines}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                dragState={dragState}
              />
            );
          })}

          {childLines.map((line) => (
            <LineLayerItem key={line.id} line={line} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
