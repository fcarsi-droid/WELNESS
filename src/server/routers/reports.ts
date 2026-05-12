import { router, protectedProcedure } from "../trpc";
import { moodEntries, sleepEntries, hydrationEntries, calorieEntries, calorieGoals } from "../db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { z } from "zod";

export const reportsRouter = router({
  getSummary: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const fromStr = from.toISOString().split("T")[0];

      const [moods, sleeps, hydrations, calories, goalData] = await Promise.all([
        ctx.db.select().from(moodEntries)
          .where(and(eq(moodEntries.userId, ctx.user.id), gte(moodEntries.date, fromStr)))
          .orderBy(moodEntries.date, moodEntries.createdAt),
        ctx.db.select().from(sleepEntries)
          .where(and(eq(sleepEntries.userId, ctx.user.id), gte(sleepEntries.date, fromStr)))
          .orderBy(sleepEntries.date),
        ctx.db.select().from(hydrationEntries)
          .where(and(eq(hydrationEntries.userId, ctx.user.id), gte(hydrationEntries.date, fromStr)))
          .orderBy(hydrationEntries.date),
        ctx.db.select().from(calorieEntries)
          .where(and(eq(calorieEntries.userId, ctx.user.id), gte(calorieEntries.date, fromStr)))
          .orderBy(calorieEntries.date),
        ctx.db.select().from(calorieGoals).where(eq(calorieGoals.userId, ctx.user.id)),
      ]);

      // Group calories by date
      const caloriesByDate: Record<string, number> = {};
      calories.forEach(e => { caloriesByDate[e.date] = (caloriesByDate[e.date] || 0) + e.calories; });

      // Get last mood per day for correlation
      const lastMoodByDate: Record<string, typeof moods[0]> = {};
      moods.forEach(m => { lastMoodByDate[m.date] = m; });

      return {
        moods,
        sleeps,
        hydrations,
        caloriesByDate,
        calorieGoal: goalData[0]?.dailyGoal ?? 2000,
        lastMoodByDate,
      };
    }),
});
