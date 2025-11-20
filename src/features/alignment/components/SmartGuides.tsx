import type {
  SmartGuide,
  SpacingGuide,
} from "@/features/alignment/types/alignment";
import { ALIGNMENT_CONSTANTS } from "@/lib/constants";

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

  const style: React.CSSProperties = isVertical
    ? {
        position: "absolute",
        left: `${guide.position}px`,
        top: 0,
        bottom: 0,
        width: 0,
        borderLeft: `${ALIGNMENT_CONSTANTS.SMART_GUIDE_THICKNESS}px dashed ${ALIGNMENT_CONSTANTS.SMART_GUIDE_COLOR}`,
      }
    : {
        position: "absolute",
        top: `${guide.position}px`,
        left: 0,
        right: 0,
        height: 0,
        borderTop: `${ALIGNMENT_CONSTANTS.SMART_GUIDE_THICKNESS}px dashed ${ALIGNMENT_CONSTANTS.SMART_GUIDE_COLOR}`,
      };

  return <div style={style} />;
}

function SpacingGuideLine({ guide }: { guide: SpacingGuide }) {
  const { startPoint, endPoint, distance } = guide;
  const isHorizontal = guide.type === "horizontal";

  const midpoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
  };

  const length = Math.sqrt(
    Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2)
  );

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
          stroke={ALIGNMENT_CONSTANTS.SPACING_GUIDE_COLOR}
          strokeWidth={ALIGNMENT_CONSTANTS.SMART_GUIDE_THICKNESS}
          strokeDasharray={ALIGNMENT_CONSTANTS.SMART_GUIDE_DASH}
        />

        <circle
          cx={startPoint.x}
          cy={startPoint.y}
          r="3"
          fill={ALIGNMENT_CONSTANTS.SPACING_GUIDE_COLOR}
        />

        <circle
          cx={endPoint.x}
          cy={endPoint.y}
          r="3"
          fill={ALIGNMENT_CONSTANTS.SPACING_GUIDE_COLOR}
        />

        {length > 30 && (
          <>
            {isHorizontal ? (
              <>
                <path
                  d={`M ${startPoint.x + 6} ${startPoint.y - 4} L ${
                    startPoint.x
                  } ${startPoint.y} L ${startPoint.x + 6} ${startPoint.y + 4}`}
                  stroke={ALIGNMENT_CONSTANTS.SPACING_GUIDE_COLOR}
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={`M ${endPoint.x - 6} ${endPoint.y - 4} L ${endPoint.x} ${
                    endPoint.y
                  } L ${endPoint.x - 6} ${endPoint.y + 4}`}
                  stroke={ALIGNMENT_CONSTANTS.SPACING_GUIDE_COLOR}
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : (
              <>
                <path
                  d={`M ${startPoint.x - 4} ${startPoint.y + 6} L ${
                    startPoint.x
                  } ${startPoint.y} L ${startPoint.x + 4} ${startPoint.y + 6}`}
                  stroke={ALIGNMENT_CONSTANTS.SPACING_GUIDE_COLOR}
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={`M ${endPoint.x - 4} ${endPoint.y - 6} L ${endPoint.x} ${
                    endPoint.y
                  } L ${endPoint.x + 4} ${endPoint.y - 6}`}
                  stroke={ALIGNMENT_CONSTANTS.SPACING_GUIDE_COLOR}
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </>
        )}
      </svg>

      <div
        className="absolute px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap"
        style={{
          left: `${midpoint.x}px`,
          top: `${midpoint.y}px`,
          transform: "translate(-50%, -50%)",
          backgroundColor: ALIGNMENT_CONSTANTS.SPACING_LABEL_BG,
          color: ALIGNMENT_CONSTANTS.SPACING_LABEL_COLOR,
          fontSize: "11px",
          lineHeight: "1.2",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
        }}
      >
        {Math.round(distance)}px
      </div>
    </>
  );
}
