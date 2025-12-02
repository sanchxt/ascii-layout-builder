import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { KEYBOARD_SHORTCUTS, CANVAS_CONSTANTS } from "@/lib/constants";

export const useCanvasPan = () => {
  const {
    interaction,
    setIsPanning,
    setLastMousePosition,
    setIsSpacebarPressed,
    updatePan,
  } = useCanvasStore();

  const isPanningRef = useRef(false);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const isSpacebarPressedRef = useRef(false);

  isPanningRef.current = interaction.isPanning;
  lastMousePositionRef.current = interaction.lastMousePosition;
  isSpacebarPressedRef.current = interaction.isSpacebarPressed;

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      isPanningRef.current = true;
      lastMousePositionRef.current = { x: clientX, y: clientY };
      setIsPanning(true);
      setLastMousePosition({ x: clientX, y: clientY });
    },
    [setIsPanning, setLastMousePosition]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, forceStartPan = false) => {
      if ((forceStartPan || isSpacebarPressedRef.current) && e.button !== 2) {
        e.preventDefault();
        startPan(e.clientX, e.clientY);
      } else if (e.button === 1) {
        e.preventDefault();
        startPan(e.clientX, e.clientY);
      }
    },
    [startPan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current && lastMousePositionRef.current) {
        const deltaX = e.clientX - lastMousePositionRef.current.x;
        const deltaY = e.clientY - lastMousePositionRef.current.y;

        lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
        updatePan(deltaX, deltaY);
        setLastMousePosition({ x: e.clientX, y: e.clientY });
      }
    },
    [updatePan, setLastMousePosition]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      lastMousePositionRef.current = null;
      setIsPanning(false);
      setLastMousePosition(null);
    }
  }, [setIsPanning, setLastMousePosition]);

  const handleWheelPan = useCallback(
    (e: WheelEvent) => {
      const hasHorizontalScroll = Math.abs(e.deltaX) > 0;

      if (hasHorizontalScroll) {
        const deltaX = e.deltaX * CANVAS_CONSTANTS.WHEEL_PAN_SENSITIVITY;
        updatePan(-deltaX, 0);
      } else if (e.shiftKey) {
        const delta = e.deltaY * CANVAS_CONSTANTS.WHEEL_PAN_SENSITIVITY;
        updatePan(-delta, 0);
      } else {
        const delta = e.deltaY * CANVAS_CONSTANTS.WHEEL_PAN_SENSITIVITY;
        updatePan(0, -delta);
      }
    },
    [updatePan]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === KEYBOARD_SHORTCUTS.SPACEBAR &&
        !isSpacebarPressedRef.current
      ) {
        e.preventDefault();
        isSpacebarPressedRef.current = true;
        setIsSpacebarPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_SHORTCUTS.SPACEBAR) {
        e.preventDefault();
        isSpacebarPressedRef.current = false;
        setIsSpacebarPressed(false);
        if (isPanningRef.current) {
          isPanningRef.current = false;
          lastMousePositionRef.current = null;
          setIsPanning(false);
          setLastMousePosition(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setIsSpacebarPressed, setIsPanning, setLastMousePosition]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheelPan,
    isPanning: interaction.isPanning,
    isSpacebarPressed: interaction.isSpacebarPressed,
    getIsSpacebarPressed: () => isSpacebarPressedRef.current,
  };
};
