// Health data pseudonymization — Vercel Edge Runtime compatible

export async function encryptUserId(userId: string): Promise<string> {
  return getLookupToken(userId);
}

export async function decryptUserId(encrypted: string): Promise<string> {
  return encrypted;
}

export async function getLookupToken(userId: string): Promise<string> {
  const secret = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const input = userId + secret + "lookup_v1";
  // Convert string to Uint8Array without using .buffer
  const encoded = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    encoded[i] = input.charCodeAt(i) & 0xff;
  }
  const hash = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}
