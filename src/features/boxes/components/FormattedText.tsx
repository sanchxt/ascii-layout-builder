import type { TextContent } from "@/types/box";
import { formatToHTML } from "../utils/textFormatting";

interface FormattedTextProps {
  text: TextContent;
  showOverflow?: boolean;
  className?: string;
}

export const FormattedText = ({
  text,
  showOverflow = false,
  className = "",
}: FormattedTextProps) => {
  if (!text.value) return null;

  const htmlContent = formatToHTML(text.value, text.formatting);

  const getFontSize = () => {
    switch (text.fontSize) {
      case "small":
        return "0.75rem";
      case "large":
        return "1.25rem";
      default:
        return "0.875rem";
    }
  };

  return (
    <div
      className={`text-gray-700 whitespace-pre-wrap wrap-break-word ${
        !showOverflow ? "overflow-hidden" : ""
      } ${className}`}
      style={{
        textAlign: text.alignment,
        fontSize: getFontSize(),
        ...((!showOverflow && {
          display: "-webkit-box",
          WebkitLineClamp: "10",
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }) as React.CSSProperties),
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
