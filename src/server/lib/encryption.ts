// Temporary: passthrough (no encryption) to verify the rest works
// Will be replaced with proper encryption once confirmed working

export async function encryptUserId(userId: string): Promise<string> {
  return userId;
}

export async function decryptUserId(encrypted: string): Promise<string> {
  return encrypted;
}

export async function getLookupToken(userId: string): Promise<string> {
  // Simple deterministic hash using built-in — no crypto.subtle at module level
  let hash = 0;
  const str = userId + (process.env.HEALTH_ENCRYPTION_KEY ?? "");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0") + 
         userId.split("").reverse().join("").slice(0, 24).split("").map(c => c.charCodeAt(0).toString(16)).join("");
}
