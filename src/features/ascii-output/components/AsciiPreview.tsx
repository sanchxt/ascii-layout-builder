import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Download,
  Check,
  AlertCircle,
  Loader2,
  Layers,
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

type ViewMode = "canvas" | "artboard" | "all-artboards";

export const AsciiPreview = () => {
  const artboards = useArtboardStore((state) => state.artboards);
  const getArtboard = useArtboardStore((state) => state.getArtboard);

  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [selectedArtboardId, setSelectedArtboardId] = useState<string | null>(
    null
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

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

  const currentArtboard = selectedArtboardId
    ? getArtboard(selectedArtboardId)
    : null;

  const handleViewChange = (value: string) => {
    if (value === "canvas") {
      setViewMode("canvas");
      setSelectedArtboardId(null);
    } else if (value === "all-artboards") {
      setViewMode("all-artboards");
      setSelectedArtboardId(null);
    } else {
      setViewMode("artboard");
      setSelectedArtboardId(value);
    }
  };

  const handleCopy = async () => {
    if (!asciiOutput) return;

    const success = await copyToClipboard(asciiOutput.content);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleCopyAll = async () => {
    const success = await copyToClipboard(
      allArtboardsGeneration.formattedOutput
    );
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    const content = isAllArtboards
      ? allArtboardsGeneration.formattedOutput
      : asciiOutput?.content;

    if (!content) return;
    downloadAsciiAsMarkdown(content);
    setDownloadMenuOpen(false);
  };

  const handleDownloadText = () => {
    const content = isAllArtboards
      ? allArtboardsGeneration.formattedOutput
      : asciiOutput?.content;

    if (!content) return;
    downloadAsciiAsText(content);
    setDownloadMenuOpen(false);
  };

  const displayName = isAllArtboards
    ? "All Artboards"
    : currentArtboard
    ? currentArtboard.name
    : "All Canvas";

  const hasContent = isAllArtboards
    ? allArtboardsGeneration.formattedOutput
    : asciiOutput;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 flex flex-col p-4 shrink-0 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">ASCII Preview</h2>
            {isGenerating && (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={isAllArtboards ? handleCopyAll : handleCopy}
              disabled={!hasContent || isGenerating}
              title={
                isAllArtboards
                  ? "Copy all artboards"
                  : "Copy ASCII to clipboard"
              }
            >
              {copySuccess ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                disabled={!hasContent || isGenerating}
                title="Download ASCII"
              >
                <Download className="h-4 w-4" />
              </Button>
              {downloadMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={handleDownloadMarkdown}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-md"
                  >
                    as .md
                  </button>
                  <button
                    onClick={handleDownloadText}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 last:rounded-b-md"
                  >
                    as .txt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Select
          value={
            viewMode === "canvas"
              ? "canvas"
              : viewMode === "all-artboards"
              ? "all-artboards"
              : selectedArtboardId || "canvas"
          }
          onValueChange={handleViewChange}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Select view" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="canvas">All Canvas</SelectItem>
            {artboards.length > 0 && (
              <>
                <SelectItem value="all-artboards">All Artboards</SelectItem>
                <div className="h-px bg-gray-200 my-1" />
                {artboards.map((artboard) => (
                  <SelectItem key={artboard.id} value={artboard.id}>
                    {artboard.name} ({artboard.width}×{artboard.height})
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        <div className="text-xs text-gray-600">
          Viewing: <span className="font-medium">{displayName}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Generation Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!error && !hasContent && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm text-center">
            <p className="font-medium mb-1">No content to display</p>
            <p className="text-xs text-gray-400">
              {isAllArtboards
                ? "Create artboards and add boxes to see ASCII output"
                : "Create boxes to see ASCII output"}
            </p>
          </div>
        )}

        {isGenerating && !hasContent && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!isAllArtboards && asciiOutput && (
          <div className="space-y-3">
            {asciiOutput.warnings.length > 0 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <p className="font-medium mb-1">Warnings:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {asciiOutput.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-800 whitespace-pre overflow-x-auto overflow-y-auto max-h-96">
              {asciiOutput.content}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
              <div className="flex gap-4">
                <span>
                  {asciiOutput.dimensions.width} ×{" "}
                  {asciiOutput.dimensions.height} chars
                </span>
                <span>{asciiOutput.boxCount} boxes</span>
              </div>
              <span>
                {asciiOutput.lineCount} lines, {asciiOutput.characterCount}{" "}
                chars
              </span>
            </div>
          </div>
        )}

        {isAllArtboards && allArtboardsGeneration.formattedOutput && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Multiple Artboards</p>
              <p className="text-xs text-blue-700">
                Showing ASCII output for{" "}
                {allArtboardsGeneration.artboardOutputs.size} artboard(s)
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-800 whitespace-pre overflow-x-auto overflow-y-auto max-h-96">
              {allArtboardsGeneration.formattedOutput}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
              <span>
                {allArtboardsGeneration.artboardOutputs.size} artboard(s)
                generated
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
