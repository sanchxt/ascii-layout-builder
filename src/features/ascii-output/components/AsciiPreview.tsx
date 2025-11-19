import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, AlertCircle, Loader2 } from "lucide-react";
import { useAsciiGeneration } from "../hooks/useAsciiGeneration";
import { copyToClipboard } from "../utils/clipboard";
import {
  downloadAsciiAsMarkdown,
  downloadAsciiAsText,
} from "../utils/fileDownload";

export const AsciiPreview = () => {
  const { asciiOutput, isGenerating, error } = useAsciiGeneration();
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  const handleCopy = async () => {
    if (!asciiOutput) return;

    const success = await copyToClipboard(asciiOutput.content);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!asciiOutput) return;
    downloadAsciiAsMarkdown(asciiOutput.content);
    setDownloadMenuOpen(false);
  };

  const handleDownloadText = () => {
    if (!asciiOutput) return;
    downloadAsciiAsText(asciiOutput.content);
    setDownloadMenuOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
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
            onClick={handleCopy}
            disabled={!asciiOutput || isGenerating}
            title="Copy ASCII to clipboard"
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
              disabled={!asciiOutput || isGenerating}
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

        {!error && !asciiOutput && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm text-center">
            <p className="font-medium mb-1">No boxes to display</p>
            <p className="text-xs text-gray-400">
              Create a box on the canvas to see ASCII output
            </p>
          </div>
        )}

        {isGenerating && !asciiOutput && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {asciiOutput && (
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
      </div>
    </div>
  );
};
