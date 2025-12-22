/**
 * Animation Export/Import Types
 *
 * Defines the schema for exporting and importing animation data.
 */

import type { AnimationState } from "./animation";
import type { StateTransition } from "./transition";

/**
 * Version for export format compatibility
 */
export const EXPORT_VERSION = "1.0.0";

/**
 * Metadata about the export
 */
export interface ExportMetadata {
  /** Project name, if available */
  projectName?: string;
  /** Number of elements across all states */
  elementCount: number;
  /** Source artboard name, if available */
  artboardName?: string;
}

/**
 * Complete animation data export structure
 */
export interface AnimationExportData {
  /** Export format version for compatibility */
  version: string;
  /** Timestamp when the export was created */
  exportedAt: number;
  /** ID of the artboard these states belong to (optional for portability) */
  artboardId?: string;
  /** All animation states */
  states: AnimationState[];
  /** All transitions between states */
  transitions: StateTransition[];
  /** Optional metadata */
  metadata?: ExportMetadata;
}

/**
 * Result of validating import data
 */
export interface ImportValidationResult {
  /** Whether the data is valid */
  valid: boolean;
  /** Critical errors that prevent import */
  errors: string[];
  /** Non-critical warnings */
  warnings: string[];
  /** Parsed data if valid */
  data?: AnimationExportData;
}

/**
 * Options for importing animation data
 */
export interface ImportOptions {
  /** Whether to replace existing states or merge */
  mode: "replace" | "merge";
  /** Whether to generate new IDs for imported items */
  generateNewIds?: boolean;
}

/**
 * Result of import operation
 */
export interface ImportResult {
  /** Whether import was successful */
  success: boolean;
  /** Number of states imported */
  statesImported: number;
  /** Number of transitions imported */
  transitionsImported: number;
  /** Any issues encountered */
  issues: string[];
}
