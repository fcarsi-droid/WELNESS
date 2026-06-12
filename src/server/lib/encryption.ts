// Encryption utility for sensitive health data
// Uses AES-256-GCM via Web Crypto API (compatible with Vercel Edge Runtime)

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.HEALTH_ENCRYPTION_KEY;
  if (!secret) throw new Error("HEALTH_ENCRYPTION_KEY not set");
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret.slice(0, 32).padEnd(32, "0")),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
  return keyMaterial;
}

export async function encryptUserId(userId: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(userId);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptUserId(encrypted: string): Promise<string> {
  const key = await getKey();
  const combined = new Uint8Array(atob(encrypted).split("").map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

// Deterministic token for WHERE queries — same input always gives same output
export async function getLookupToken(userId: string): Promise<string> {
  const secret = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const data = new TextEncoder().encode(userId + secret + "lookup_v1");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
