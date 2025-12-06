import { useState } from "react";
import {
  Copy,
  Download,
  Check,
  AlertCircle,
  Loader2,
  Grid3X3,
  Layers,
  FileText,
} from "lucide-react";
import {
  useAsciiGeneration,
  useAllArtboardsAsciiGeneration,
} from "../hooks/useAsciiGeneration";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import { copyToClipboard } from "../utils/clipboard";
import {
  downloadAsciiAsMarkdown,
  downloadAsciiAsText,
} from "../utils/fileDownload";
import { cn } from "@/lib/utils";

type ViewMode = "canvas" | "artboard" | "all-artboards";

export const AsciiPreviewContent = () => {
  const artboards = useArtboardStore((state) => state.artboards);

  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [selectedArtboardId, setSelectedArtboardId] = useState<string | null>(
    null
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const canvasGeneration = useAsciiGeneration(
    undefined,
    viewMode === "artboard" ? selectedArtboardId : null
  );
  const allArtboardsGeneration = useAllArtboardsAsciiGeneration();

  const isAllArtboards = viewMode === "all-artboards";
  const asciiOutput = isAllArtboards ? null : canvasGeneration.asciiOutput;
  const isGenerating = isAllArtboards
    ? allArtboardsGeneration.isGenerating
    : canvasGeneration.isGenerating;
  const error = isAllArtboards
    ? allArtboardsGeneration.error
    : canvasGeneration.error;

  const hasContent = isAllArtboards
    ? allArtboardsGeneration.formattedOutput
    : asciiOutput;

  const handleCopy = async () => {
    const content = isAllArtboards
      ? allArtboardsGeneration.formattedOutput
      : asciiOutput?.content;

    if (!content) return;

    const success = await copyToClipboard(content);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = (format: "md" | "txt") => {
    const content = isAllArtboards
      ? allArtboardsGeneration.formattedOutput
      : asciiOutput?.content;

    if (!content) return;

    if (format === "md") {
      downloadAsciiAsMarkdown(content);
    } else {
      downloadAsciiAsText(content);
    }
    setShowDownloadMenu(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-0.5 p-0.5 bg-muted rounded-lg">
            <button
              onClick={() => {
                setViewMode("canvas");
                setSelectedArtboardId(null);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                viewMode === "canvas"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="All Canvas"
            >
              <Grid3X3 className="w-3 h-3" />
              <span>Canvas</span>
            </button>
            {artboards.length > 0 && (
              <button
                onClick={() => {
                  setViewMode("all-artboards");
                  setSelectedArtboardId(null);
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                  viewMode === "all-artboards"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="All Artboards"
              >
                <Layers className="w-3 h-3" />
                <span>All</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handleCopy}
              disabled={!hasContent || isGenerating}
              className={cn(
                "p-1.5 rounded-md transition-all",
                "hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed",
                copySuccess && "bg-canvas-valid/10 text-canvas-valid"
              )}
              title="Copy to clipboard"
            >
              {copySuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={!hasContent || isGenerating}
                className="p-1.5 rounded-md hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Download"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {showDownloadMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDownloadMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-20 py-1 min-w-[100px]">
                    <button
                      onClick={() => handleDownload("md")}
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent flex items-center gap-2"
                    >
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      .md
                    </button>
                    <button
                      onClick={() => handleDownload("txt")}
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent flex items-center gap-2"
                    >
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      .txt
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {artboards.length > 0 && viewMode !== "all-artboards" && (
          <div className="mt-2">
            <select
              value={
                viewMode === "artboard" ? selectedArtboardId || "" : "canvas"
              }
              onChange={(e) => {
                if (e.target.value === "canvas") {
                  setViewMode("canvas");
                  setSelectedArtboardId(null);
                } else {
                  setViewMode("artboard");
                  setSelectedArtboardId(e.target.value);
                }
              }}
              className="w-full px-2 py-1.5 text-xs bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="canvas">Entire Canvas</option>
              {artboards.map((artboard) => (
                <option key={artboard.id} value={artboard.id}>
                  {artboard.name} ({artboard.width}×{artboard.height})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3">
        {error && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-destructive text-[10px]">{error}</p>
            </div>
          </div>
        )}

        {!error && !hasContent && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-2">
              <Grid3X3 className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              No content
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Create boxes to see ASCII output
            </p>
          </div>
        )}

        {isGenerating && !hasContent && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-muted-foreground/50 animate-spin" />
          </div>
        )}

        {!isAllArtboards && asciiOutput && (
          <div className="space-y-2">
            {asciiOutput.warnings.length > 0 && (
              <div className="p-2 bg-warning border border-warning/50 rounded-md text-[10px] text-warning-foreground">
                {asciiOutput.warnings.map((warning, i) => (
                  <p key={i}>{warning}</p>
                ))}
              </div>
            )}

            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                backgroundImage: `radial-gradient(circle, var(--border) 1px, transparent 1px)`,
                backgroundSize: "8px 8px",
              }}
            >
              <pre className="p-3 font-mono text-[10px] leading-tight text-foreground overflow-x-auto whitespace-pre bg-card/90">
                {asciiOutput.content}
              </pre>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>
                {asciiOutput.dimensions.width}×{asciiOutput.dimensions.height}
              </span>
              <span>
                {asciiOutput.lineCount}L · {asciiOutput.characterCount}C
              </span>
            </div>
          </div>
        )}

        {isAllArtboards && allArtboardsGeneration.formattedOutput && (
          <div className="space-y-2">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-md text-[10px] text-primary">
              {allArtboardsGeneration.artboardOutputs.size} artboard(s)
            </div>

            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                backgroundImage: `radial-gradient(circle, var(--border) 1px, transparent 1px)`,
                backgroundSize: "8px 8px",
              }}
            >
              <pre className="p-3 font-mono text-[10px] leading-tight text-foreground overflow-x-auto whitespace-pre bg-card/90">
                {allArtboardsGeneration.formattedOutput}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
