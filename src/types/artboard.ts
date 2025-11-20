export type ArtboardPreset = "mobile" | "tablet" | "desktop" | "custom";

export interface Artboard {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  preset: ArtboardPreset;
  backgroundColor?: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface ArtboardDimensions {
  width: number;
  height: number;
}

export interface ArtboardPresetConfig {
  name: string;
  dimensions: ArtboardDimensions;
  description: string;
}

export type ArtboardPresetsMap = Record<
  Exclude<ArtboardPreset, "custom">,
  ArtboardPresetConfig
>;
