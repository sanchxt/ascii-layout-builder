import { type FC } from "react";
import { useArtboardStore } from "../store/artboardStore";

interface ArtboardDropZoneIndicatorProps {
  targetArtboardId: string;
  isValid: boolean;
  validationMessage?: string;
}

export const ArtboardDropZoneIndicator: FC<ArtboardDropZoneIndicatorProps> = ({
  targetArtboardId,
  isValid,
  validationMessage,
}) => {
  const artboard = useArtboardStore((state) =>
    state.artboards.find((a) => a.id === targetArtboardId)
  );

  if (!artboard) return null;

  return (
    <>
      <div
        className="absolute pointer-events-none"
        style={{
          left: artboard.x,
          top: artboard.y,
          width: artboard.width,
          height: artboard.height,
          border: `3px ${isValid ? "solid" : "dashed"} ${
            isValid ? "#3b82f6" : "#ef4444"
          }`,
          backgroundColor: isValid
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(239, 68, 68, 0.1)",
          borderRadius: "4px",
          zIndex: 9999,
        }}
      />
      {validationMessage && (
        <div
          className="absolute pointer-events-none px-3 py-1.5 rounded-md text-sm font-medium shadow-lg"
          style={{
            left: artboard.x + artboard.width / 2,
            top: artboard.y + artboard.height / 2,
            transform: "translate(-50%, -50%)",
            backgroundColor: isValid ? "#3b82f6" : "#ef4444",
            color: "white",
            zIndex: 10000,
          }}
        >
          {validationMessage}
        </div>
      )}
    </>
  );
};
