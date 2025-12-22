import { LayoutGrid, ChevronDown, Columns, Grid, Rows } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LAYOUT_PRESETS } from "@/features/layout-system/types/layout";
import { useLayoutGeneration } from "@/features/layout-system/hooks/useLayoutGeneration";
import { useCommandStore } from "../store/commandStore";
import { cn } from "@/lib/utils";

export function LayoutToolbarMenu() {
  const { executeLayoutCommand, canGenerateLayout, getLayoutTarget } =
    useLayoutGeneration();

  const handlePresetClick = (preset: (typeof LAYOUT_PRESETS)[number]) => {
    let command: string;
    if (preset.config.type === "flex") {
      command = `flex ${preset.config.direction} ${preset.childCount}`;
    } else if (preset.config.type === "grid") {
      command = `grid ${preset.config.columns}x${preset.config.rows}`;
    } else {
      return;
    }

    const result = executeLayoutCommand(command);
    if (!result.success) {
      console.warn(result.error);
    }
  };

  const target = getLayoutTarget();
  const hasTarget = canGenerateLayout();
  const flexPresets = LAYOUT_PRESETS.filter((p) => p.config.type === "flex");
  const gridPresets = LAYOUT_PRESETS.filter((p) => p.config.type === "grid");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasTarget}
          className={cn(
            "gap-1.5 text-sm",
            !hasTarget && "opacity-50 cursor-not-allowed"
          )}
          title={
            hasTarget
              ? "Add layout to selection"
              : "Select a box or artboard first"
          }
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Layout</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Target:{" "}
          <span className="font-medium text-foreground">
            {target.type === "box"
              ? "Selected Box"
              : target.type === "artboard"
              ? "Active Artboard"
              : "None"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs uppercase tracking-wide">
            Flex
          </DropdownMenuLabel>
          {flexPresets.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
            >
              {preset.config.type === "flex" &&
              preset.config.direction === "row" ? (
                <Columns className="w-4 h-4" />
              ) : (
                <Rows className="w-4 h-4" />
              )}
              <span className="flex-1">{preset.name}</span>
              <span className="text-xs text-muted-foreground">
                {preset.childCount} items
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs uppercase tracking-wide">
            Grid
          </DropdownMenuLabel>
          {gridPresets.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
            >
              <Grid className="w-4 h-4" />
              <span className="flex-1">{preset.name}</span>
              <span className="text-xs text-muted-foreground">
                {preset.childCount} items
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            const { open, setQuery } = useCommandStore.getState();
            open();
            setQuery("flex ");
          }}
          className="text-primary"
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Custom layout...</span>
          <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
