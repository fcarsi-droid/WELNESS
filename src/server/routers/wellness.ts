import { router, protectedProcedure } from "../trpc";
import { wellnessResources, resourceLikes, users } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

export const wellnessRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: wellnessResources.id, title: wellnessResources.title, url: wellnessResources.url,
      description: wellnessResources.description, type: wellnessResources.type,
      createdAt: wellnessResources.createdAt, userId: wellnessResources.userId,
      userName: users.name,
    }).from(wellnessResources)
      .leftJoin(users, eq(wellnessResources.userId, users.id))
      .orderBy(desc(wellnessResources.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      url: z.string().url(),
      description: z.string().optional(),
      type: z.enum(["article","video","link","podcast"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db.insert(wellnessResources).values({
        userId: ctx.user.id,
        ...input,
      }).returning();
      return created;
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const [resource] = await ctx.db.select().from(wellnessResources)
      .where(and(eq(wellnessResources.id, input.id), eq(wellnessResources.userId, ctx.user.id)));
    if (!resource) throw new Error("Recurso não encontrado");
    await ctx.db.delete(resourceLikes).where(eq(resourceLikes.resourceId, input.id));
    await ctx.db.delete(wellnessResources).where(eq(wellnessResources.id, input.id));
    return { success: true };
  }),

  like: protectedProcedure.input(z.object({ resourceId: z.number() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(resourceLikes).where(and(eq(resourceLikes.resourceId, input.resourceId), eq(resourceLikes.userId, ctx.user.id)));
    if (existing) {
      await ctx.db.delete(resourceLikes).where(eq(resourceLikes.id, existing.id));
      return { liked: false };
    }
    await ctx.db.insert(resourceLikes).values({ resourceId: input.resourceId, userId: ctx.user.id });
    return { liked: true };
  }),
});
