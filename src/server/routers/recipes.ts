import { router, protectedProcedure } from "../trpc";
import { recipes, recipeComments, recipeRatings, recipeLikes } from "../db/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
import { z } from "zod";

export const recipesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(recipes).orderBy(desc(recipes.createdAt));
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const [recipe] = await ctx.db.select().from(recipes).where(eq(recipes.id, input.id));
    return recipe ?? null;
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      ingredients: z.string().min(1),
      instructions: z.string().min(1),
      category: z.string().optional(),
      prepTimeMinutes: z.number().optional(),
      calories: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db.insert(recipes).values({ userId: ctx.user.id, ...input }).returning();
      return created;
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(recipes).where(and(eq(recipes.id, input.id), eq(recipes.userId, ctx.user.id)));
    return { success: true };
  }),

  like: protectedProcedure.input(z.object({ recipeId: z.number() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(recipeLikes).where(and(eq(recipeLikes.recipeId, input.recipeId), eq(recipeLikes.userId, ctx.user.id)));
    if (existing) {
      await ctx.db.delete(recipeLikes).where(eq(recipeLikes.id, existing.id));
      return { liked: false };
    }
    await ctx.db.insert(recipeLikes).values({ recipeId: input.recipeId, userId: ctx.user.id });
    return { liked: true };
  }),

  getLikes: protectedProcedure.input(z.object({ recipeId: z.number() })).query(async ({ ctx, input }) => {
    const likes = await ctx.db.select().from(recipeLikes).where(eq(recipeLikes.recipeId, input.recipeId));
    const userLiked = likes.some(l => l.userId === ctx.user.id);
    return { count: likes.length, userLiked };
  }),

  addComment: protectedProcedure
    .input(z.object({ recipeId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [c] = await ctx.db.insert(recipeComments).values({ recipeId: input.recipeId, userId: ctx.user.id, content: input.content }).returning();
      return c;
    }),

  getComments: protectedProcedure.input(z.object({ recipeId: z.number() })).query(async ({ ctx, input }) => {
    return ctx.db.select().from(recipeComments).where(eq(recipeComments.recipeId, input.recipeId)).orderBy(desc(recipeComments.createdAt));
  }),

  rate: protectedProcedure.input(z.object({ recipeId: z.number(), rating: z.number().min(1).max(5) })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(recipeRatings).where(and(eq(recipeRatings.recipeId, input.recipeId), eq(recipeRatings.userId, ctx.user.id)));
    if (existing) {
      await ctx.db.update(recipeRatings).set({ rating: input.rating }).where(eq(recipeRatings.id, existing.id));
    } else {
      await ctx.db.insert(recipeRatings).values({ recipeId: input.recipeId, userId: ctx.user.id, rating: input.rating });
    }
    return { success: true };
  }),
});
