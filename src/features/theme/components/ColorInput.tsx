import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function oklchToHex(oklch: string): string {
  const match = oklch.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/
  );

  if (!match) {
    if (oklch.startsWith("#")) return oklch;
    return "#888888";
  }

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  bl = bl > 0.0031308 ? 1.055 * Math.pow(bl, 1 / 2.4) - 0.055 : 12.92 * bl;

  r = Math.round(Math.max(0, Math.min(1, r)) * 255);
  g = Math.round(Math.max(0, Math.min(1, g)) * 255);
  bl = Math.round(Math.max(0, Math.min(1, bl)) * 255);

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

function hexToOklch(hex: string): string {
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

export function ColorInput({
  label,
  value,
  onChange,
  disabled = false,
}: ColorInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexValue, setHexValue] = useState(() => oklchToHex(value));
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setHexValue(oklchToHex(value));
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleColorChange = (newHex: string) => {
    setHexValue(newHex);
    const oklch = hexToOklch(newHex);
    onChange(oklch);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    setHexValue(newHex);

    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
      const oklch = hexToOklch(newHex);
      onChange(oklch);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 truncate">
        {label}
      </span>
      <div className="relative flex-1 flex items-center gap-1.5">
        <button
          ref={buttonRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-6 h-6 rounded border border-border shrink-0 transition-transform",
            "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            disabled && "opacity-50 cursor-not-allowed hover:scale-100"
          )}
          style={{ backgroundColor: hexValue }}
          title={`Edit ${label}`}
        />
        <input
          type="text"
          value={hexValue}
          onChange={handleHexInput}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-0 px-2 py-1 text-xs font-mono rounded border border-border bg-background",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        {isOpen && !disabled && (
          <div
            ref={popoverRef}
            className="absolute left-0 top-full mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50"
          >
            <HexColorPicker color={hexValue} onChange={handleColorChange} />
          </div>
        )}
      </div>
    </div>
  );
}
