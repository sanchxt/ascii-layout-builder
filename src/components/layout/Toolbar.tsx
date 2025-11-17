import { Button } from "@/components/ui/button";
import { Save, Share2 } from "lucide-react";

export const Toolbar = () => {
  return (
    <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4">
      {/* left section - branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AL</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            ASCII Layout Builder
          </h1>
        </div>
      </div>

      {/* right section - actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
};
