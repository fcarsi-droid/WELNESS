import { router, protectedProcedure } from "../trpc";
import { calorieEntries, calorieGoals, foodItems } from "../db/schema";
import { eq, and, desc, gte, ilike } from "drizzle-orm";
import { z } from "zod";

export const caloriesRouter = router({
  todayEntries: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    return ctx.db.select().from(calorieEntries)
      .where(and(eq(calorieEntries.userId, ctx.user.id), eq(calorieEntries.date, today)))
      .orderBy(calorieEntries.meal, calorieEntries.createdAt);
  }),

  history: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const fromStr = from.toISOString().split("T")[0];
      return ctx.db.select().from(calorieEntries)
        .where(and(eq(calorieEntries.userId, ctx.user.id), gte(calorieEntries.date, fromStr)))
        .orderBy(desc(calorieEntries.date));
    }),

  goal: protectedProcedure.query(async ({ ctx }) => {
    const [goal] = await ctx.db.select().from(calorieGoals).where(eq(calorieGoals.userId, ctx.user.id));
    return goal ?? { dailyGoal: 2000 };
  }),

  setGoal: protectedProcedure
    .input(z.object({ dailyGoal: z.number().min(500).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(calorieGoals).where(eq(calorieGoals.userId, ctx.user.id));
      if (existing) {
        await ctx.db.update(calorieGoals).set({ dailyGoal: input.dailyGoal }).where(eq(calorieGoals.userId, ctx.user.id));
      } else {
        await ctx.db.insert(calorieGoals).values({ userId: ctx.user.id, dailyGoal: input.dailyGoal });
      }
      return { success: true };
    }),

  searchFood: protectedProcedure
    .input(z.object({ q: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(foodItems)
        .where(ilike(foodItems.name, `%${input.q}%`))
        .limit(10);
    }),

  addEntry: protectedProcedure
    .input(z.object({
      foodName: z.string(),
      calories: z.number(),
      grams: z.number().optional(),
      meal: z.enum(["breakfast","lunch","dinner","snack"]).optional(),
      foodItemId: z.number().optional(),
      date: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const date = input.date ?? new Date().toISOString().split("T")[0];
      const [created] = await ctx.db.insert(calorieEntries)
        .values({ userId: ctx.user.id, date, ...input })
        .returning();
      return created;
    }),

  deleteEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(calorieEntries)
        .where(and(eq(calorieEntries.id, input.id), eq(calorieEntries.userId, ctx.user.id)));
      return { success: true };
    }),
});
