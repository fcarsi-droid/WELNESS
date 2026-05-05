import { handleGoogleCallback } from "../../src/server/routers/auth";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const APP_URL = process.env.APP_URL || "http://localhost:5173";

  if (error || !code) {
    return Response.redirect(`${APP_URL}/?error=oauth_failed`);
  }

  try {
    const { sessionId, expiresAt } = await handleGoogleCallback(code);

    const response = Response.redirect(`${APP_URL}/`, 302);
    response.headers.set(
      "Set-Cookie",
      `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`
    );
    return response;
  } catch (err) {
    console.error("OAuth error:", err);
    return Response.redirect(`${APP_URL}/?error=oauth_failed`);
  }
}
