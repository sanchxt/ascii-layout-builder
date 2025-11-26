import { Toolbar } from "./Toolbar";
import { RightSidebar } from "./RightSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-zinc-50 text-zinc-900 font-sans">
      <Toolbar />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas Area (Children includes the floating LeftSidebar) */}
        <div className="flex-1 relative h-full w-full overflow-hidden">
          {children}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
};
