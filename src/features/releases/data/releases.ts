import type { Release } from "../types/release";

export const releases: Release[] = [
  {
    version: "0.2.0",
    date: "Dec 13, 2025",
    changes: [
      {
        text: "Redesigned toolbar with responsive flexbox layout, overflow menu for mobile, and proper theme color support",
        category: "feature",
      },
      {
        text: "Fully responsive layout: toggle-able right sidebar on mobile/tablet, full-screen output drawer on mobile, compact tool palette and canvas controls",
        category: "feature",
      },
      {
        text: "Artboards can now be selected via click or drag-to-select rectangle",
        category: "fix",
      },
      {
        text: "Empty canvas tip no longer shows when artboards are present",
        category: "fix",
      },
      {
        text: "Fixed State Editor and Output drawer positioning below toolbar with visible headers and close buttons, unified drawer widths (300px)",
        category: "fix",
      },
      {
        text: "Interactive canvas minimap in ASCII preview panel with click-to-navigate",
        category: "feature",
      },
      {
        text: "ASCII output now uses adaptive scaling for small nested boxes and correctly positions nested elements",
        category: "fix",
      },
      {
        text: "Overhauled code generation: removed hardcoded absolute positioning for clean reusable output, added semantic HTML text formatting (bold, italic, code, color), font size support, grid/flex child properties, and lines in HTML output",
        category: "improvement",
      },
      {
        text: "Theme-aware syntax highlighting for Code and Animation tabs - colors automatically adapt to light/dark mode and custom themes",
        category: "feature",
      },
      {
        text: "Simplified layout with compact left sidebar (tools + canvas toggles) and cleaner toolbar",
        category: "improvement",
      },
    ],
  },
  {
    version: "0.1.11",
    date: "Dec 7, 2025",
    changes: [
      {
        text: "Lines can now be re-parented via drag-drop in the Layers panel",
        category: "feature",
      },
      {
        text: "Fixed line nesting into nested boxes - lines now correctly nest in the target child box instead of ancestors",
        category: "fix",
      },
    ],
  },
  {
    version: "0.1.10",
    date: "Dec 7, 2025",
    changes: [
      {
        text: "Click zoom percentage to input a custom value (10-500%)",
        category: "feature",
      },
      {
        text: "Redesigned command palette (Ctrl+K) with unified search, visual layout cards, and 40+ commands",
        category: "feature",
      },
      {
        text: "Selection context bar showing quick actions (Group, Align, Delete) when items are selected",
        category: "feature",
      },
      {
        text: "Fuzzy search with smart ranking and recent commands tracking",
        category: "improvement",
      },
      {
        text: "Consistent mouse wheel zoom (5% per notch) with smoother trackpad support",
        category: "fix",
      },
      {
        text: "Lines now appear on top of boxes when dragging onto drop zones",
        category: "fix",
      },
      {
        text: "Output drawer (ASCII & Code panels) now respects theme colors",
        category: "fix",
      },
    ],
  },
  {
    version: "0.1.9",
    date: "Dec 4, 2025",
    changes: [
      {
        text: "Fullscreen Theme Editor with live UI preview and WCAG contrast ratios",
        category: "feature",
      },
      {
        text: "Enhanced color picker with eyedropper, hex input, and recent colors",
        category: "feature",
      },
      {
        text: "Theme dropdown now will not close when switching between Light/Dark/System modes. Sorry for the inconvenience :)",
        category: "fix",
      },
      {
        text: "Releases page now uses theme colors and includes theme toggle",
        category: "fix",
      },
      {
        text: "Mode aware theme filtering: Light/Dark modes show only matching presets",
        category: "improvement",
      },
    ],
  },
  {
    version: "0.1.8",
    date: "Dec 3, 2025",
    changes: [
      {
        text: "Theme system with 6 presets (Light, Dark, High Contrast, Midnight Blue, Warm Sepia, Forest)",
        category: "feature",
      },
      {
        text: "Custom theme builder with full color customization",
        category: "feature",
      },
      {
        text: "Theme toggle in toolbar with quick preset switching",
        category: "feature",
      },
    ],
  },
  {
    version: "0.1.7",
    date: "Dec 2, 2025",
    changes: [
      {
        text: "Lines tool for drawing horizontal and vertical connectors",
        category: "feature",
      },
      {
        text: "Line nesting inside boxes with depth indicators",
        category: "feature",
      },
      {
        text: "Empty canvas on first load (no auto created artboard)",
        category: "change",
      },
      {
        text: "Smoother trackpad pinch-to-zoom with proportional sensitivity",
        category: "fix",
      },
    ],
  },
  {
    version: "0.1.6",
    date: "Nov 29, 2025",
    changes: [
      {
        text: "Slide-over drawer for ASCII Preview & Code Output",
        category: "feature",
      },
      {
        text: "Dedicated Layout sub-panel for Flex/Grid settings",
        category: "feature",
      },
      {
        text: "Compact layout section in Properties with quick toggle",
        category: "improvement",
      },
      {
        text: "Streamlined right sidebar (Navigator + Properties only)",
        category: "improvement",
      },
      {
        text: "Output toggle button in toolbar",
        category: "improvement",
      },
      {
        text: "Release notes badge alignment",
        category: "fix",
      },
    ],
  },
  {
    version: "0.1.5",
    date: "Nov 28, 2025",
    changes: [
      {
        text: "Flex and grid layout system for containers",
        category: "feature",
      },
      {
        text: "Code generation (HTML, CSS, Tailwind)'s MVP",
        category: "feature",
      },
      { text: "Command palette (Cmd/Ctrl+K)", category: "feature" },
      {
        text: "Inline commands for quick layout creation",
        category: "feature",
      },
      { text: "Visual layout indicators on boxes", category: "feature" },
      {
        text: "Improved CSS constraints and validation to handle flex & grid layouts",
        category: "improvement",
      },
      {
        text: "Right sidebar's spacing between sections",
        category: "breaking",
      },
    ],
  },
];
