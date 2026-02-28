export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  const pdfParseModule: any = await import("pdf-parse");
  const pdfParse = pdfParseModule?.default ?? pdfParseModule;

  if (typeof pdfParse !== "function") {
    throw new Error("pdf-parse module is not available as a function.");
  }

  const result = await pdfParse(pdfBuffer);
  const text = typeof result?.text === "string" ? result.text : "";

  return text.trim();
}
