// Health data encryption — Vercel Edge Runtime compatible
// Uses SHA-256 derived keystream (XOR cipher) for userId encryption
// getLookupToken uses SHA-256 for deterministic WHERE queries

async function deriveKeystream(length: number, salt: string): Promise<Uint8Array> {
  const secret = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const keystream = new Uint8Array(length);
  let offset = 0;
  let counter = 0;
  while (offset < length) {
    const data = new TextEncoder().encode(secret + salt + counter.toString());
    const hash = await globalThis.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
    const block = new Uint8Array(hash);
    const needed = Math.min(block.length, length - offset);
    keystream.set(block.slice(0, needed), offset);
    offset += needed;
    counter++;
  }
  return keystream;
}

export async function encryptUserId(userId: string): Promise<string> {
  // Random salt so same userId encrypts differently each time
  const saltBytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, "0")).join("");
  const plainBytes = new TextEncoder().encode(userId);
  const keystream = await deriveKeystream(plainBytes.length, salt);
  const cipherBytes = plainBytes.map((b, i) => b ^ keystream[i]);
  const cipherHex = Array.from(cipherBytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return salt + ":" + cipherHex;
}

export async function decryptUserId(encrypted: string): Promise<string> {
  const [salt, cipherHex] = encrypted.split(":");
  const cipherBytes = new Uint8Array((cipherHex.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)));
  const keystream = await deriveKeystream(cipherBytes.length, salt);
  const plainBytes = cipherBytes.map((b, i) => b ^ keystream[i]);
  return new TextDecoder().decode(plainBytes);
}

export async function getLookupToken(userId: string): Promise<string> {
  const secret = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const data = new TextEncoder().encode(userId + secret + "lookup_v1");
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}
