import { router, protectedProcedure } from "../trpc";
import { moodEntries } from "../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { z } from "zod";
import { encryptUserId, getLookupToken } from "../lib/encryption";

export const moodRouter = router({
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const token = await getLookupToken(ctx.user.id);
    return ctx.db.select().from(moodEntries)
      .where(and(eq(moodEntries.lookupToken, token), eq(moodEntries.date, today)))
      .orderBy(moodEntries.createdAt);
  }),

  history: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const token = await getLookupToken(ctx.user.id);
      return ctx.db.select().from(moodEntries)
        .where(and(eq(moodEntries.lookupToken, token), gte(moodEntries.date, from.toISOString().split("T")[0])))
        .orderBy(desc(moodEntries.date), moodEntries.createdAt);
    }),

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
      const [encryptedId, token] = await Promise.all([
        encryptUserId(ctx.user.id),
        getLookupToken(ctx.user.id),
      ]);
      const [created] = await ctx.db.insert(moodEntries)
        .values({ userId: encryptedId, lookupToken: token, level: input.level, note: input.note ?? null, reflection: input.reflection ?? null, learning: input.learning ?? null, date, time })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      level: z.enum(["1","2","3","4","5"]).optional(),
      note: z.string().max(500).optional(),
      reflection: z.string().max(1000).optional(),
      learning: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const token = await getLookupToken(ctx.user.id);
      const { id, ...data } = input;
      const [updated] = await ctx.db.update(moodEntries)
        .set(data)
        .where(and(eq(moodEntries.id, id), eq(moodEntries.lookupToken, token)))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const token = await getLookupToken(ctx.user.id);
      await ctx.db.delete(moodEntries)
        .where(and(eq(moodEntries.id, input.id), eq(moodEntries.lookupToken, token)));
      return { success: true };
    }),
});
