import { useState } from "react";
import { Copy, Check, Download, Code, FileText, Palette } from "lucide-react";
import { useCodeGeneration } from "../hooks/useCodeGeneration";
import { cn } from "@/lib/utils";

type CodeTab = "html" | "css" | "tailwind";

const TAB_CONFIG: { id: CodeTab; label: string; icon: React.ReactNode }[] = [
  { id: "html", label: "HTML", icon: <Code className="w-3.5 h-3.5" /> },
  { id: "css", label: "CSS", icon: <FileText className="w-3.5 h-3.5" /> },
  {
    id: "tailwind",
    label: "Tailwind",
    icon: <Palette className="w-3.5 h-3.5" />,
  },
];

export function CodePreview() {
  const [activeTab, setActiveTab] = useState<CodeTab>("tailwind");
  const [copied, setCopied] = useState(false);
  const { output, copyToClipboard } = useCodeGeneration();

  const handleCopy = async () => {
    const success = await copyToClipboard(activeTab);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const content = output[activeTab];
    const extension = activeTab === "tailwind" ? "html" : activeTab;
    const mimeType = activeTab === "css" ? "text/css" : "text/html";

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `layout.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentContent = output[activeTab];
  const isEmpty = !currentContent.trim();

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center border-b border-zinc-200">
        <div className="flex-1 flex">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "text-blue-600 border-blue-600"
                  : "text-zinc-500 border-transparent hover:text-zinc-700"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 px-2">
          <button
            onClick={handleCopy}
            disabled={isEmpty}
            className={cn(
              "p-1.5 rounded transition-colors",
              isEmpty
                ? "text-zinc-300 cursor-not-allowed"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
            )}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
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
                ? "text-zinc-300 cursor-not-allowed"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
            )}
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-4">
            <Code className="w-8 h-8 mb-2" />
            <p className="text-sm text-center">
              No code to display.
              <br />
              Create some boxes to see generated code.
            </p>
          </div>
        ) : (
          <pre className="p-4 text-xs font-mono text-zinc-700 whitespace-pre-wrap break-words">
            {currentContent}
          </pre>
        )}
      </div>

      {!isEmpty && (
        <div className="px-4 py-2 border-t border-zinc-200 bg-zinc-50 text-[10px] text-zinc-500">
          {activeTab === "tailwind" && (
            <span>HTML with Tailwind CSS classes</span>
          )}
          {activeTab === "html" && (
            <span>HTML structure (use with CSS file)</span>
          )}
          {activeTab === "css" && <span>CSS styles (use with HTML file)</span>}
        </div>
      )}
    </div>
  );
}
