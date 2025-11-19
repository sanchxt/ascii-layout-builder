export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    return fallbackCopyToClipboard(text);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

function fallbackCopyToClipboard(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);

    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const success = document.execCommand("copy");

    document.body.removeChild(textarea);

    return success;
  } catch (error) {
    console.error("Fallback copy failed:", error);
    return false;
  }
}

export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && window.isSecureContext);
}
