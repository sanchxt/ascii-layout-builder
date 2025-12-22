/**
 * Animation Export/Import Utilities
 *
 * Functions for exporting and importing animation data as JSON files.
 */

import type { AnimationState } from "../types/animation";
import type { StateTransition } from "../types/transition";
import type {
  AnimationExportData,
  ImportValidationResult,
  ExportMetadata,
} from "../types/exportImport";

const CURRENT_VERSION = "1.0.0";

/**
 * Export animation data to JSON string
 */
export function exportAnimationToJSON(
  states: AnimationState[],
  transitions: StateTransition[],
  artboardId?: string,
  metadata?: ExportMetadata
): string {
  const exportData: AnimationExportData = {
    version: CURRENT_VERSION,
    exportedAt: Date.now(),
    artboardId,
    states,
    transitions,
    metadata,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Download animation data as a JSON file
 */
export function downloadAnimationJSON(
  states: AnimationState[],
  transitions: StateTransition[],
  artboardId?: string,
  metadata?: ExportMetadata,
  filename?: string
): void {
  const json = exportAnimationToJSON(states, transitions, artboardId, metadata);

  const finalFilename =
    filename || `animation-${new Date().toISOString().slice(0, 10)}.anim.json`;

  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = finalFilename;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate JSON string for import
 */
export function validateImportData(json: string): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      valid: false,
      errors: ["Invalid JSON format"],
      warnings: [],
    };
  }

  // Check if it's an object
  if (typeof parsed !== "object" || parsed === null) {
    return {
      valid: false,
      errors: ["Data must be an object"],
      warnings: [],
    };
  }

  const data = parsed as Record<string, unknown>;

  // Check version
  if (!data.version || typeof data.version !== "string") {
    errors.push("Missing or invalid version field");
  } else if (data.version !== CURRENT_VERSION) {
    warnings.push(
      `Version mismatch: file is v${data.version}, current is v${CURRENT_VERSION}`
    );
  }

  // Check states array
  if (!Array.isArray(data.states)) {
    errors.push("Missing or invalid states array");
  } else {
    // Validate each state
    data.states.forEach((state: unknown, index: number) => {
      const stateErrors = validateState(state, index);
      errors.push(...stateErrors);
    });
  }

  // Check transitions array
  if (!Array.isArray(data.transitions)) {
    errors.push("Missing or invalid transitions array");
  } else {
    // Validate each transition
    data.transitions.forEach((transition: unknown, index: number) => {
      const transitionErrors = validateTransition(transition, index);
      errors.push(...transitionErrors);
    });
  }

  // Check exportedAt
  if (data.exportedAt && typeof data.exportedAt !== "number") {
    warnings.push("Invalid exportedAt timestamp");
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors: [],
    warnings,
    data: data as unknown as AnimationExportData,
  };
}

/**
 * Validate a single state object
 */
function validateState(state: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `State[${index}]`;

  if (typeof state !== "object" || state === null) {
    return [`${prefix}: must be an object`];
  }

  const s = state as Record<string, unknown>;

  if (!s.id || typeof s.id !== "string") {
    errors.push(`${prefix}: missing or invalid id`);
  }

  if (!s.name || typeof s.name !== "string") {
    errors.push(`${prefix}: missing or invalid name`);
  }

  if (typeof s.order !== "number") {
    errors.push(`${prefix}: missing or invalid order`);
  }

  if (!Array.isArray(s.elements)) {
    errors.push(`${prefix}: missing or invalid elements array`);
  }

  if (typeof s.trigger !== "object" || s.trigger === null) {
    errors.push(`${prefix}: missing or invalid trigger`);
  }

  return errors;
}

/**
 * Validate a single transition object
 */
function validateTransition(transition: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Transition[${index}]`;

  if (typeof transition !== "object" || transition === null) {
    return [`${prefix}: must be an object`];
  }

  const t = transition as Record<string, unknown>;

  if (!t.id || typeof t.id !== "string") {
    errors.push(`${prefix}: missing or invalid id`);
  }

  if (!t.fromStateId || typeof t.fromStateId !== "string") {
    errors.push(`${prefix}: missing or invalid fromStateId`);
  }

  if (!t.toStateId || typeof t.toStateId !== "string") {
    errors.push(`${prefix}: missing or invalid toStateId`);
  }

  if (typeof t.duration !== "number") {
    errors.push(`${prefix}: missing or invalid duration`);
  }

  return errors;
}

/**
 * Parse and validate JSON file for import
 * Returns the validated data or throws an error
 */
export function parseAnimationImport(json: string): AnimationExportData {
  const result = validateImportData(json);

  if (!result.valid || !result.data) {
    throw new Error(`Invalid import data: ${result.errors.join(", ")}`);
  }

  return result.data;
}

/**
 * Read file and return contents as string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Generate new unique IDs for imported data to avoid conflicts
 */
export function regenerateIds(
  data: AnimationExportData
): AnimationExportData {
  const idMap = new Map<string, string>();

  // Generate new IDs for states
  const newStates = data.states.map((state) => {
    const newId = crypto.randomUUID();
    idMap.set(state.id, newId);
    return {
      ...state,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  // Update transition references
  const newTransitions = data.transitions.map((transition) => ({
    ...transition,
    id: crypto.randomUUID(),
    fromStateId: idMap.get(transition.fromStateId) || transition.fromStateId,
    toStateId: idMap.get(transition.toStateId) || transition.toStateId,
  }));

  return {
    ...data,
    states: newStates,
    transitions: newTransitions,
  };
}
