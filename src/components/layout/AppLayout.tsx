import { Toolbar } from "./Toolbar";
import { RightSidebar } from "./RightSidebar";
import { ThemeEditorModal } from "@/features/theme/components/ThemeEditorModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground font-sans">
      <Toolbar />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative h-full w-full overflow-hidden">
          {children}
        </div>

        <RightSidebar />
      </div>

      <ThemeEditorModal />
    </div>
  );
};
