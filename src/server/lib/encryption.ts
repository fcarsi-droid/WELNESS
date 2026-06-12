// Single SHA-256 call — getLookupToken also serves as the stored ID

export async function encryptUserId(userId: string): Promise<string> {
  // Return same value as getLookupToken — only one SHA-256 call needed
  return getLookupToken(userId);
}

export async function decryptUserId(encrypted: string): Promise<string> {
  return encrypted;
}

export async function getLookupToken(userId: string): Promise<string> {
  const secret = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const data = new TextEncoder().encode(userId + secret + "lookup_v1");
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}
