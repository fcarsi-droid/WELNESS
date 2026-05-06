import { router, protectedProcedure } from "../trpc";
import { moodEntries } from "../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { z } from "zod";

export const moodRouter = router({
  // All entries for today
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    return ctx.db.select().from(moodEntries)
      .where(and(eq(moodEntries.userId, ctx.user.id), eq(moodEntries.date, today)))
      .orderBy(moodEntries.createdAt);
  }),

  // History — all entries grouped by day
  history: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const fromStr = from.toISOString().split("T")[0];
      return ctx.db.select().from(moodEntries)
        .where(and(eq(moodEntries.userId, ctx.user.id), gte(moodEntries.date, fromStr)))
        .orderBy(desc(moodEntries.date), moodEntries.createdAt);
    }),

  // Add a new mood entry (multiple per day allowed)
  add: protectedProcedure
    .input(z.object({
      level: z.enum(["1","2","3","4","5"]),
      note: z.string().max(500).optional(),
      reflection: z.string().max(1000).optional(),
      learning: z.string().max(1000).optional(),
      date: z.string().optional(),
      time: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const date = input.date ?? now.toISOString().split("T")[0];
      const time = input.time ?? now.toTimeString().slice(0, 5);
      const [created] = await ctx.db.insert(moodEntries)
        .values({ userId: ctx.user.id, level: input.level, note: input.note ?? null, reflection: input.reflection ?? null, learning: input.learning ?? null, date, time })
        .returning();
      return created;
    }),

  // Update an existing entry (e.g. add reflection later)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      level: z.enum(["1","2","3","4","5"]).optional(),
      note: z.string().max(500).optional(),
      reflection: z.string().max(1000).optional(),
      learning: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db.update(moodEntries)
        .set(data)
        .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, ctx.user.id)))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(moodEntries)
        .where(and(eq(moodEntries.id, input.id), eq(moodEntries.userId, ctx.user.id)));
      return { success: true };
    }),
});
