import { createSafeRegExp } from "@/lib/security/safe-regexp";

// ... (rest of the file)

export function extractSection(text: string, sectionTitle: string): string {
  // SECURITY FIX: Use safe string matching instead of regex for section extraction
  const sectionStart = `===${sectionTitle}===`;
  const startIndex = text.toLowerCase().indexOf(sectionStart.toLowerCase());

  if (startIndex === -1) {
    return "";
  }

  const contentStart = startIndex + sectionStart.length;
  const nextHeaderIndex = text.indexOf("===", contentStart);

  if (nextHeaderIndex === -1) {
    return text.substring(contentStart).trim();
  }

  return text.substring(contentStart, nextHeaderIndex).trim();
}

// Alternative regex-based function for complex patterns (if needed)
export function extractSectionRegex(
  text: string,
  sectionTitle: string
): string {
  const safePattern = createSafeRegExp(`===\\s*${sectionTitle}\\s*===`, "i");
  const match = text.match(safePattern);

  if (!match || !match.index) {
    return "";
  }

  const startIndex = match.index + match[0].length;
  const nextHeaderIndex = text.indexOf("===", startIndex);

  if (nextHeaderIndex === -1) {
    return text.substring(startIndex).trim();
  }

  return text.substring(startIndex, nextHeaderIndex).trim();
}

// ... (rest of the file)
