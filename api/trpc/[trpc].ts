import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../src/server/router.js";
import { createContext } from "../../src/server/trpc.js";

export const config = { runtime: "edge" };

export default function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
}
