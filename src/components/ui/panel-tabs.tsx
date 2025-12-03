import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  badge?: number | string;
}

interface PanelTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children?: ReactNode;
}

export const PanelTabs = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}: PanelTabsProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-2 py-1.5 bg-muted/50 border-b border-border">
        <div className="flex gap-0.5 p-0.5 bg-secondary/80 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md",
                "text-xs font-medium transition-all duration-150",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    activeTab === tab.id
                      ? "bg-accent text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
};

interface TabPanelProps {
  isActive: boolean;
  children: ReactNode;
}

export const TabPanel = ({ isActive, children }: TabPanelProps) => {
  if (!isActive) return null;

  return (
    <div className="h-full animate-in fade-in duration-150">{children}</div>
  );
};
