import { useState, useEffect, useMemo } from "react";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import {
  generateAscii,
  canGenerateAscii,
  generateAllArtboards,
  formatMultipleArtboards,
} from "../lib/asciiGenerator";
import type { AsciiOutput, AsciiGenerationOptions } from "../types/ascii";
import { ASCII_CONSTANTS } from "@/lib/constants";

export function useAsciiGeneration(
  options?: AsciiGenerationOptions,
  artboardId?: string | null
): {
  asciiOutput: AsciiOutput | null;
  isGenerating: boolean;
  error: string | null;
  canGenerate: boolean;
  regenerate: () => void;
} {
  const boxes = useBoxStore((state) => state.boxes);
  const lines = useLineStore((state) => state.lines);
  const getArtboard = useArtboardStore((state) => state.getArtboard);
  const [asciiOutput, setAsciiOutput] = useState<AsciiOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const artboard = artboardId ? getArtboard(artboardId) : undefined;

  const relevantBoxes = useMemo(() => {
    if (!artboardId) return boxes;
    return boxes.filter((box) => box.artboardId === artboardId);
  }, [boxes, artboardId]);

  const relevantLines = useMemo(() => {
    if (!artboardId) return lines;
    return lines.filter((line) => line.artboardId === artboardId);
  }, [lines, artboardId]);

  const generationCheck = useMemo(() => {
    return canGenerateAscii(boxes);
  }, [boxes]);

  useEffect(() => {
    setIsGenerating(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        if (boxes.length === 0 && lines.length === 0) {
          setAsciiOutput(null);
          setError(null);
          setIsGenerating(false);
          return;
        }

        if (boxes.length > 0 && !generationCheck.canGenerate) {
          setError(generationCheck.reason ?? "Cannot generate ASCII");
          setAsciiOutput(null);
          setIsGenerating(false);
          return;
        }

        const output = generateAscii(boxes, options, artboard, lines);

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
  }, [
    relevantBoxes,
    relevantLines,
    boxes.length,
    lines.length,
    options,
    generationCheck,
    artboard,
  ]);

  const regenerate = () => {
    try {
      setIsGenerating(true);
      setError(null);

      if (boxes.length === 0 && lines.length === 0) {
        setAsciiOutput(null);
        setError(null);
        return;
      }

      if (boxes.length > 0 && !generationCheck.canGenerate) {
        setError(generationCheck.reason ?? "Cannot generate ASCII");
        setAsciiOutput(null);
        return;
      }

      const output = generateAscii(boxes, options, artboard, lines);
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
  scale: "compact" | "normal" | "spacious" = "normal",
  artboardId?: string | null
): ReturnType<typeof useAsciiGeneration> {
  const ratios = {
    compact: { charWidthRatio: 1.5, charHeightRatio: 2.5 },
    normal: { charWidthRatio: 2, charHeightRatio: 3 },
    spacious: { charWidthRatio: 3, charHeightRatio: 4 },
  };

  return useAsciiGeneration(ratios[scale], artboardId);
}

export function useArtboardAsciiGeneration(
  artboardId: string | null,
  options?: AsciiGenerationOptions
): ReturnType<typeof useAsciiGeneration> {
  return useAsciiGeneration(options, artboardId);
}

export function useAllArtboardsAsciiGeneration(
  options?: AsciiGenerationOptions
): {
  artboardOutputs: Map<string, AsciiOutput>;
  formattedOutput: string;
  isGenerating: boolean;
  error: string | null;
  regenerate: () => void;
} {
  const boxes = useBoxStore((state) => state.boxes);
  const lines = useLineStore((state) => state.lines);
  const artboards = useArtboardStore((state) => state.artboards);
  const [artboardOutputs, setArtboardOutputs] = useState<
    Map<string, AsciiOutput>
  >(new Map());
  const [formattedOutput, setFormattedOutput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsGenerating(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        if (artboards.length === 0) {
          setArtboardOutputs(new Map());
          setFormattedOutput(
            "// No artboards found - create an artboard to see ASCII output!"
          );
          setIsGenerating(false);
          return;
        }

        const outputs = generateAllArtboards(artboards, boxes, options, lines);
        const formatted = formatMultipleArtboards(outputs, artboards);

        setArtboardOutputs(outputs);
        setFormattedOutput(formatted);
        setError(null);
      } catch (err) {
        console.error("ASCII Generation Error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate ASCII for artboards"
        );
        setArtboardOutputs(new Map());
        setFormattedOutput("");
      } finally {
        setIsGenerating(false);
      }
    }, ASCII_CONSTANTS.GENERATION_DEBOUNCE);

    return () => {
      clearTimeout(timer);
    };
  }, [boxes, lines, artboards, options]);

  const regenerate = () => {
    try {
      setIsGenerating(true);
      setError(null);

      if (artboards.length === 0) {
        setArtboardOutputs(new Map());
        setFormattedOutput(
          "// No artboards found - create an artboard to see ASCII output!"
        );
        return;
      }

      const outputs = generateAllArtboards(artboards, boxes, options, lines);
      const formatted = formatMultipleArtboards(outputs, artboards);

      setArtboardOutputs(outputs);
      setFormattedOutput(formatted);
      setError(null);
    } catch (err) {
      console.error("ASCII Generation Error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate ASCII for artboards"
      );
      setArtboardOutputs(new Map());
      setFormattedOutput("");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    artboardOutputs,
    formattedOutput,
    isGenerating,
    error,
    regenerate,
  };
}
