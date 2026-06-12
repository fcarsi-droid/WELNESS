import { router, protectedProcedure } from "../trpc";
import { moodEntries, sleepEntries, hydrationEntries, calorieEntries, calorieGoals } from "../db/schema";
import { eq, and, gte } from "drizzle-orm";
import { z } from "zod";
import { getLookupToken } from "../lib/encryption";

export const reportsRouter = router({
  getSummary: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const fromStr = from.toISOString().split("T")[0];
      const token = await getLookupToken(ctx.user.id);

      const [moods, sleeps, hydrations, calories, goalData] = await Promise.all([
        ctx.db.select().from(moodEntries).where(and(eq(moodEntries.lookupToken, token), gte(moodEntries.date, fromStr))).orderBy(moodEntries.date, moodEntries.createdAt),
        ctx.db.select().from(sleepEntries).where(and(eq(sleepEntries.lookupToken, token), gte(sleepEntries.date, fromStr))).orderBy(sleepEntries.date),
        ctx.db.select().from(hydrationEntries).where(and(eq(hydrationEntries.lookupToken, token), gte(hydrationEntries.date, fromStr))).orderBy(hydrationEntries.date),
        ctx.db.select().from(calorieEntries).where(and(eq(calorieEntries.lookupToken, token), gte(calorieEntries.date, fromStr))).orderBy(calorieEntries.date),
        ctx.db.select().from(calorieGoals).where(eq(calorieGoals.lookupToken, token)),
      ]);

      const caloriesByDate: Record<string, number> = {};
      calories.forEach(e => { caloriesByDate[e.date] = (caloriesByDate[e.date] || 0) + e.calories; });
      const lastMoodByDate: Record<string, typeof moods[0]> = {};
      moods.forEach(m => { lastMoodByDate[m.date] = m; });

      return { moods, sleeps, hydrations, caloriesByDate, calorieGoal: goalData[0]?.dailyGoal ?? 2000, lastMoodByDate };
    }),
});
