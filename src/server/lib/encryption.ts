// AES-256-GCM encryption — Vercel Edge Runtime compatible

function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function bytesFromHex(hex: string): Uint8Array {
  return new Uint8Array((hex.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)));
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const raw = new TextEncoder().encode(secret.slice(0, 32).padEnd(32, "0"));
  return globalThis.crypto.subtle.importKey("raw", raw.buffer as ArrayBuffer, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptUserId(userId: string): Promise<string> {
  const key = await getKey();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(userId);
  const cipher = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv.buffer as ArrayBuffer }, key, data.buffer as ArrayBuffer);
  return hexFromBytes(iv) + ":" + hexFromBytes(new Uint8Array(cipher));
}

export async function decryptUserId(encrypted: string): Promise<string> {
  const key = await getKey();
  const [ivHex, cipherHex] = encrypted.split(":");
  const iv = bytesFromHex(ivHex);
  const cipher = bytesFromHex(cipherHex);
  const plain = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv.buffer as ArrayBuffer }, key, cipher.buffer as ArrayBuffer);
  return new TextDecoder().decode(plain);
}

export async function getLookupToken(userId: string): Promise<string> {
  const secret = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const data = new TextEncoder().encode(userId + secret + "lookup_v1");
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  return hexFromBytes(new Uint8Array(hash));
}
