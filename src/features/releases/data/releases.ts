import type { Release } from "../types/release";

export const releases: Release[] = [
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
