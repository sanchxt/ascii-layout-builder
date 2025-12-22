/**
 * Responsive Animation Panel Component
 *
 * Allows users to configure responsive animations based on
 * window breakpoints. Shows current breakpoint and allows
 * overriding animation properties per breakpoint.
 */

import { useState, useMemo, useEffect } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Settings2,
  ChevronDown,
  ChevronRight,
  Check,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_BREAKPOINTS,
  MOBILE_FIRST_BREAKPOINTS,
  getActiveBreakpoint,
  getBreakpointsForConfig,
  hasOverridesForBreakpoint,
  type Breakpoint,
  type ResponsiveAnimationConfig,
  type BreakpointName,
} from "../types/responsive";

interface ResponsiveAnimationPanelProps {
  config: ResponsiveAnimationConfig | null;
  onConfigChange: (updates: Partial<ResponsiveAnimationConfig>) => void;
  onCreateConfig: () => void;
  className?: string;
}

// Icons for breakpoints
const BREAKPOINT_ICONS: Record<string, typeof Monitor> = {
  xs: Smartphone,
  sm: Smartphone,
  mobile: Smartphone,
  md: Tablet,
  tablet: Tablet,
  lg: Monitor,
  desktop: Monitor,
  xl: Monitor,
  "2xl": Monitor,
};

function getBreakpointIcon(name: string) {
  return BREAKPOINT_ICONS[name] || Monitor;
}

