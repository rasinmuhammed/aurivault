// Dynamic imports to avoid Turbopack trying to read test fixtures at build
let pdfParseFn: any | null = null;
let mammothLib: any | null = null;

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType === "application/pdf") {
    if (!pdfParseFn) {
      const mod = await import("pdf-parse");
      pdfParseFn = mod.default ?? mod;
    }
    const res = await pdfParseFn(buffer);
    return res.text || "";
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    if (!mammothLib) {
      const mod = await import("mammoth");
      mammothLib = mod.default ?? mod;
    }
    const { value } = await mammothLib.extractRawText({ buffer });
    return value || "";
  }
  if (mimeType.startsWith("text/")) {
    return buffer.toString("utf8");
  }
  // Fallback: attempt utf8
  return buffer.toString("utf8");
}

export function chunkText(text: string, chunkSize = 800, overlap = 150) {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === text.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }
  return chunks;
}


