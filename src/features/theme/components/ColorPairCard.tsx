import { useState } from "react";
import { Check, AlertTriangle, X } from "lucide-react";
import {
  analyzeContrast,
  formatContrastRatio,
  oklchToHex,
  type ContrastLevel,
} from "../utils/colorContrast";
import { cn } from "@/lib/utils";

interface ColorPairCardProps {
  label: string;
  backgroundColor: string;
  foregroundColor: string;
  onBackgroundChange: (value: string) => void;
  onForegroundChange: (value: string) => void;
  disabled?: boolean;
  onColorClick?: (
    colorType: "background" | "foreground",
    currentValue: string
  ) => void;
}

function getContrastBadgeStyles(level: ContrastLevel) {
  switch (level) {
    case "AAA":
      return {
        bg: "bg-emerald-500/20",
        text: "text-emerald-600 dark:text-emerald-400",
        icon: Check,
      };
    case "AA":
      return {
        bg: "bg-amber-500/20",
        text: "text-amber-600 dark:text-amber-400",
        icon: Check,
      };
    case "fail":
      return {
        bg: "bg-red-500/20",
        text: "text-red-600 dark:text-red-400",
        icon: X,
      };
  }
}

export function ColorPairCard({
  label,
  backgroundColor,
  foregroundColor,
  onBackgroundChange: _onBackgroundChange,
  onForegroundChange: _onForegroundChange,
  disabled = false,
  onColorClick,
}: ColorPairCardProps) {
  const [hoveredColor, setHoveredColor] = useState<
    "background" | "foreground" | null
  >(null);

  const contrast = analyzeContrast(foregroundColor, backgroundColor);
  const badgeStyles = getContrastBadgeStyles(contrast.level);
  const BadgeIcon = badgeStyles.icon;

  const bgHex = oklchToHex(backgroundColor);
  const fgHex = oklchToHex(foregroundColor);

  const handleColorClick = (colorType: "background" | "foreground") => {
    if (disabled) return;
    const value =
      colorType === "background" ? backgroundColor : foregroundColor;
    onColorClick?.(colorType, value);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border p-3 transition-all",
        "hover:border-ring/50 hover:shadow-sm",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            badgeStyles.bg,
            badgeStyles.text
          )}
        >
          <BadgeIcon className="w-3 h-3" />
          <span>{contrast.level}</span>
          <span className="opacity-70">
            {formatContrastRatio(contrast.ratio)}
          </span>
        </div>
      </div>

      <div
        className="rounded-md p-3 mb-3 transition-colors"
        style={{ backgroundColor: bgHex }}
      >
        <span className="text-sm font-medium" style={{ color: fgHex }}>
          Sample Text
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleColorClick("background")}
          onMouseEnter={() => setHoveredColor("background")}
          onMouseLeave={() => setHoveredColor(null)}
          disabled={disabled}
          className={cn(
            "flex-1 flex items-center gap-2 p-2 rounded-md border transition-all",
            "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            hoveredColor === "background" && "border-ring shadow-sm",
            disabled && "cursor-not-allowed hover:border-border"
          )}
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="w-6 h-6 rounded border border-black/10 shrink-0 shadow-sm"
            style={{ backgroundColor: bgHex }}
          />
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[10px] text-muted-foreground">Background</div>
            <div className="text-xs font-mono text-foreground truncate">
              {bgHex}
            </div>
          </div>
        </button>

        <button
          onClick={() => handleColorClick("foreground")}
          onMouseEnter={() => setHoveredColor("foreground")}
          onMouseLeave={() => setHoveredColor(null)}
          disabled={disabled}
          className={cn(
            "flex-1 flex items-center gap-2 p-2 rounded-md border transition-all",
            "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            hoveredColor === "foreground" && "border-ring shadow-sm",
            disabled && "cursor-not-allowed hover:border-border"
          )}
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="w-6 h-6 rounded border border-black/10 shrink-0 shadow-sm"
            style={{ backgroundColor: fgHex }}
          />
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[10px] text-muted-foreground">Foreground</div>
            <div className="text-xs font-mono text-foreground truncate">
              {fgHex}
            </div>
          </div>
        </button>
      </div>

      {contrast.level === "fail" && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          <span>Low contrast may affect readability</span>
        </div>
      )}
    </div>
  );
}

interface SingleColorCardProps {
  label: string;
  color: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onColorClick?: (currentValue: string) => void;
}

export function SingleColorCard({
  label,
  color,
  onChange: _onChange,
  disabled = false,
  onColorClick,
}: SingleColorCardProps) {
  const hex = oklchToHex(color);

  return (
    <button
      onClick={() => !disabled && onColorClick?.(color)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border transition-all w-full",
        "hover:border-ring hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        disabled && "opacity-60 cursor-not-allowed hover:border-border"
      )}
    >
      <div
        className="w-8 h-8 rounded border border-black/10 shrink-0 shadow-sm"
        style={{ backgroundColor: hex }}
      />
      <div className="flex-1 min-w-0 text-left">
        <div className="text-xs font-medium text-foreground">{label}</div>
        <div className="text-xs font-mono text-muted-foreground">{hex}</div>
      </div>
    </button>
  );
}
