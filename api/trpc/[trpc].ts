// v2.0.0-encrypted — rebuild forced
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../src/server/router";
import { createContext } from "../../src/server/trpc";
export const config = { runtime: "edge" };
export default function handler(req: Request) {
  return fetchRequestHandler({ endpoint: "/api/trpc", req, router: appRouter, createContext });
}
