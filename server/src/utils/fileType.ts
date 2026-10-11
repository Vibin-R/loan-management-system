/**
 * Detects a file's real type from its first bytes ("magic numbers"). The MIME type and file
 * name sent by the browser can be faked, so uploads are only accepted when the content itself
 * is a PDF, JPEG or PNG.
 */
interface FileSignature {
  mimeType: string;
  extension: string;
  bytes: number[];
}

const SIGNATURES: FileSignature[] = [
  { mimeType: 'application/pdf', extension: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // %PDF-
  {
    mimeType: 'image/png',
    extension: 'png',
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { mimeType: 'image/jpeg', extension: 'jpg', bytes: [0xff, 0xd8, 0xff] },
];

export function detectFileType(data: Buffer): { mimeType: string; extension: string } | null {
  const match = SIGNATURES.find((sig) => sig.bytes.every((byte, i) => data[i] === byte));
  return match ? { mimeType: match.mimeType, extension: match.extension } : null;
}

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  pdf: ['.pdf'],
  png: ['.png'],
  jpg: ['.jpg', '.jpeg'],
};

/** The uploaded name's extension must agree with the detected content type. */
export function extensionMatches(originalName: string, detectedExtension: string): boolean {
  const lower = originalName.toLowerCase();
  return (ALLOWED_EXTENSIONS[detectedExtension] ?? []).some((ext) => lower.endsWith(ext));
}
