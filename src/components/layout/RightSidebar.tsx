import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";

export const RightSidebar = () => {
  const placeholderAscii = `
┌─────────────────────┐
│   ASCII Preview     │
│                     │
│   Coming in         │
│   Phase 5           │
│                     │
└─────────────────────┘
`;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
      {/* header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
        <h2 className="font-semibold text-gray-900">ASCII Preview</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" disabled title="Copy ASCII">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled title="Download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* preview content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-600 whitespace-pre">
          {placeholderAscii}
        </div>
      </div>
    </div>
  );
};
