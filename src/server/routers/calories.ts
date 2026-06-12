import { router, protectedProcedure } from "../trpc";
import { calorieEntries, calorieGoals, foodItems } from "../db/schema";
import { eq, and, desc, gte, ilike } from "drizzle-orm";
import { z } from "zod";
import { encryptUserId, getLookupToken } from "../lib/encryption";

export const caloriesRouter = router({
  todayEntries: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const token = await getLookupToken(ctx.user.id);
    return ctx.db.select().from(calorieEntries)
      .where(and(eq(calorieEntries.lookupToken, token), eq(calorieEntries.date, today)))
      .orderBy(calorieEntries.meal, calorieEntries.createdAt);
  }),

  history: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const token = await getLookupToken(ctx.user.id);
      return ctx.db.select().from(calorieEntries)
        .where(and(eq(calorieEntries.lookupToken, token), gte(calorieEntries.date, from.toISOString().split("T")[0])))
        .orderBy(desc(calorieEntries.date));
    }),

  goal: protectedProcedure.query(async ({ ctx }) => {
    const token = await getLookupToken(ctx.user.id);
    const [goal] = await ctx.db.select().from(calorieGoals).where(eq(calorieGoals.lookupToken, token));
    return goal ?? { dailyGoal: 2000 };
  }),

  setGoal: protectedProcedure
    .input(z.object({ dailyGoal: z.number().min(500).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const [token, encryptedId] = await Promise.all([getLookupToken(ctx.user.id), encryptUserId(ctx.user.id)]);
      const [existing] = await ctx.db.select().from(calorieGoals).where(eq(calorieGoals.lookupToken, token));
      if (existing) {
        await ctx.db.update(calorieGoals).set({ dailyGoal: input.dailyGoal }).where(eq(calorieGoals.lookupToken, token));
      } else {
        await ctx.db.insert(calorieGoals).values({ userId: encryptedId, lookupToken: token, dailyGoal: input.dailyGoal });
      }
      return { success: true };
    }),

  searchFood: protectedProcedure
    .input(z.object({ q: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(foodItems).where(ilike(foodItems.name, `%${input.q}%`)).orderBy(foodItems.name).limit(15);
    }),

  getAllFoods: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(foodItems).orderBy(foodItems.name);
  }),

  addFoodItem: protectedProcedure
    .input(z.object({ name: z.string().min(1), caloriesPer100g: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db.insert(foodItems).values({ name: input.name, caloriesPer100g: input.caloriesPer100g, isDefault: false, createdBy: ctx.user.id }).returning();
      return created;
    }),

  addEntry: protectedProcedure
    .input(z.object({ foodName: z.string(), calories: z.number(), grams: z.number().optional(), meal: z.enum(["breakfast","lunch","dinner","snack"]).optional(), foodItemId: z.number().optional(), date: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const date = input.date ?? new Date().toISOString().split("T")[0];
      const [token, encryptedId] = await Promise.all([getLookupToken(ctx.user.id), encryptUserId(ctx.user.id)]);
      const [created] = await ctx.db.insert(calorieEntries)
        .values({ userId: encryptedId, lookupToken: token, date, ...input })
        .returning();
      return created;
    }),

  deleteEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const token = await getLookupToken(ctx.user.id);
      await ctx.db.delete(calorieEntries)
        .where(and(eq(calorieEntries.id, input.id), eq(calorieEntries.lookupToken, token)));
      return { success: true };
    }),
});
