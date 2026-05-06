import { router, protectedProcedure } from "../trpc";
import { hydrationEntries } from "../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { z } from "zod";

export const hydrationRouter = router({
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const [entry] = await ctx.db.select().from(hydrationEntries)
      .where(and(eq(hydrationEntries.userId, ctx.user.id), eq(hydrationEntries.date, today)));
    return entry ?? { glasses: 0, goalGlasses: 8, date: today };
  }),

  getByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const [entry] = await ctx.db.select().from(hydrationEntries)
        .where(and(eq(hydrationEntries.userId, ctx.user.id), eq(hydrationEntries.date, input.date)));
      return entry ?? { glasses: 0, goalGlasses: 8, date: input.date };
    }),

  history: protectedProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const fromStr = from.toISOString().split("T")[0];
      return ctx.db.select().from(hydrationEntries)
        .where(and(eq(hydrationEntries.userId, ctx.user.id), gte(hydrationEntries.date, fromStr)))
        .orderBy(desc(hydrationEntries.date));
    }),

  update: protectedProcedure
    .input(z.object({
      glasses: z.number().min(0).max(30),
      goalGlasses: z.number().min(1).max(30).optional(),
      date: z.string().optional(), // allows editing past dates
    }))
    .mutation(async ({ ctx, input }) => {
      const date = input.date ?? new Date().toISOString().split("T")[0];
      const [existing] = await ctx.db.select().from(hydrationEntries)
        .where(and(eq(hydrationEntries.userId, ctx.user.id), eq(hydrationEntries.date, date)));

      if (existing) {
        const [updated] = await ctx.db.update(hydrationEntries)
          .set({ glasses: input.glasses, goalGlasses: input.goalGlasses ?? existing.goalGlasses })
          .where(eq(hydrationEntries.id, existing.id)).returning();
        return updated;
      } else {
        const [created] = await ctx.db.insert(hydrationEntries)
          .values({ userId: ctx.user.id, date, glasses: input.glasses, goalGlasses: input.goalGlasses ?? 8 })
          .returning();
        return created;
      }
    }),
});
