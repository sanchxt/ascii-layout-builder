/**
 * SyntaxHighlighter Component
 * Theme-aware wrapper around prism-react-renderer for code highlighting
 * Uses CSS variables to adapt to the application's theme system
 */

import { Highlight, type Language } from "prism-react-renderer";
import type { PrismTheme } from "prism-react-renderer";
import { cn } from "@/lib/utils";

interface SyntaxHighlighterProps {
  /** Code to highlight */
  code: string;
  /** Language for syntax highlighting */
  language: Language | string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Additional class name */
  className?: string;
  /** Maximum height with scroll */
  maxHeight?: string;
}

/**
 * Custom theme that uses CSS variables for colors
 * Automatically adapts to light/dark mode via CSS variable values
 */
const cssVarTheme: PrismTheme = {
  plain: {
    color: "var(--syntax-plain)",
    backgroundColor: "transparent",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "var(--syntax-comment)", fontStyle: "italic" },
    },
    {
      types: ["keyword", "control", "directive", "unit", "important", "atrule"],
      style: { color: "var(--syntax-keyword)" },
    },
    {
      types: ["string", "char", "template-string", "regex"],
      style: { color: "var(--syntax-string)" },
    },
    {
      types: ["number", "boolean"],
      style: { color: "var(--syntax-number)" },
    },
    {
      types: ["function", "function-variable"],
      style: { color: "var(--syntax-function)" },
    },
    {
      types: ["operator"],
      style: { color: "var(--syntax-operator)" },
    },
    {
      types: ["punctuation"],
      style: { color: "var(--syntax-punctuation)" },
    },
    {
      types: ["property", "constant", "variable"],
      style: { color: "var(--syntax-property)" },
    },
    {
      types: ["tag", "deleted"],
      style: { color: "var(--syntax-tag)" },
    },
    {
      types: ["attr-name", "namespace"],
      style: { color: "var(--syntax-attr-name)" },
    },
    {
      types: ["attr-value"],
      style: { color: "var(--syntax-attr-value)" },
    },
    {
      types: ["class-name", "maybe-class-name"],
      style: { color: "var(--syntax-class-name)" },
    },
    {
      types: ["builtin", "inserted", "symbol"],
      style: { color: "var(--syntax-builtin)" },
    },
    {
      types: ["selector"],
      style: { color: "var(--syntax-tag)" },
    },
  ],
};

/**
 * Map common language aliases to prism-react-renderer supported languages
 */
function normalizeLanguage(language: string): Language {
  const languageMap: Record<string, Language> = {
    js: "javascript",
    ts: "typescript",
    jsx: "jsx",
    tsx: "tsx",
    css: "css",
    html: "markup",
    xml: "markup",
    json: "json",
  };

  return (languageMap[language] || language) as Language;
}

/**
 * Code syntax highlighter component with line numbers
 */
export function SyntaxHighlighter({
  code,
  language,
  showLineNumbers = true,
  className,
  maxHeight = "400px",
}: SyntaxHighlighterProps) {
  const normalizedLanguage = normalizeLanguage(language);

  return (
    <Highlight theme={cssVarTheme} code={code.trim()} language={normalizedLanguage}>
      {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn(
            highlightClassName,
            "rounded-md text-xs leading-relaxed overflow-auto",
            className
          )}
          style={{
            ...style,
            maxHeight,
            padding: "1rem",
            margin: 0,
            backgroundColor: "hsl(var(--card))",
          }}
        >
          {tokens.map((line, i) => {
            const lineProps = getLineProps({ line, key: i });
            return (
              <div
                key={i}
                {...lineProps}
                className={cn(lineProps.className, "table-row")}
              >
                {showLineNumbers && (
                  <span
                    className="table-cell pr-4 text-right select-none opacity-50"
                    style={{ userSelect: "none" }}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="table-cell">
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token, key });
                    return <span key={key} {...tokenProps} />;
                  })}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}

/**
 * Minimal syntax highlighter without line numbers (for smaller code blocks)
 */
export function InlineSyntaxHighlighter({
  code,
  language,
  className,
}: Omit<SyntaxHighlighterProps, "showLineNumbers" | "maxHeight">) {
  const normalizedLanguage = normalizeLanguage(language);

  return (
    <Highlight theme={cssVarTheme} code={code.trim()} language={normalizedLanguage}>
      {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
        <code
          className={cn(
            highlightClassName,
            "rounded px-1.5 py-0.5 text-xs",
            className
          )}
          style={{
            ...style,
            backgroundColor: "hsl(var(--muted))",
          }}
        >
          {tokens.map((line, i) => (
            <span key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </span>
          ))}
        </code>
      )}
    </Highlight>
  );
}
