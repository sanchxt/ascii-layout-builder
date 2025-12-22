import { useState } from "react";
import { Copy, Check, Download, Code, FileText, Palette } from "lucide-react";
import { useCodeGeneration } from "../hooks/useCodeGeneration";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
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

function getLanguageForTab(tab: CodeTab): string {
  switch (tab) {
    case "html":
      return "html";
    case "css":
      return "css";
    case "tailwind":
      return "html"; // HTML with Tailwind classes
  }
}

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
    <div className="h-full flex flex-col bg-card">
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

      <div className="flex-1 overflow-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
            <Code className="w-8 h-8 mb-2" />
            <p className="text-sm text-center">
              No code to display.
              <br />
              Create some boxes to see generated code.
            </p>
          </div>
        ) : (
          <SyntaxHighlighter
            code={currentContent}
            language={getLanguageForTab(activeTab)}
            showLineNumbers={true}
            maxHeight="100%"
            className="h-full rounded-none"
          />
        )}
      </div>

      {!isEmpty && (
        <div className="px-4 py-2 border-t border-border bg-muted text-[10px] text-muted-foreground">
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
