import { useCallback, useEffect } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { KEYBOARD_SHORTCUTS } from "@/lib/constants";

export const useCanvasPan = () => {
  const {
    interaction,
    setIsPanning,
    setLastMousePosition,
    setIsSpacebarPressed,
    updatePan,
  } = useCanvasStore();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.button === 0 && interaction.isSpacebarPressed) || e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        setLastMousePosition({ x: e.clientX, y: e.clientY });
      }
    },
    [interaction.isSpacebarPressed, setIsPanning, setLastMousePosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (interaction.isPanning && interaction.lastMousePosition) {
        const deltaX = e.clientX - interaction.lastMousePosition.x;
        const deltaY = e.clientY - interaction.lastMousePosition.y;

        updatePan(deltaX, deltaY);
        setLastMousePosition({ x: e.clientX, y: e.clientY });
      }
    },
    [
      interaction.isPanning,
      interaction.lastMousePosition,
      updatePan,
      setLastMousePosition,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (interaction.isPanning) {
      setIsPanning(false);
      setLastMousePosition(null);
    }
  }, [interaction.isPanning, setIsPanning, setLastMousePosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === KEYBOARD_SHORTCUTS.SPACEBAR &&
        !interaction.isSpacebarPressed
      ) {
        e.preventDefault();
        setIsSpacebarPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_SHORTCUTS.SPACEBAR) {
        e.preventDefault();
        setIsSpacebarPressed(false);
        if (interaction.isPanning) {
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
  }, [
    interaction.isSpacebarPressed,
    interaction.isPanning,
    setIsSpacebarPressed,
    setIsPanning,
    setLastMousePosition,
  ]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isPanning: interaction.isPanning,
    isSpacebarPressed: interaction.isSpacebarPressed,
  };
};
