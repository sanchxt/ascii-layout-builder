import { useMemo } from "react";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import { useLineStore } from "@/features/lines/store/lineStore";
import { useArtboardStore } from "@/features/artboards/store/artboardStore";
import type { CodeOutput, CodeGeneratorOptions } from "../types/code";
import { DEFAULT_CODE_OPTIONS } from "../types/code";
import { generateHTML } from "../lib/htmlGenerator";
import { generateCSS } from "../lib/cssGenerator";
import { generateTailwind } from "../lib/tailwindGenerator";

interface UseCodeGenerationReturn {
  output: CodeOutput;

  generateForArtboard: (artboardId: string) => CodeOutput;

  generateAll: () => CodeOutput;

  copyToClipboard: (type: keyof CodeOutput) => Promise<boolean>;
}

export function useCodeGeneration(
  options: CodeGeneratorOptions = DEFAULT_CODE_OPTIONS
): UseCodeGenerationReturn {
  const boxes = useBoxStore((state) => state.boxes);
  const lines = useLineStore((state) => state.lines);
  const activeArtboardId = useArtboardStore((state) => state.activeArtboardId);
  const getArtboard = useArtboardStore((state) => state.getArtboard);

  const opts = { ...DEFAULT_CODE_OPTIONS, ...options };

  const output = useMemo<CodeOutput>(() => {
    const artboard = activeArtboardId
      ? getArtboard(activeArtboardId)
      : undefined;

    return {
      html: generateHTML(boxes, artboard, opts),
      css: generateCSS(boxes, artboard, opts),
      tailwind: generateTailwind(boxes, artboard, opts, lines),
    };
  }, [boxes, lines, activeArtboardId, getArtboard, opts]);

  const generateForArtboard = (artboardId: string): CodeOutput => {
    const artboard = getArtboard(artboardId);
    if (!artboard) {
      return { html: "", css: "", tailwind: "" };
    }

    return {
      html: generateHTML(boxes, artboard, opts),
      css: generateCSS(boxes, artboard, opts),
      tailwind: generateTailwind(boxes, artboard, opts, lines),
    };
  };

  const generateAll = (): CodeOutput => {
    return {
      html: generateHTML(boxes, undefined, opts),
      css: generateCSS(boxes, undefined, opts),
      tailwind: generateTailwind(boxes, undefined, opts, lines),
    };
  };

  const copyToClipboard = async (type: keyof CodeOutput): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(output[type]);
      return true;
    } catch (error) {
      console.error("Failed to copy:", error);
      return false;
    }
  };

  return {
    output,
    generateForArtboard,
    generateAll,
    copyToClipboard,
  };
}
