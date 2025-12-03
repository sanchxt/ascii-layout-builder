import { useState, useRef, useEffect } from "react";
import { Minus, Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import type { Line } from "@/types/line";
import { useLineStore } from "../store/lineStore";
import { cn } from "@/lib/utils";

interface LineLayerItemProps {
  line: Line;
  depth: number;
}

export const LineLayerItem = ({ line, depth }: LineLayerItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLineIds = useLineStore((state) => state.selectedLineIds);
  const selectLine = useLineStore((state) => state.selectLine);
  const toggleLineLock = useLineStore((state) => state.toggleLineLock);
  const updateLine = useLineStore((state) => state.updateLine);

  const isSelected = selectedLineIds.includes(line.id);
  const isVisible = line.visible !== false;
  const isLocked = line.locked === true;

  const getDisplayName = () => {
    if (line.name) return line.name;
    if (line.label?.text) {
      const truncated = line.label.text.trim().slice(0, 20);
      return truncated || `Line ${line.id.slice(0, 4)}`;
    }
    const directionLabel = line.direction === "horizontal" ? "H" : "V";
    return `${directionLabel}-Line ${line.id.slice(0, 4)}`;
  };

  const displayName = getDisplayName();

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(line.name || "");
    setIsEditing(true);
  };

  const handleEditComplete = () => {
    if (editValue.trim()) {
      updateLine(line.id, { name: editValue.trim() });
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
    selectLine(line.id, e.shiftKey || e.metaKey || e.ctrlKey);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateLine(line.id, { visible: !isVisible });
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLineLock(line.id);
  };

  return (
    <div className="select-none relative">
      {depth > 0 && (
        <div
          className="absolute top-0 bottom-0 border-l border-border"
          style={{ left: `${depth * 16 + 11}px` }}
        />
      )}

      <div
        className={cn(
          "group flex items-center h-9 pr-2 cursor-pointer transition-colors relative border-b border-transparent",
          isSelected
            ? "bg-canvas-selection-bg text-canvas-selection"
            : "hover:bg-muted text-foreground",
          !isVisible && "opacity-50"
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0 mr-1" />

        <Minus
          className={cn(
            "w-3.5 h-3.5 mr-2 shrink-0 -rotate-45",
            isSelected ? "text-canvas-selection" : "text-muted-foreground"
          )}
        />

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
    </div>
  );
};
