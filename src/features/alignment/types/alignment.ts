import type { Box } from "@/types/box";

export type AlignmentType =
  | "left"
  | "center-h"
  | "right"
  | "top"
  | "middle-v"
  | "bottom";

export type DistributionType = "horizontal" | "vertical";

export interface BoxWithAbsolutePosition {
  box: Box;
  absPos: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface BoxPositionUpdate {
  id: string;
  x: number;
  y: number;
}

export interface AlignmentReference {
  value: number;
  type: AlignmentType;
}

export interface DistributionConfig {
  type: DistributionType;
  totalSpace: number;
  gap: number;
  anchor: {
    start: number;
    end: number;
  };
}

export interface AlignmentValidation {
  canAlign: boolean;
  reason?: string;
}

export interface AlignmentPoint {
  type: "left" | "center" | "right" | "top" | "middle" | "bottom";
  orientation: "vertical" | "horizontal";
  value: number;
  boxId: string;
}

export interface SmartGuide {
  type: "vertical" | "horizontal";
  position: number;
  matchedBoxIds: string[];
  alignmentPoint: "left" | "center" | "right" | "top" | "middle" | "bottom";
}

export interface SpacingGuide {
  type: "horizontal" | "vertical";
  fromBoxId: string;
  toBoxId: string;
  distance: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
}

export const GUIDE_SNAP_THRESHOLD = 5;

export const SPACING_GUIDE_MAX_DISTANCE = 200;
