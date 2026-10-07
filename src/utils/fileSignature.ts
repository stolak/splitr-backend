import type { SupportedFileType } from "../types/invoiceExtraction";

type DetectedFile = { mime: string };

export async function detectFileType(buffer: Buffer): Promise<SupportedFileType | null> {
  const fileType = (await import("file-type")) as {
    fileTypeFromBuffer: (input: Uint8Array) => Promise<DetectedFile | undefined>;
  };
  const detected = await fileType.fileTypeFromBuffer(buffer);
  if (!detected) return null;

  if (detected.mime === "application/pdf") return "pdf";
  if (detected.mime === "image/png") return "png";
  if (detected.mime === "image/jpeg") return "jpeg";
  return null;
}
