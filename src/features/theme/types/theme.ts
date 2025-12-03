export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
  background: string;
  foreground: string;

  card: string;
  cardForeground: string;

  popover: string;
  popoverForeground: string;

  primary: string;
  primaryForeground: string;

  secondary: string;
  secondaryForeground: string;

  muted: string;
  mutedForeground: string;

  accent: string;
  accentForeground: string;

  destructive: string;

  border: string;
  input: string;
  ring: string;

  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  colors: ThemeColors;
}

export interface CustomTheme extends ThemePreset {
  isCustom: true;
  createdAt: number;
  updatedAt: number;
}

export type Theme = ThemePreset | CustomTheme;

export function isCustomTheme(theme: Theme): theme is CustomTheme {
  return "isCustom" in theme && theme.isCustom === true;
}

export const THEME_COLOR_KEYS: (keyof ThemeColors)[] = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "border",
  "input",
  "ring",
  "sidebar",
  "sidebarForeground",
  "sidebarPrimary",
  "sidebarPrimaryForeground",
  "sidebarAccent",
  "sidebarAccentForeground",
  "sidebarBorder",
  "sidebarRing",
];

export const COLOR_TO_CSS_VAR: Record<keyof ThemeColors, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
};

export const COLOR_GROUPS = {
  core: ["background", "foreground", "primary", "primaryForeground"] as const,
  ui: [
    "secondary",
    "secondaryForeground",
    "muted",
    "mutedForeground",
    "accent",
    "accentForeground",
  ] as const,
  components: [
    "card",
    "cardForeground",
    "popover",
    "popoverForeground",
    "border",
    "input",
    "ring",
  ] as const,
  sidebar: [
    "sidebar",
    "sidebarForeground",
    "sidebarPrimary",
    "sidebarPrimaryForeground",
    "sidebarAccent",
    "sidebarAccentForeground",
    "sidebarBorder",
    "sidebarRing",
  ] as const,
  special: ["destructive"] as const,
};

export const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  background: "Background",
  foreground: "Text",
  card: "Card Background",
  cardForeground: "Card Text",
  popover: "Popover Background",
  popoverForeground: "Popover Text",
  primary: "Primary",
  primaryForeground: "Primary Text",
  secondary: "Secondary",
  secondaryForeground: "Secondary Text",
  muted: "Muted",
  mutedForeground: "Muted Text",
  accent: "Accent",
  accentForeground: "Accent Text",
  destructive: "Destructive",
  border: "Border",
  input: "Input",
  ring: "Focus Ring",
  sidebar: "Sidebar",
  sidebarForeground: "Sidebar Text",
  sidebarPrimary: "Sidebar Primary",
  sidebarPrimaryForeground: "Sidebar Primary Text",
  sidebarAccent: "Sidebar Accent",
  sidebarAccentForeground: "Sidebar Accent Text",
  sidebarBorder: "Sidebar Border",
  sidebarRing: "Sidebar Ring",
};
