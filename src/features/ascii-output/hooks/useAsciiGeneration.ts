import { useState, useEffect, useMemo } from "react";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { generateAscii, canGenerateAscii } from "../lib/asciiGenerator";
import type { AsciiOutput, AsciiGenerationOptions } from "../types/ascii";
import { ASCII_CONSTANTS } from "@/lib/constants";

export function useAsciiGeneration(options?: AsciiGenerationOptions): {
  asciiOutput: AsciiOutput | null;
  isGenerating: boolean;
  error: string | null;
  canGenerate: boolean;
  regenerate: () => void;
} {
  const boxes = useBoxStore((state) => state.boxes);
  const [asciiOutput, setAsciiOutput] = useState<AsciiOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generationCheck = useMemo(() => {
    return canGenerateAscii(boxes);
  }, [boxes]);

  useEffect(() => {
    setIsGenerating(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        if (boxes.length === 0) {
          setAsciiOutput(null);
          setError(null);
          setIsGenerating(false);
          return;
        }

        if (!generationCheck.canGenerate) {
          setError(generationCheck.reason ?? "Cannot generate ASCII");
          setAsciiOutput(null);
          setIsGenerating(false);
          return;
        }

        const output = generateAscii(boxes, options);

        if (output.warnings.length > 0) {
          console.warn("ASCII Generation Warnings:", output.warnings);
        }

        setAsciiOutput(output);
        setError(null);
      } catch (err) {
        console.error("ASCII Generation Error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to generate ASCII"
        );
        setAsciiOutput(null);
      } finally {
        setIsGenerating(false);
      }
    }, ASCII_CONSTANTS.GENERATION_DEBOUNCE);

    return () => {
      clearTimeout(timer);
    };
  }, [boxes, options, generationCheck]);

  const regenerate = () => {
    try {
      setIsGenerating(true);
      setError(null);

      if (boxes.length === 0) {
        setAsciiOutput(null);
        setError(null);
        return;
      }

      if (!generationCheck.canGenerate) {
        setError(generationCheck.reason ?? "Cannot generate ASCII");
        setAsciiOutput(null);
        return;
      }

      const output = generateAscii(boxes, options);
      setAsciiOutput(output);
      setError(null);
    } catch (err) {
      console.error("ASCII Generation Error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate ASCII");
      setAsciiOutput(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    asciiOutput,
    isGenerating,
    error,
    canGenerate: generationCheck.canGenerate,
    regenerate,
  };
}

export function useAsciiGenerationWithScale(
  scale: "compact" | "normal" | "spacious" = "normal"
): ReturnType<typeof useAsciiGeneration> {
  const ratios = {
    compact: { charWidthRatio: 1.5, charHeightRatio: 2.5 },
    normal: { charWidthRatio: 2, charHeightRatio: 3 },
    spacious: { charWidthRatio: 3, charHeightRatio: 4 },
  };

  return useAsciiGeneration(ratios[scale]);
}
