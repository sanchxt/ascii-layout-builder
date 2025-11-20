import type {
  ArtboardPreset,
  ArtboardPresetsMap,
  ArtboardDimensions,
} from "@/types/artboard";
import { ARTBOARD_CONSTANTS } from "@/lib/constants";

export const ARTBOARD_PRESETS: ArtboardPresetsMap = {
  mobile: {
    name: "Mobile",
    dimensions: { width: 375, height: 667 },
    description: "iPhone SE / 8 (375*667)",
  },
  tablet: {
    name: "Tablet",
    dimensions: { width: 768, height: 1024 },
    description: "iPad (768*1024)",
  },
  desktop: {
    name: "Desktop",
    dimensions: { width: 1440, height: 900 },
    description: "Desktop (1440*900)",
  },
};

export function getPresetDimensions(
  preset: ArtboardPreset
): ArtboardDimensions {
  if (preset === "custom") {
    return ARTBOARD_CONSTANTS.PRESETS.desktop;
  }

  return ARTBOARD_PRESETS[preset].dimensions;
}

export function getPresetName(preset: ArtboardPreset): string {
  if (preset === "custom") {
    return "Custom";
  }

  return ARTBOARD_PRESETS[preset].name;
}

export function getPresetDescription(preset: ArtboardPreset): string {
  if (preset === "custom") {
    return "Custom artboard size";
  }

  return ARTBOARD_PRESETS[preset].description;
}

export function matchPreset(
  width: number,
  height: number
): ArtboardPreset | null {
  for (const [key, config] of Object.entries(ARTBOARD_PRESETS)) {
    if (
      config.dimensions.width === width &&
      config.dimensions.height === height
    ) {
      return key as Exclude<ArtboardPreset, "custom">;
    }
  }

  return null;
}

export function getAllPresets(): Array<{
  preset: Exclude<ArtboardPreset, "custom">;
  name: string;
  dimensions: ArtboardDimensions;
  description: string;
}> {
  return Object.entries(ARTBOARD_PRESETS).map(([key, config]) => ({
    preset: key as Exclude<ArtboardPreset, "custom">,
    name: config.name,
    dimensions: config.dimensions,
    description: config.description,
  }));
}