export function ResponsiveAnimationPanel({
  config,
  onConfigChange,
  onCreateConfig,
  className,
}: ResponsiveAnimationPanelProps) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<string | null>(
    null
  );

  // Track window width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get current breakpoints
  const breakpoints = useMemo(() => {
    if (!config) return DEFAULT_BREAKPOINTS;
    return getBreakpointsForConfig(config);
  }, [config]);

  // Get active breakpoint
  const activeBreakpoint = useMemo(() => {
    return getActiveBreakpoint(windowWidth, breakpoints);
  }, [windowWidth, breakpoints]);

  // No config yet
  if (!config) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-500" />
          <span className="text-sm font-medium">Responsive Animations</span>
        </div>

        <div className="p-4 border border-dashed border-border rounded-md text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Info className="w-4 h-4" />
            <span className="text-xs">
              Configure different animations for different screen sizes
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={onCreateConfig}>
            <Settings2 className="w-3.5 h-3.5 mr-1.5" />
            Enable Responsive
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-500" />
          <span className="text-sm font-medium">Responsive Animations</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => onConfigChange({ enabled })}
          />
        </div>
      </div>

      {config.enabled && (
        <>
          {/* Current breakpoint indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-md">
            {activeBreakpoint && (
              <>
                {(() => {
                  const Icon = getBreakpointIcon(activeBreakpoint.name);
                  return <Icon className="w-4 h-4 text-cyan-500" />;
                })()}
                <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                  Current: {activeBreakpoint.label}
                </span>
                <span className="text-xs text-cyan-500/70 ml-auto">
                  {windowWidth}px
                </span>
              </>
            )}
          </div>

          {/* Breakpoint set selector */}
          <div className="space-y-2">
            <Label className="text-xs">Breakpoint Set</Label>
            <Select
              value={config.breakpointSet}
              onValueChange={(value) =>
                onConfigChange({
                  breakpointSet: value as "default" | "mobile-first" | "custom",
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default" className="text-xs">
                  Standard (xs → 2xl)
                </SelectItem>
                <SelectItem value="mobile-first" className="text-xs">
                  Mobile First (mobile/tablet/desktop)
                </SelectItem>
                <SelectItem value="custom" className="text-xs">
                  Custom Breakpoints
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Breakpoint list */}
          <div className="space-y-2">
            <Label className="text-xs">Breakpoints</Label>
            <div className="border border-border rounded-md overflow-hidden">
              {breakpoints.map((bp, index) => {
                const Icon = getBreakpointIcon(bp.name);
                const isActive = activeBreakpoint?.name === bp.name;
                const hasOverrides = hasOverridesForBreakpoint(config, bp.name);
                const isSelected = selectedBreakpoint === bp.name;

                return (
                  <div
                    key={bp.name}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
                      index > 0 && "border-t border-border",
                      isActive && "bg-cyan-500/5",
                      isSelected && "bg-muted",
                      !isSelected && !isActive && "hover:bg-muted/50"
                    )}
                    onClick={() =>
                      setSelectedBreakpoint(
                        isSelected ? null : bp.name
                      )
                    }
                  >
                    {/* Expand indicator */}
                    {isSelected ? (
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    )}

                    {/* Icon */}
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive ? "text-cyan-500" : "text-muted-foreground"
                      )}
                    />

                    {/* Name */}
                    <span
                      className={cn(
                        "text-xs flex-1",
                        isActive && "font-medium text-cyan-600 dark:text-cyan-400"
                      )}
                    >
                      {bp.label}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    )}

                    {/* Has overrides indicator */}
                    {hasOverrides && (
                      <div className="px-1.5 py-0.5 bg-cyan-500/20 rounded text-[9px] text-cyan-600 dark:text-cyan-400">
                        Modified
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected breakpoint details */}
          {selectedBreakpoint && (
            <BreakpointDetails
              breakpoint={breakpoints.find((bp) => bp.name === selectedBreakpoint)!}
              config={config}
              onConfigChange={onConfigChange}
            />
          )}

          {/* Info text */}
          <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>
              Configure different animation properties for each breakpoint.
              The active breakpoint is determined by the current window width.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Breakpoint detail panel
 */
function BreakpointDetails({
  breakpoint,
  config,
  onConfigChange,
}: {
  breakpoint: Breakpoint;
  config: ResponsiveAnimationConfig;
  onConfigChange: (updates: Partial<ResponsiveAnimationConfig>) => void;
}) {
  const stateOverrides = config.stateOverrides.filter(
    (o) => o.breakpoint === breakpoint.name
  );
  const transitionOverrides = config.transitionOverrides.filter(
    (o) => o.breakpoint === breakpoint.name
  );

  return (
    <div className="p-3 border border-border rounded-md bg-muted/20 space-y-3">
      <div className="flex items-center gap-2">
        {(() => {
          const Icon = getBreakpointIcon(breakpoint.name);
          return <Icon className="w-4 h-4 text-muted-foreground" />;
        })()}
        <span className="text-xs font-medium">{breakpoint.label}</span>
      </div>

      {/* Width range */}
      <div className="text-[10px] text-muted-foreground">
        {breakpoint.minWidth}px
        {breakpoint.maxWidth ? ` - ${breakpoint.maxWidth - 1}px` : "+"}
      </div>

      {/* Override counts */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-muted-foreground">
          {stateOverrides.length} state overrides
        </span>
        <span className="text-muted-foreground">
          {transitionOverrides.length} transition overrides
        </span>
      </div>

      {/* Placeholder for adding overrides */}
      {stateOverrides.length === 0 && transitionOverrides.length === 0 && (
        <div className="text-center py-2">
          <p className="text-[10px] text-muted-foreground mb-2">
            No overrides for this breakpoint
          </p>
          <Button variant="outline" size="sm" className="h-6 text-[10px]">
            Add Override
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact breakpoint indicator
 */
export function BreakpointIndicator({ className }: { className?: string }) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeBreakpoint = getActiveBreakpoint(windowWidth, DEFAULT_BREAKPOINTS);
  const Icon = activeBreakpoint
    ? getBreakpointIcon(activeBreakpoint.name)
    : Monitor;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs text-muted-foreground",
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{activeBreakpoint?.name || "?"}</span>
      <span className="text-[10px] opacity-60">{windowWidth}px</span>
    </div>
  );
}
