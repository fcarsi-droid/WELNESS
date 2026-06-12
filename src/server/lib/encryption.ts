// Health data pseudonymization — Vercel Edge Runtime compatible
// userId is replaced with a keyed hash — irreversible but consistent
// Same userId always produces same encryptedId (deterministic)
// Without the HEALTH_ENCRYPTION_KEY, the hash cannot be reversed

export async function encryptUserId(userId: string): Promise<string> {
  // Use a keyed hash — not reversible, but consistent per user
  // Stored in DB as "enc:<hash>" to distinguish from plain IDs
  const secret = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const data = new TextEncoder().encode(userId + secret + "userid_v1");
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return "enc:" + hex;
}

export async function decryptUserId(encrypted: string): Promise<string> {
  // Keyed hash is not reversible — but we don't need to decrypt
  // The app never needs the original userId from the DB
  return encrypted;
}

export async function getLookupToken(userId: string): Promise<string> {
  const secret = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const data = new TextEncoder().encode(userId + secret + "lookup_v1");
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}
