import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, PanelRight } from "lucide-react";
import { LayoutToolbarMenu } from "@/features/commands/components/LayoutToolbarMenu";
import { useOutputDrawerStore } from "@/features/output-drawer/store/outputDrawerStore";
import { useSidebarUIStore } from "./store/sidebarUIStore";
import { usePanelState } from "@/lib/store/panelCoordinatorStore";
import { useIsDesktop } from "@/lib/useMediaQuery";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { ModeToggle } from "@/features/animation/components";
import { ToolbarOverflowMenu } from "./ToolbarOverflowMenu";
import { releases } from "@/features/releases/data/releases";
import { cn } from "@/lib/utils";

export const Toolbar = () => {
  const isDesktop = useIsDesktop();

  // Desktop state from stores (for usePanelState)
  const desktopOutputOpen = useOutputDrawerStore((state) => state.isOpen);
  const desktopOutputOpen_ = useOutputDrawerStore((state) => state.open);
  const desktopOutputClose = useOutputDrawerStore((state) => state.close);

  const desktopSidebarOpen = useSidebarUIStore((state) => state.rightSidebarOpen);
  const setDesktopSidebarOpen = useSidebarUIStore((state) => state.setRightSidebarOpen);

  // Unified panel states via coordinator
  const { isOpen: isOutputOpen, toggle: toggleOutput } = usePanelState(
    "outputDrawer",
    isDesktop,
    desktopOutputOpen,
    (open) => open ? desktopOutputOpen_() : desktopOutputClose()
  );

  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = usePanelState(
    "rightSidebar",
    isDesktop,
    desktopSidebarOpen,
    setDesktopSidebarOpen
  );

  return (
    <header className="h-12 border-b border-border bg-card flex items-center px-3 z-50 relative">
      {/* LEFT SECTION - Logo, Layout Menu */}
      <div className="flex items-center gap-2 min-w-0 shrink">
        {/* Logo */}
        <div className="flex items-center gap-1.5 text-foreground shrink-0">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">W</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border hidden sm:block shrink-0" />

        {/* Layout Menu */}
        <div className="hidden sm:block shrink-0">
          <LayoutToolbarMenu />
        </div>

        {/* Document Title - only on larger screens */}
        <div className="hidden lg:flex items-center gap-2 ml-2">
          <div className="h-5 w-px bg-border shrink-0" />
          <input
            type="text"
            defaultValue="Untitled Layout"
            className="text-sm font-medium text-foreground bg-transparent border-none focus:ring-0 p-0 h-auto hover:text-primary transition-colors cursor-pointer truncate max-w-[160px]"
          />
        </div>
      </div>

      {/* CENTER SECTION - Mode Toggle */}
      <div className="flex-1 flex justify-center">
        <div className="hidden sm:block">
          <ModeToggle />
        </div>
      </div>

      {/* RIGHT SECTION - Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Version Badge */}
        <Link
          to="/releases"
          className={cn(
            "flex items-center h-7 px-2 rounded-md text-xs font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            "hidden sm:flex"
          )}
          title="View release notes"
        >
          v{releases[0].version}
        </Link>

        {/* Output Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleOutput}
          className={cn(
            "h-8 transition-colors hidden sm:flex",
            isOutputOpen
              ? "text-primary bg-accent hover:bg-accent/80"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Toggle Output Panel (Cmd+/)"
        >
          <Code2 className="h-4 w-4" />
          <span className="hidden md:inline ml-1.5 text-xs">Output</span>
        </Button>

        {/* Sidebar Toggle - visible on mobile/tablet only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "h-8 w-8 lg:hidden transition-colors",
            isSidebarOpen
              ? "text-primary bg-accent hover:bg-accent/80"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <PanelRight className="h-4 w-4" />
        </Button>

        {/* Overflow Menu */}
        <ToolbarOverflowMenu />
      </div>
    </header>
  );
};
