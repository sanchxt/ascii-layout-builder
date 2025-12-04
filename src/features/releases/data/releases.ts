import type { Release } from "../types/release";

export const releases: Release[] = [
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
