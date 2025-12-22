import { Layers, Play, Eye } from "lucide-react";
import { useAnimationStore } from "../store/animationStore";
import type { EditorMode } from "../types/animation";
import { cn } from "@/lib/utils";

const modes: {
  id: EditorMode;
  icon: typeof Layers;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "layout",
    icon: Layers,
    label: "Layout",
    shortLabel: "L",
    description: "Edit box positions, sizes, and properties",
  },
  {
    id: "animation",
    icon: Play,
    label: "Animate",
    shortLabel: "A",
    description: "Configure animation states and transitions",
  },
  {
    id: "preview",
    icon: Eye,
    label: "Preview",
    shortLabel: "P",
    description: "Test animations by interacting with elements",
  },
];

export const ModeToggle = () => {
  const editorMode = useAnimationStore((state) => state.editorMode);
  const setEditorMode = useAnimationStore((state) => state.setEditorMode);

  return (
    <div className="flex gap-0.5 p-0.5 bg-secondary/80 rounded-md">
      {modes.map(({ id, icon: Icon, label, description }) => {
        const isActive = editorMode === id;
        const isPreview = id === "preview";

        return (
          <button
            key={id}
            onClick={() => setEditorMode(id)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all duration-150",
              isActive
                ? isPreview
                  ? "bg-violet-500/20 text-violet-600 dark:text-violet-400 shadow-sm ring-1 ring-violet-500/30"
                  : "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            title={description}
          >
            <Icon
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                isActive && isPreview && "animate-pulse"
              )}
            />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Compact mode indicator for mobile/toolbar overflow
 */
export const ModeIndicator = () => {
  const editorMode = useAnimationStore((state) => state.editorMode);
  const mode = modes.find((m) => m.id === editorMode);

  if (!mode) return null;

  const Icon = mode.icon;
  const isPreview = editorMode === "preview";

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
        isPreview
          ? "bg-violet-500/20 text-violet-600 dark:text-violet-400"
          : "bg-muted text-muted-foreground"
      )}
      title={mode.description}
    >
      <Icon className="w-3 h-3" />
      <span>{mode.shortLabel}</span>
    </div>
  );
};
