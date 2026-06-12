// Test: only getLookupToken uses crypto.subtle, encryptUserId is passthrough

export async function encryptUserId(userId: string): Promise<string> {
  // Passthrough for now — just store userId as-is to test getLookupToken
  return userId;
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
