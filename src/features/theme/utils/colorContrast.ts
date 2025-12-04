export type ContrastLevel = "AAA" | "AA" | "fail";

export interface ContrastResult {
  ratio: number;
  level: ContrastLevel;
  passes: {
    normalText: boolean;
    largeText: boolean;
    uiComponents: boolean;
  };
}

function oklchToRgb(oklch: string): { r: number; g: number; b: number } {
  const match = oklch.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/
  );

  if (!match) {
    if (oklch.startsWith("#")) {
      const r = parseInt(oklch.slice(1, 3), 16) / 255;
      const g = parseInt(oklch.slice(3, 5), 16) / 255;
      const b = parseInt(oklch.slice(5, 7), 16) / 255;
      return { r, g, b };
    }
    return { r: 0.5, g: 0.5, b: 0.5 };
  }

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

  const a = c * Math.cos((h * Math.PI) / 180);
  const bVal = c * Math.sin((h * Math.PI) / 180);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * bVal;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bVal;
  const s_ = l - 0.0894841775 * a - 1.291485548 * bVal;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let b = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  r =
    r > 0.0031308
      ? 1.055 * Math.pow(Math.max(0, r), 1 / 2.4) - 0.055
      : 12.92 * r;
  g =
    g > 0.0031308
      ? 1.055 * Math.pow(Math.max(0, g), 1 / 2.4) - 0.055
      : 12.92 * g;
  b =
    b > 0.0031308
      ? 1.055 * Math.pow(Math.max(0, b), 1 / 2.4) - 0.055
      : 12.92 * b;

  return {
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, b)),
  };
}

function getRelativeLuminance(rgb: {
  r: number;
  g: number;
  b: number;
}): number {
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = oklchToRgb(color1);
  const rgb2 = oklchToRgb(color2);

  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
}

export function analyzeContrast(
  foreground: string,
  background: string
): ContrastResult {
  const ratio = calculateContrastRatio(foreground, background);

  return {
    ratio,
    level: getContrastLevel(ratio),
    passes: {
      normalText: ratio >= 4.5,
      largeText: ratio >= 3,
      uiComponents: ratio >= 3,
    },
  };
}

export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(1)}:1`;
}

export function oklchToHex(oklch: string): string {
  const rgb = oklchToRgb(oklch);

  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const linearR = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  const linearG = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  const linearB = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  const l_ = Math.cbrt(
    0.4122214708 * linearR + 0.5363325363 * linearG + 0.0514459929 * linearB
  );
  const m_ = Math.cbrt(
    0.2119034982 * linearR + 0.6806995451 * linearG + 0.1073969566 * linearB
  );
  const s_ = Math.cbrt(
    0.0883024619 * linearR + 0.2817188376 * linearG + 0.6299787005 * linearB
  );

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.sqrt(a * a + bVal * bVal);
  let h = (Math.atan2(bVal, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return `oklch(${L.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}
