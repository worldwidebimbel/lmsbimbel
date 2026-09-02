const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "image/bmp": [0x42, 0x4d],
  "image/svg+xml": [0x3c, 0x73, 0x76, 0x67],
  "audio/mpeg": [0x49, 0x44, 0x33],
  "audio/wav": [0x52, 0x49, 0x46, 0x46],
  "audio/ogg": [0x4f, 0x67, 0x67, 0x53],
  "video/mp4": [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
  "video/webm": [0x1a, 0x45, 0xdf, 0xa3],
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "application/zip": [0x50, 0x4b, 0x03, 0x04],
};

const OFFICE_SIGNATURES: Record<string, number[]> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [0x50, 0x4b, 0x03, 0x04],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [0x50, 0x4b, 0x03, 0x04],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [0x50, 0x4b, 0x03, 0x04],
  "application/msword": [0xd0, 0xcf, 0x11, 0xe0],
  "application/vnd.ms-powerpoint": [0xd0, 0xcf, 0x11, 0xe0],
  "application/vnd.ms-excel": [0xd0, 0xcf, 0x11, 0xe0],
};

function matchesMagic(buf: Buffer, signature: number[]): boolean {
  if (buf.length < signature.length) return false;
  return signature.every((byte, i) => buf[i] === byte);
}

export function detectMimeType(buf: Buffer, declaredType: string): string | null {
  for (const [mime, sig] of Object.entries(MAGIC_BYTES)) {
    if (matchesMagic(buf, sig)) return mime;
  }
  for (const [mime, sig] of Object.entries(OFFICE_SIGNATURES)) {
    if (matchesMagic(buf, sig)) {
      if (declaredType === mime) return mime;
      return "application/zip";
    }
  }
  if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) return "application/x-elf";
  return null;
}

export function validateFileMime(buf: Buffer, declaredType: string): { valid: boolean; detected: string | null } {
  const detected = detectMimeType(buf, declaredType);
  if (!detected) return { valid: false, detected: null };
  if (declaredType.startsWith("image/") && detected.startsWith("image/")) return { valid: true, detected };
  if (declaredType.startsWith("audio/") && detected.startsWith("audio/")) return { valid: true, detected };
  if (declaredType.startsWith("video/") && detected.startsWith("video/")) return { valid: true, detected };
  if (declaredType === detected) return { valid: true, detected };
  if (declaredType.startsWith("application/vnd.openxmlformats") && detected === "application/zip") return { valid: true, detected };
  if (declaredType.startsWith("application/vnd.ms-") && detected === "application/x-ole") return { valid: true, detected };
  return { valid: false, detected };
}
