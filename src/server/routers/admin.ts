import { router, adminProcedure } from "../trpc.js";
import { users, notifications } from "../db/schema.js";
import { eq, ne } from "drizzle-orm";
import { z } from "zod";

export const adminRouter = router({
  getPendingUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(users).where(eq(users.status, "pending"));
  }),

  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(users).where(ne(users.id, ctx.user.id));
  }),

  approveUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ status: "active" }).where(eq(users.id, input.userId));
      await ctx.db.insert(notifications).values({
        userId: input.userId,
        type: "system",
        title: "Acesso aprovado!",
        message: "Seu acesso ao Wellness foi aprovado. Bem-vindo(a)!",
      } as any);
      return { success: true };
    }),

  banUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ status: "banned" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  promoteToAdmin: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ role: "admin" }).where(eq(users.id, input.userId));
      return { success: true };
    }),
});
