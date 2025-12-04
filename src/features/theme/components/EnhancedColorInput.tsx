import { useState, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { Copy, Check, Pipette } from "lucide-react";
import { oklchToHex, hexToOklch } from "../utils/colorContrast";
import { cn } from "@/lib/utils";

interface EnhancedColorInputProps {
  value: string;
  onChange: (value: string) => void;
  recentColors?: string[];
  onColorUsed?: (color: string) => void;
  label?: string;
}

const isEyeDropperSupported =
  typeof window !== "undefined" && "EyeDropper" in window;

export function EnhancedColorInput({
  value,
  onChange,
  recentColors = [],
  onColorUsed,
  label,
}: EnhancedColorInputProps) {
  const [hexValue, setHexValue] = useState(() => oklchToHex(value));
  const [copied, setCopied] = useState(false);
  const [isPickingColor, setIsPickingColor] = useState(false);

  useEffect(() => {
    setHexValue(oklchToHex(value));
  }, [value]);

  const handleColorChange = useCallback(
    (newHex: string) => {
      setHexValue(newHex);
      const oklch = hexToOklch(newHex);
      onChange(oklch);
    },
    [onChange]
  );

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newHex = e.target.value;

    if (newHex && !newHex.startsWith("#")) {
      newHex = "#" + newHex;
    }

    setHexValue(newHex);

    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
      const oklch = hexToOklch(newHex);
      onChange(oklch);
      onColorUsed?.(oklch);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hexValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = hexValue;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleEyeDropper = async () => {
    if (!isEyeDropperSupported) return;

    try {
      setIsPickingColor(true);
      // @ts-expect-error EyeDropper API not in ts types
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex;
      setHexValue(hex);
      const oklch = hexToOklch(hex);
      onChange(oklch);
      onColorUsed?.(oklch);
    } catch {
    } finally {
      setIsPickingColor(false);
    }
  };

  const handleRecentColorClick = (color: string) => {
    const hex = oklchToHex(color);
    setHexValue(hex);
    onChange(color);
    onColorUsed?.(color);
  };

  const handlePickerChange = (hex: string) => {
    handleColorChange(hex);
  };

  const handlePickerBlur = () => {
    onColorUsed?.(value);
  };

  return (
    <div className="space-y-4">
      {label && (
        <div className="text-sm font-medium text-foreground">{label}</div>
      )}

      <div
        className="relative"
        onMouseUp={handlePickerBlur}
        onTouchEnd={handlePickerBlur}
      >
        <HexColorPicker
          color={hexValue}
          onChange={handlePickerChange}
          style={{ width: "100%", height: "160px" }}
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-black/10 shadow-sm"
            style={{ backgroundColor: hexValue }}
          />
          <input
            type="text"
            value={hexValue}
            onChange={handleHexInput}
            className={cn(
              "w-full pl-10 pr-3 py-2 text-sm font-mono rounded-md border border-input",
              "bg-background text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            )}
            placeholder="#000000"
          />
        </div>

        <button
          onClick={handleCopy}
          className={cn(
            "px-3 py-2 rounded-md border border-input transition-all",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            copied && "bg-emerald-500/20 border-emerald-500/50 text-emerald-600"
          )}
          title="Copy hex value"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {isEyeDropperSupported && (
          <button
            onClick={handleEyeDropper}
            disabled={isPickingColor}
            className={cn(
              "px-3 py-2 rounded-md border border-input transition-all",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isPickingColor && "bg-primary/20 border-primary/50"
            )}
            title="Pick color from screen"
          >
            <Pipette className="w-4 h-4" />
          </button>
        )}
      </div>

      {recentColors.length > 0 && (
        <div>
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Recent Colors
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {recentColors.slice(0, 8).map((color, index) => {
              const hex = oklchToHex(color);
              const isActive = hex.toLowerCase() === hexValue.toLowerCase();

              return (
                <button
                  key={`${hex}-${index}`}
                  onClick={() => handleRecentColorClick(color)}
                  className={cn(
                    "w-7 h-7 rounded border-2 transition-all",
                    "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    isActive
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-black/10"
                  )}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1.5">
        <div className="truncate">OKLCH: {value}</div>
      </div>
    </div>
  );
}
