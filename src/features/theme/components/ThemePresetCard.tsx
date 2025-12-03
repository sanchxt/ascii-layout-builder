import { Moon, Check } from "lucide-react";
import type { ThemePreset } from "../types/theme";
import { cn } from "@/lib/utils";

interface ThemePresetCardProps {
  theme: ThemePreset;
  isActive: boolean;
  onClick: () => void;
}

export function ThemePresetCard({
  theme,
  isActive,
  onClick,
}: ThemePresetCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
        "hover:border-ring hover:shadow-sm",
        isActive
          ? "border-primary bg-accent shadow-sm"
          : "border-border bg-card"
      )}
      title={theme.description}
    >
      <div
        className="w-full h-8 rounded overflow-hidden border border-border/50"
        style={{
          background: `linear-gradient(to right, ${theme.colors.background} 0%, ${theme.colors.background} 50%, ${theme.colors.foreground} 50%, ${theme.colors.foreground} 100%)`,
        }}
      >
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: theme.colors.primary }}
        />
      </div>

      <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
        {theme.name}
      </span>

      {isActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      )}

      {theme.isDark && (
        <div className="absolute top-1 left-1">
          <Moon className="w-2.5 h-2.5 text-muted-foreground" />
        </div>
      )}
    </button>
  );
}
