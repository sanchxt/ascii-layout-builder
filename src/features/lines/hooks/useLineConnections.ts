import { useCallback, useMemo } from "react";
import { useLineStore } from "../store/lineStore";
import { useBoxStore } from "@/features/boxes/store/boxStore";
import type { Line, BoxConnectionPoint } from "@/types/line";
import type { Box } from "@/types/box";
import {
  findNearbyBoxConnection,
  getConnectionPointCoords,
} from "../utils/lineGeometry";
import { LINE_CONSTANTS } from "@/lib/constants";

interface ConnectionIndicator {
  boxId: string;
  point: { x: number; y: number };
  side: BoxConnectionPoint["side"];
}

export const useLineConnections = () => {
  const lines = useLineStore((state) => state.lines);
  const updateLine = useLineStore((state) => state.updateLine);
  const boxes = useBoxStore((state) => state.boxes);

  const findConnectionAtPoint = useCallback(
    (
      x: number,
      y: number,
      excludeBoxIds: string[] = []
    ): ConnectionIndicator | null => {
      const result = findNearbyBoxConnection(
        x,
        y,
        boxes,
        excludeBoxIds,
        LINE_CONSTANTS.CONNECTION_SNAP_DISTANCE
      );

      if (result) {
        return {
          boxId: result.boxId,
          point: result.point,
          side: result.connection.side,
        };
      }

      return null;
    },
    [boxes]
  );

  const snapToBoxEdge = useCallback(
    (
      x: number,
      y: number,
      excludeBoxIds: string[] = []
    ): {
      x: number;
      y: number;
      connection: BoxConnectionPoint | null;
    } => {
      const result = findNearbyBoxConnection(
        x,
        y,
        boxes,
        excludeBoxIds,
        LINE_CONSTANTS.CONNECTION_SNAP_DISTANCE
      );

      if (result) {
        return {
          x: result.point.x,
          y: result.point.y,
          connection: result.connection,
        };
      }

      return { x, y, connection: null };
    },
    [boxes]
  );

  const getLinesConnectedToBox = useCallback(
    (boxId: string): Line[] => {
      return lines.filter(
        (line) =>
          line.startConnection?.boxId === boxId ||
          line.endConnection?.boxId === boxId
      );
    },
    [lines]
  );

  const updateConnectionsForBox = useCallback(
    (boxId: string) => {
      const box = boxes.find((b) => b.id === boxId);
      if (!box) return;

      const connectedLines = getLinesConnectedToBox(boxId);

      connectedLines.forEach((line) => {
        const updates: Partial<Line> = {};

        if (line.startConnection?.boxId === boxId) {
          const newPoint = getConnectionPointCoords(line.startConnection, box);
          updates.startX = newPoint.x;
          updates.startY = newPoint.y;
        }

        if (line.endConnection?.boxId === boxId) {
          const newPoint = getConnectionPointCoords(line.endConnection, box);
          updates.endX = newPoint.x;
          updates.endY = newPoint.y;
        }

        if (Object.keys(updates).length > 0) {
          updateLine(line.id, updates);
        }
      });
    },
    [boxes, getLinesConnectedToBox, updateLine]
  );

  const clearConnectionsForBox = useCallback(
    (boxId: string) => {
      const connectedLines = getLinesConnectedToBox(boxId);

      connectedLines.forEach((line) => {
        const updates: Partial<Line> = {};

        if (line.startConnection?.boxId === boxId) {
          updates.startConnection = undefined;
        }

        if (line.endConnection?.boxId === boxId) {
          updates.endConnection = undefined;
        }

        if (Object.keys(updates).length > 0) {
          updateLine(line.id, updates);
        }
      });
    },
    [getLinesConnectedToBox, updateLine]
  );

  const getConnectionIndicators = useCallback(
    (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      excludeBoxIds: string[] = []
    ): {
      start: ConnectionIndicator | null;
      end: ConnectionIndicator | null;
    } => {
      return {
        start: findConnectionAtPoint(startX, startY, excludeBoxIds),
        end: findConnectionAtPoint(endX, endY, excludeBoxIds),
      };
    },
    [findConnectionAtPoint]
  );

  const lineHasConnections = useCallback((line: Line): boolean => {
    return !!(line.startConnection || line.endConnection);
  }, []);

  const getConnectionSummary = useCallback(
    (line: Line): { start: Box | null; end: Box | null } => {
      const startBox = line.startConnection
        ? boxes.find((b) => b.id === line.startConnection!.boxId) || null
        : null;
      const endBox = line.endConnection
        ? boxes.find((b) => b.id === line.endConnection!.boxId) || null
        : null;

      return { start: startBox, end: endBox };
    },
    [boxes]
  );

  const getConnectedBoxIds = useMemo(() => {
    const connectedIds = new Set<string>();

    lines.forEach((line) => {
      if (line.startConnection) {
        connectedIds.add(line.startConnection.boxId);
      }
      if (line.endConnection) {
        connectedIds.add(line.endConnection.boxId);
      }
    });

    return connectedIds;
  }, [lines]);

  return {
    findConnectionAtPoint,
    snapToBoxEdge,
    getLinesConnectedToBox,
    updateConnectionsForBox,
    clearConnectionsForBox,
    getConnectionIndicators,
    lineHasConnections,
    getConnectionSummary,
    getConnectedBoxIds,
  };
};
