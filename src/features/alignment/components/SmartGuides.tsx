import type {
  SmartGuide,
  SpacingGuide,
} from "@/features/alignment/types/alignment";

interface SmartGuidesProps {
  alignmentGuides: SmartGuide[];
  spacingGuides: SpacingGuide[];
}

export function SmartGuides({
  alignmentGuides,
  spacingGuides,
}: SmartGuidesProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 9998 }}
      aria-hidden="true"
    >
      {alignmentGuides.map((guide, index) => (
        <AlignmentGuideLine key={`align-${index}`} guide={guide} />
      ))}

      {spacingGuides.map((guide, index) => (
        <SpacingGuideLine key={`spacing-${index}`} guide={guide} />
      ))}
    </div>
  );
}

function AlignmentGuideLine({ guide }: { guide: SmartGuide }) {
  const isVertical = guide.type === "vertical";
  const color = "#ec4899";

  const style: React.CSSProperties = isVertical
    ? {
        position: "absolute",
        left: `${guide.position}px`,
        top: 0,
        bottom: 0,
        width: "1px",
        backgroundColor: color,
        boxShadow: "0 0 2px rgba(255,255,255,0.5)",
      }
    : {
        position: "absolute",
        top: `${guide.position}px`,
        left: 0,
        right: 0,
        height: "1px",
        backgroundColor: color,
        boxShadow: "0 0 2px rgba(255,255,255,0.5)",
      };

  return <div style={style} />;
}

function SpacingGuideLine({ guide }: { guide: SpacingGuide }) {
  const { startPoint, endPoint, distance } = guide;
  const color = "#f43f5e";

  const midpoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
  };

  return (
    <>
      <svg
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <line
          x1={startPoint.x}
          y1={startPoint.y}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke={color}
          strokeWidth="1"
        />

        <rect
          x={startPoint.x - 2}
          y={startPoint.y - 2}
          width="4"
          height="4"
          fill={color}
        />
        <rect
          x={endPoint.x - 2}
          y={endPoint.y - 2}
          width="4"
          height="4"
          fill={color}
        />
      </svg>

      <div
        className="absolute px-1.5 py-0.5 rounded-sm text-[10px] font-bold font-mono whitespace-nowrap flex items-center justify-center"
        style={{
          left: `${midpoint.x}px`,
          top: `${midpoint.y}px`,
          transform: "translate(-50%, -50%)",
          backgroundColor: color,
          color: "white",
          minWidth: "24px",
          zIndex: 9999,
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        {Math.round(distance)}
      </div>
    </>
  );
}
