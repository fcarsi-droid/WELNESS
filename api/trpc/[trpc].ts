// v3.1.0-debug
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../src/server/router";
import { createContext } from "../../src/server/trpc";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      // Error will be included in the tRPC response
    },
  });
}
