/**
 * useAnimationOutput Hook
 * Provides animation code generation, clipboard, and download functionality
 */

import { useMemo, useCallback } from "react";
import { useAnimationStore } from "../../store/animationStore";
import { generateCSSAnimation } from "../generators/cssAnimationGenerator";
import { generateFramerMotion } from "../generators/framerMotionGenerator";
import { generateGSAP } from "../generators/gsapGenerator";
import { generateTailwind } from "../generators/tailwindGenerator";
import { generateOrchestration } from "../generators/orchestrationGenerator";
import { copyToClipboard } from "@/features/ascii-output/utils/clipboard";
import { downloadAsText, generateFilename } from "@/features/ascii-output/utils/fileDownload";
import type {
  AnimationOutputFormat,
  AnimationOutput,
  AnimationOutputOptions,
  FormatOutput,
} from "../types/animationOutput";
import { DEFAULT_OUTPUT_OPTIONS } from "../types/animationOutput";

interface UseAnimationOutputOptions extends Partial<AnimationOutputOptions> {
  /** Artboard ID to filter states/transitions */
  artboardId?: string;
}

interface UseAnimationOutputReturn {
  /** Combined output for all formats */
  output: AnimationOutput;
  /** Generate code for a specific format */
  generateForFormat: (format: AnimationOutputFormat) => string;
  /** Copy code for a format to clipboard */
  copyToClipboard: (format: AnimationOutputFormat) => Promise<boolean>;
  /** Download code as a file */
  downloadAsFile: (format: AnimationOutputFormat) => void;
  /** Whether there are any animations to export */
  hasAnimations: boolean;
  /** Number of animation states */
  statesCount: number;
  /** Number of transitions */
  transitionsCount: number;
  /** Number of animated elements */
  elementsCount: number;
}

/**
 * Hook for generating animation output code
 */
export function useAnimationOutput(
  options: UseAnimationOutputOptions = {}
): UseAnimationOutputReturn {
  const { artboardId, ...outputOptions } = options;
  const mergedOptions = { ...DEFAULT_OUTPUT_OPTIONS, ...outputOptions };

  // Get states and transitions from store
  const allStates = useAnimationStore((state) => state.states);
  const allTransitions = useAnimationStore((state) => state.transitions);
  const getStatesForArtboard = useAnimationStore((s) => s.getStatesForArtboard);
  const getTransitionsForArtboard = useAnimationStore(
    (s) => s.getTransitionsForArtboard
  );

  // Filter by artboard if specified
  const states = useMemo(() => {
    if (artboardId) {
      return getStatesForArtboard(artboardId);
    }
    return allStates;
  }, [artboardId, allStates, getStatesForArtboard]);

  const transitions = useMemo(() => {
    if (artboardId) {
      return getTransitionsForArtboard(artboardId);
    }
    return allTransitions;
  }, [artboardId, allTransitions, getTransitionsForArtboard]);

  // Count unique elements across all states
  const elementsCount = useMemo(() => {
    const elementIds = new Set<string>();
    for (const state of states) {
      for (const element of state.elements) {
        elementIds.add(element.elementId);
      }
    }
    return elementIds.size;
  }, [states]);

  // Generate output for all formats
  const output: AnimationOutput = useMemo(() => {
    const cssCode = generateCSSAnimation(states, transitions, mergedOptions);
    const framerCode = generateFramerMotion(states, transitions, mergedOptions);
    const gsapCode = generateGSAP(states, transitions, mergedOptions);
    const tailwindCode = generateTailwind(states, transitions, mergedOptions);
    const orchestrationCode = generateOrchestration(states, transitions, mergedOptions);

    return {
      css: {
        format: "css",
        code: cssCode,
        fileExtension: "css",
        language: "css",
      },
      framerMotion: {
        format: "framer-motion",
        code: framerCode,
        fileExtension: "tsx",
        language: "tsx",
      },
      gsap: {
        format: "gsap",
        code: gsapCode,
        fileExtension: "js",
        language: "javascript",
      },
      tailwind: {
        format: "tailwind",
        code: tailwindCode,
        fileExtension: "tsx",
        language: "tsx",
      },
      orchestration: {
        format: "orchestration",
        code: orchestrationCode,
        fileExtension: "ts",
        language: "typescript",
      },
      metadata: {
        statesCount: states.length,
        transitionsCount: transitions.length,
        elementsCount,
        artboardId,
      },
    };
  }, [states, transitions, mergedOptions, elementsCount, artboardId]);

  // Generate code for a specific format
  const generateForFormat = useCallback(
    (format: AnimationOutputFormat): string => {
      switch (format) {
        case "css":
          return output.css.code;
        case "framer-motion":
          return output.framerMotion.code;
        case "gsap":
          return output.gsap.code;
        case "tailwind":
          return output.tailwind.code;
        case "orchestration":
          return output.orchestration.code;
        default:
          return "";
      }
    },
    [output]
  );

  // Copy to clipboard
  const copyToClipboardHandler = useCallback(
    async (format: AnimationOutputFormat): Promise<boolean> => {
      const code = generateForFormat(format);
      return copyToClipboard(code);
    },
    [generateForFormat]
  );

  // Download as file
  const downloadAsFileHandler = useCallback(
    (format: AnimationOutputFormat): void => {
      const formatOutput = getFormatOutput(output, format);
      const filename = generateFilename(`animation-${format}`);

      // Map extensions to download format
      const extension = formatOutput.fileExtension === "tsx" || formatOutput.fileExtension === "jsx"
        ? "txt"
        : formatOutput.fileExtension === "css"
        ? "txt"
        : "txt";

      downloadAsText(formatOutput.code, `${filename}.${formatOutput.fileExtension}`, extension);
    },
    [output]
  );

  return {
    output,
    generateForFormat,
    copyToClipboard: copyToClipboardHandler,
    downloadAsFile: downloadAsFileHandler,
    hasAnimations: states.length > 0,
    statesCount: states.length,
    transitionsCount: transitions.length,
    elementsCount,
  };
}

/**
 * Get format output from AnimationOutput
 */
function getFormatOutput(
  output: AnimationOutput,
  format: AnimationOutputFormat
): FormatOutput {
  switch (format) {
    case "css":
      return output.css;
    case "framer-motion":
      return output.framerMotion;
    case "gsap":
      return output.gsap;
    case "tailwind":
      return output.tailwind;
    case "orchestration":
      return output.orchestration;
  }
}
