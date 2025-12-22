/**
 * Animation Presets
 *
 * Pre-defined animation effects that can be quickly applied to elements.
 */

import type { AnimationPreset } from "../types/presets";

/**
 * Fade presets
 */
const fadePresets: AnimationPreset[] = [
  {
    id: "fade-in",
    name: "Fade In",
    category: "fade",
    description: "Fade from invisible to visible",
    fromProperties: { opacity: 0 },
    toProperties: { opacity: 1 },
    suggestedEasing: "ease-out",
    suggestedDuration: 300,
  },
  {
    id: "fade-out",
    name: "Fade Out",
    category: "fade",
    description: "Fade from visible to invisible",
    fromProperties: { opacity: 1 },
    toProperties: { opacity: 0 },
    suggestedEasing: "ease-in",
    suggestedDuration: 300,
  },
];

/**
 * Slide presets
 */
const slidePresets: AnimationPreset[] = [
  {
    id: "slide-up",
    name: "Slide Up",
    category: "slide",
    description: "Slide in from below",
    fromProperties: { translateY: 20, opacity: 0 },
    toProperties: { translateY: 0, opacity: 1 },
    suggestedEasing: "ease-out",
    suggestedDuration: 400,
  },
  {
    id: "slide-down",
    name: "Slide Down",
    category: "slide",
    description: "Slide in from above",
    fromProperties: { translateY: -20, opacity: 0 },
    toProperties: { translateY: 0, opacity: 1 },
    suggestedEasing: "ease-out",
    suggestedDuration: 400,
  },
  {
    id: "slide-left",
    name: "Slide Left",
    category: "slide",
    description: "Slide in from the right",
    fromProperties: { translateX: 20, opacity: 0 },
    toProperties: { translateX: 0, opacity: 1 },
    suggestedEasing: "ease-out",
    suggestedDuration: 400,
  },
  {
    id: "slide-right",
    name: "Slide Right",
    category: "slide",
    description: "Slide in from the left",
    fromProperties: { translateX: -20, opacity: 0 },
    toProperties: { translateX: 0, opacity: 1 },
    suggestedEasing: "ease-out",
    suggestedDuration: 400,
  },
];

/**
 * Scale presets
 */
const scalePresets: AnimationPreset[] = [
  {
    id: "scale-in",
    name: "Scale In",
    category: "scale",
    description: "Scale up from smaller size",
    fromProperties: { scale: 0.8, opacity: 0 },
    toProperties: { scale: 1, opacity: 1 },
    suggestedEasing: "ease-out",
    suggestedDuration: 300,
  },
  {
    id: "scale-out",
    name: "Scale Out",
    category: "scale",
    description: "Scale down to smaller size",
    fromProperties: { scale: 1, opacity: 1 },
    toProperties: { scale: 0.8, opacity: 0 },
    suggestedEasing: "ease-in",
    suggestedDuration: 300,
  },
  {
    id: "scale-up",
    name: "Scale Up",
    category: "scale",
    description: "Scale up to larger size",
    fromProperties: { scale: 1 },
    toProperties: { scale: 1.1 },
    suggestedEasing: "ease-out",
    suggestedDuration: 200,
  },
];

/**
 * Bounce presets
 * Note: Uses ease-in-out as the easing, actual bounce effect
 * would need custom cubic-bezier in implementation
 */
const bouncePresets: AnimationPreset[] = [
  {
    id: "bounce-in",
    name: "Bounce In",
    category: "bounce",
    description: "Bounce in with overshoot",
    fromProperties: { scale: 0.3, opacity: 0 },
    toProperties: { scale: 1, opacity: 1 },
    suggestedEasing: "ease-out",
    suggestedDuration: 500,
  },
  {
    id: "bounce-out",
    name: "Bounce Out",
    category: "bounce",
    description: "Bounce out with anticipation",
    fromProperties: { scale: 1, opacity: 1 },
    toProperties: { scale: 0.3, opacity: 0 },
    suggestedEasing: "ease-in",
    suggestedDuration: 500,
  },
];

/**
 * All animation presets
 */
export const ANIMATION_PRESETS: AnimationPreset[] = [
  ...fadePresets,
  ...slidePresets,
  ...scalePresets,
  ...bouncePresets,
];

/**
 * Get presets by category
 */
export function getPresetsByCategory(
  category: AnimationPreset["category"]
): AnimationPreset[] {
  return ANIMATION_PRESETS.filter((p) => p.category === category);
}

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): AnimationPreset | undefined {
  return ANIMATION_PRESETS.find((p) => p.id === id);
}

/**
 * Get all preset categories
 */
export const PRESET_CATEGORIES: Array<{
  id: AnimationPreset["category"];
  name: string;
}> = [
  { id: "fade", name: "Fade" },
  { id: "slide", name: "Slide" },
  { id: "scale", name: "Scale" },
  { id: "bounce", name: "Bounce" },
];
