// Encryption utility for sensitive health data
// Uses AES-256-GCM — the user_id stored in health tables is always encrypted
// Only the server (with HEALTH_ENCRYPTION_KEY) can decrypt it
// Anyone with direct DB access sees only ciphertext

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;

function getKeyMaterial(): string {
  const key = process.env.HEALTH_ENCRYPTION_KEY;
  if (!key) throw new Error("HEALTH_ENCRYPTION_KEY not set in environment variables");
  if (key.length < 32) throw new Error("HEALTH_ENCRYPTION_KEY must be at least 32 characters");
  return key;
}

// Derive a CryptoKey from the env string
async function deriveKey(): Promise<CryptoKey> {
  const keyMaterial = getKeyMaterial();
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(keyMaterial.slice(0, 32)); // Use first 32 bytes
  return crypto.subtle.importKey("raw", keyBytes, { name: ALGO }, false, ["encrypt", "decrypt"]);
}

// Encrypt a plain string → "iv_hex:ciphertext_hex"
export async function encrypt(plain: string): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoder = new TextEncoder();
  const cipherBuffer = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoder.encode(plain));
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
  const cipherHex = Array.from(new Uint8Array(cipherBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${ivHex}:${cipherHex}`;
}

// Decrypt "iv_hex:ciphertext_hex" → plain string
export async function decrypt(cipher: string): Promise<string> {
  const key = await deriveKey();
  const [ivHex, cipherHex] = cipher.split(":");
  if (!ivHex || !cipherHex) throw new Error("Invalid cipher format");
  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const cipherBytes = new Uint8Array(cipherHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const plainBuffer = await crypto.subtle.decrypt({ name: ALGO, iv }, key, cipherBytes);
  return new TextDecoder().decode(plainBuffer);
}

// Encrypt user_id for storage in health tables
export async function encryptUserId(userId: string): Promise<string> {
  return encrypt(userId);
}

// Decrypt user_id from health tables to query by user
export async function decryptUserId(encryptedId: string): Promise<string> {
  return decrypt(encryptedId);
}

// Get all encrypted versions of a userId stored in a table
// (since each encryption produces a different IV, we can't do WHERE encrypted_id = X)
// Instead we decrypt all and filter — or use a deterministic lookup token
// For efficiency: we also store a lookup_token = sha256(userId + secret_pepper)
// This allows WHERE lookup_token = X without exposing the userId

export async function getLookupToken(userId: string): Promise<string> {
  const pepper = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + pepper + "lookup");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Generate a suggested key (for setup instructions)
export function generateKeyHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}
