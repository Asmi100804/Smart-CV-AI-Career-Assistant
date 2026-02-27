export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  const parsePdfModule: any = await import("parse-pdf");
  const parsePdf =
    parsePdfModule?.default ?? parsePdfModule?.parsePdf ?? parsePdfModule?.parse ?? parsePdfModule;

  if (typeof parsePdf !== "function") {
    throw new Error("parse-pdf module is not available as a function.");
  }

  const parsed = await parsePdf(pdfBuffer);

  if (typeof parsed === "string") {
    return parsed.trim();
  }

  const text = typeof parsed?.text === "string" ? parsed.text : "";
  return text.trim();
}
