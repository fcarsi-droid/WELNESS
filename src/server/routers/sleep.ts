import { router, protectedProcedure } from "../trpc";
import { sleepEntries } from "../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { z } from "zod";

export const sleepRouter = router({
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const [entry] = await ctx.db.select().from(sleepEntries)
      .where(and(eq(sleepEntries.userId, ctx.user.id), eq(sleepEntries.date, today)));
    return entry ?? null;
  }),

  history: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const fromStr = from.toISOString().split("T")[0];
      return ctx.db.select().from(sleepEntries)
        .where(and(eq(sleepEntries.userId, ctx.user.id), gte(sleepEntries.date, fromStr)))
        .orderBy(desc(sleepEntries.date));
    }),

  upsert: protectedProcedure
    .input(z.object({
      bedtime: z.string(),
      wakeTime: z.string(),
      quality: z.number().min(1).max(5).optional(),
      date: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const date = input.date ?? new Date().toISOString().split("T")[0];
      const [bedH, bedM] = input.bedtime.split(":").map(Number);
      const [wakeH, wakeM] = input.wakeTime.split(":").map(Number);
      let bedMinutes = bedH * 60 + bedM;
      let wakeMinutes = wakeH * 60 + wakeM;
      if (wakeMinutes < bedMinutes) wakeMinutes += 24 * 60;
      const durationMinutes = wakeMinutes - bedMinutes;

      const [existing] = await ctx.db.select().from(sleepEntries)
        .where(and(eq(sleepEntries.userId, ctx.user.id), eq(sleepEntries.date, date)));

      const values = { bedtime: input.bedtime, wakeTime: input.wakeTime, durationMinutes, quality: input.quality ?? null };

      if (existing) {
        const [updated] = await ctx.db.update(sleepEntries).set(values).where(eq(sleepEntries.id, existing.id)).returning();
        return updated;
      } else {
        const [created] = await ctx.db.insert(sleepEntries).values({ userId: ctx.user.id, date, ...values }).returning();
        return created;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(sleepEntries).where(and(eq(sleepEntries.id, input.id), eq(sleepEntries.userId, ctx.user.id)));
      return { success: true };
    }),
});
