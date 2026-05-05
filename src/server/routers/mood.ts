import { router, protectedProcedure } from "../trpc";
import { moodEntries } from "../db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { z } from "zod";

export const moodRouter = router({
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const [entry] = await ctx.db.select().from(moodEntries)
      .where(and(eq(moodEntries.userId, ctx.user.id), eq(moodEntries.date, today)));
    return entry ?? null;
  }),

  history: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const fromStr = from.toISOString().split("T")[0];
      return ctx.db.select().from(moodEntries)
        .where(and(eq(moodEntries.userId, ctx.user.id), gte(moodEntries.date, fromStr)))
        .orderBy(desc(moodEntries.date));
    }),

  upsert: protectedProcedure
    .input(z.object({
      level: z.enum(["1","2","3","4","5"]),
      note: z.string().max(500).optional(),
      date: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const date = input.date ?? new Date().toISOString().split("T")[0];
      const [existing] = await ctx.db.select().from(moodEntries)
        .where(and(eq(moodEntries.userId, ctx.user.id), eq(moodEntries.date, date)));

      if (existing) {
        const [updated] = await ctx.db.update(moodEntries)
          .set({ level: input.level, note: input.note ?? null })
          .where(eq(moodEntries.id, existing.id))
          .returning();
        return updated;
      } else {
        const [created] = await ctx.db.insert(moodEntries)
          .values({ userId: ctx.user.id, level: input.level, note: input.note ?? null, date })
          .returning();
        return created;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(moodEntries)
        .where(and(eq(moodEntries.id, input.id), eq(moodEntries.userId, ctx.user.id)));
      return { success: true };
    }),
});
