export function downloadAsText(
  content: string,
  filename: string,
  extension: "md" | "txt" = "txt"
): void {
  try {
    const fullFilename = filename.endsWith(`.${extension}`)
      ? filename
      : `${filename}.${extension}`;

    const mimeType = extension === "md" ? "text/markdown" : "text/plain";
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fullFilename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download file:", error);
    throw new Error("Failed to download file");
  }
}

export function generateFilename(prefix: string = "ascii-layout"): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+/, "");
  return `${prefix}-${timestamp}`;
}

export function downloadAsciiAsMarkdown(
  content: string,
  customFilename?: string
): void {
  const filename = customFilename ?? generateFilename();
  downloadAsText(content, filename, "md");
}

export function downloadAsciiAsText(
  content: string,
  customFilename?: string
): void {
  const filename = customFilename ?? generateFilename();
  downloadAsText(content, filename, "txt");
}
