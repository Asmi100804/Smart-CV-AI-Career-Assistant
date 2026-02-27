declare module "parse-pdf" {
  export interface ParsePdfResult {
    text?: string;
    [key: string]: unknown;
  }

  export default function parsePdf(data: Buffer | Uint8Array | ArrayBuffer): Promise<ParsePdfResult | string>;
}
