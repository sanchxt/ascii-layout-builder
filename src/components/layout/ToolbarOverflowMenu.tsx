import {
  MoreHorizontal,
  Undo2,
  Redo2,
  Layers,
  Play,
  Code2,
  Save,
  Share2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useAnimationStore } from "@/features/animation/store/animationStore";
import { useOutputDrawerStore } from "@/features/output-drawer/store/outputDrawerStore";
import { useCommandStore } from "@/features/commands/store/commandStore";
import { usePanelState } from "@/lib/store/panelCoordinatorStore";
import { useIsDesktop } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

export function ToolbarOverflowMenu() {
  const isDesktop = useIsDesktop();
  const editorMode = useAnimationStore((s) => s.editorMode);
  const setEditorMode = useAnimationStore((s) => s.setEditorMode);
  const openCommandPalette = useCommandStore((s) => s.open);

  // Desktop state from store (for usePanelState)
  const desktopOutputOpen = useOutputDrawerStore((s) => s.isOpen);
  const desktopOutputOpen_ = useOutputDrawerStore((s) => s.open);
  const desktopOutputClose = useOutputDrawerStore((s) => s.close);

  // Unified panel state via coordinator
  const { isOpen: isOutputOpen, toggle: toggleOutput } = usePanelState(
    "outputDrawer",
    isDesktop,
    desktopOutputOpen,
    (open) => open ? desktopOutputOpen_() : desktopOutputClose()
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground lg:hidden"
          title="More actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Editor Mode</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setEditorMode("layout")}
            className={cn(editorMode === "layout" && "bg-accent")}
          >
            <Layers className="h-4 w-4" />
            <span>Layout Mode</span>
            {editorMode === "layout" && (
              <span className="ml-auto text-xs text-primary">Active</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setEditorMode("animation")}
            className={cn(editorMode === "animation" && "bg-accent")}
          >
            <Play className="h-4 w-4" />
            <span>Animate Mode</span>
            {editorMode === "animation" && (
              <span className="ml-auto text-xs text-primary">Active</span>
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Edit</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <Undo2 className="h-4 w-4" />
            <span>Undo</span>
            <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Redo2 className="h-4 w-4" />
            <span>Redo</span>
            <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => openCommandPalette()}>
            <LayoutGrid className="h-4 w-4" />
            <span>Command Palette</span>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleOutput}>
            <Code2 className="h-4 w-4" />
            <span>{isOutputOpen ? "Hide Output" : "Show Output"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Save className="h-4 w-4" />
            <span>Save</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2 className="h-4 w-4" />
            <span>Export</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
