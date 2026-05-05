import { handleGoogleCallback } from "../../src/server/routers/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const APP_URL = process.env.APP_URL || "http://localhost:5173";

  if (!code) {
    return new Response(null, { status: 302, headers: { Location: `${APP_URL}/?error=oauth_failed` } });
  }

  try {
    const { sessionId, expiresAt } = await handleGoogleCallback(code);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${APP_URL}/`,
        "Set-Cookie": `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Secure;`,
      },
    });
  } catch (err) {
    console.error("OAuth error:", err);
    return new Response(null, { status: 302, headers: { Location: `${APP_URL}/?error=oauth_failed` } });
  }
}
