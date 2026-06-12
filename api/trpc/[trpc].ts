// v3.0.0-debug
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../src/server/router";
import { createContext } from "../../src/server/trpc";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  try {
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext,
      onError({ error, path }) {
        console.error(`tRPC error on ${path}:`, error.message, error.cause);
      },
    });
  } catch (err: any) {
    console.error("Fatal handler error:", err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
