import { router, protectedProcedure } from "../trpc";
import { sleepEntries } from "../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { z } from "zod";
import { getLookupToken } from "../lib/encryption";

export const sleepRouter = router({
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const token = await getLookupToken(ctx.user.id);
    const [entry] = await ctx.db.select().from(sleepEntries)
      .where(and(eq(sleepEntries.lookupToken, token), eq(sleepEntries.date, today)));
    return entry ?? null;
  }),

  history: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const token = await getLookupToken(ctx.user.id);
      return ctx.db.select().from(sleepEntries)
        .where(and(eq(sleepEntries.lookupToken, token), gte(sleepEntries.date, from.toISOString().split("T")[0])))
        .orderBy(desc(sleepEntries.date));
    }),

  upsert: protectedProcedure
    .input(z.object({ bedtime: z.string(), wakeTime: z.string(), quality: z.number().min(1).max(5).optional(), date: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const date = input.date ?? new Date().toISOString().split("T")[0];
      const [bH,bM] = input.bedtime.split(":").map(Number);
      const [wH,wM] = input.wakeTime.split(":").map(Number);
      let bMin = bH*60+bM; let wMin = wH*60+wM;
      if (wMin < bMin) wMin += 24*60;
      const durationMinutes = wMin - bMin;
      const token = await getLookupToken(ctx.user.id);
      const [existing] = await ctx.db.select().from(sleepEntries)
        .where(and(eq(sleepEntries.lookupToken, token), eq(sleepEntries.date, date)));
      const values = { bedtime: input.bedtime, wakeTime: input.wakeTime, durationMinutes, quality: input.quality ?? null };
      if (existing) {
        const [u] = await ctx.db.update(sleepEntries).set(values).where(eq(sleepEntries.id, existing.id)).returning();
        return u;
      }
      const [c] = await ctx.db.insert(sleepEntries).values({ userId: token, lookupToken: token, date, ...values }).returning();
      return c;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const token = await getLookupToken(ctx.user.id);
      await ctx.db.delete(sleepEntries).where(and(eq(sleepEntries.id, input.id), eq(sleepEntries.lookupToken, token)));
      return { success: true };
    }),
});
