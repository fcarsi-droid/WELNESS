import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "./db/index.js";
import { sessions, users } from "./db/schema.js";
import { eq } from "drizzle-orm";
export async function createContext({ req }) {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(cookieHeader.split(";").map(c => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
    }));
    const sessionId = cookies["session_id"];
    let user = null;
    let session = null;
    if (sessionId) {
        const [sess] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
        if (sess && sess.expiresAt > new Date()) {
            session = sess;
            const [u] = await db.select().from(users).where(eq(users.id, sess.userId));
            user = u ?? null;
        }
    }
    return { db, user, session, req };
}
const t = initTRPC.context().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED" });
    if (ctx.user.status === "pending")
        throw new TRPCError({ code: "FORBIDDEN", message: "Aguardando aprovação do administrador." });
    if (ctx.user.status === "banned")
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta suspensa." });
    return next({ ctx: { ...ctx, user: ctx.user } });
});
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
    if (ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
    return next({ ctx });
});
