/**
 * AnimationOutputPanel Component
 * UI for displaying and exporting animation code in various formats
 */

import { useState } from "react";
import { Copy, Check, Download, Layers, ArrowRight, Play } from "lucide-react";
import { useAnimationOutput } from "../hooks/useAnimationOutput";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import { cn } from "@/lib/utils";
import type { AnimationOutputFormat } from "../types/animationOutput";

type AnimationTab = AnimationOutputFormat;

const TAB_CONFIG: { id: AnimationTab; label: string; description: string }[] = [
  { id: "css", label: "CSS", description: "CSS transitions & keyframes" },
  { id: "framer-motion", label: "Framer", description: "Framer Motion variants" },
  { id: "gsap", label: "GSAP", description: "GSAP timeline animation" },
];

interface AnimationOutputPanelProps {
  /** Artboard ID to filter output */
  artboardId?: string;
  /** Additional class name */
  className?: string;
}

export function AnimationOutputPanel({
  artboardId,
  className,
}: AnimationOutputPanelProps) {
  const [activeTab, setActiveTab] = useState<AnimationTab>("css");
  const [copied, setCopied] = useState(false);

  const {
    output,
    copyToClipboard,
    downloadAsFile,
    hasAnimations,
    statesCount,
    transitionsCount,
    elementsCount,
  } = useAnimationOutput({ artboardId });

  const handleCopy = async () => {
    const success = await copyToClipboard(activeTab);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadAsFile(activeTab);
  };

  // Get current output based on active tab
  const getCurrentOutput = () => {
    switch (activeTab) {
      case "css":
        return output.css;
      case "framer-motion":
        return output.framerMotion;
      case "gsap":
        return output.gsap;
      case "tailwind":
        return output.tailwind;
      case "orchestration":
        return output.orchestration;
      default:
        return output.css;
    }
  };

  const currentOutput = getCurrentOutput();
  const isEmpty = !currentOutput.code.trim();

  return (
    <div className={cn("h-full flex flex-col bg-card", className)}>
      {/* Tab bar with format selection */}
      <div className="flex items-center border-b border-border">
        <div className="flex-1 flex">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
              title={tab.description}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={handleCopy}
            disabled={isEmpty}
            className={cn(
              "p-1.5 rounded transition-colors",
              isEmpty
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-canvas-valid" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={isEmpty}
            className={cn(
              "p-1.5 rounded transition-colors",
              isEmpty
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {!hasAnimations ? (
          <EmptyState />
        ) : isEmpty ? (
          <NoChangesState />
        ) : (
          <SyntaxHighlighter
            code={currentOutput.code}
            language={currentOutput.language}
            showLineNumbers={true}
            maxHeight="100%"
            className="h-full rounded-none"
          />
        )}
      </div>

      {/* Footer with stats */}
      {hasAnimations && !isEmpty && (
        <div className="px-4 py-2 border-t border-border bg-muted">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {statesCount} states
              </span>
              <span className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                {transitionsCount} transitions
              </span>
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {elementsCount} elements
              </span>
            </div>
            <span className="text-muted-foreground/70">
              {getFormatDescription(activeTab)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state when no animations exist
 */
function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
      <Play className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm text-center font-medium">No animations</p>
      <p className="text-xs text-center mt-1 opacity-70">
        Switch to animation mode and create
        <br />
        states to generate animation code.
      </p>
    </div>
  );
}

/**
 * State when animations exist but no changes detected
 */
function NoChangesState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
      <ArrowRight className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm text-center font-medium">No transitions</p>
      <p className="text-xs text-center mt-1 opacity-70">
        Create transitions between states
        <br />
        to generate animation code.
      </p>
    </div>
  );
}

/**
 * Get description for current format
 */
function getFormatDescription(format: AnimationTab): string {
  switch (format) {
    case "css":
      return "CSS transitions & keyframes";
    case "framer-motion":
      return "React with Framer Motion";
    case "gsap":
      return "GSAP Timeline";
    case "tailwind":
      return "React with Tailwind CSS";
    case "orchestration":
      return "Framework-agnostic state machine";
    default:
      return "Animation code";
  }
}
