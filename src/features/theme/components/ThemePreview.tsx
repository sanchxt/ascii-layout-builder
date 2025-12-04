import { cn } from "@/lib/utils";

interface ThemePreviewProps {
  className?: string;
}

export function ThemePreview({ className }: ThemePreviewProps) {
  return (
    <div className={cn("select-none", className)}>
      <div
        className="rounded-lg border p-4 space-y-4"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--card-foreground)" }}
          >
            Preview Card
          </h3>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            See how your theme looks in real-time
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            Primary
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--secondary-foreground)",
            }}
          >
            Secondary
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors"
            style={{
              backgroundColor: "transparent",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            Outline
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{
              backgroundColor: "var(--destructive)",
              color: "#fff",
            }}
          >
            Delete
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="Input placeholder..."
            readOnly
            className="w-full px-3 py-2 text-xs rounded-md border transition-colors focus:outline-none"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--input)",
              color: "var(--foreground)",
            }}
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="font-medium hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Accent link
          </a>
          <span style={{ color: "var(--border)" }}>|</span>
          <span style={{ color: "var(--muted-foreground)" }}>Muted text</span>
          <span style={{ color: "var(--border)" }}>|</span>
          <span style={{ color: "var(--foreground)" }}>Normal text</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 text-[10px] font-medium rounded-full"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            Accent badge
          </span>
          <span
            className="px-2 py-0.5 text-[10px] font-medium rounded-full"
            style={{
              backgroundColor: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            Muted badge
          </span>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <p
            className="text-[10px] mb-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Focus ring preview:
          </p>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-md border ring-2 ring-offset-2"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
              // @ts-expect-error CSS variable
              "--tw-ring-color": "var(--ring)",
              "--tw-ring-offset-color": "var(--background)",
            }}
          >
            Focused element
          </button>
        </div>
      </div>

      <div
        className="mt-3 rounded-lg border p-3 shadow-lg"
        style={{
          backgroundColor: "var(--popover)",
          borderColor: "var(--border)",
        }}
      >
        <p
          className="text-xs font-medium"
          style={{ color: "var(--popover-foreground)" }}
        >
          Popover / Dropdown
        </p>
        <p
          className="text-[10px] mt-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          This shows how tooltips and dropdowns appear.
        </p>
      </div>
    </div>
  );
}
