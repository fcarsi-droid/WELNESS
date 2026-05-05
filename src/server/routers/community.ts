import { router, protectedProcedure, adminProcedure } from "../trpc";
import { posts, postLikes, postComments, users } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

export const communityRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: posts.id, content: posts.content, createdAt: posts.createdAt,
      userId: posts.userId, userName: users.name, userImage: users.image,
    }).from(posts).leftJoin(users, eq(posts.userId, users.id)).orderBy(desc(posts.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({ content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const [p] = await ctx.db.insert(posts).values({ userId: ctx.user.id, content: input.content }).returning();
      return p;
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(posts).where(and(eq(posts.id, input.id), eq(posts.userId, ctx.user.id)));
    return { success: true };
  }),

  like: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(postLikes).where(and(eq(postLikes.postId, input.postId), eq(postLikes.userId, ctx.user.id)));
    if (existing) {
      await ctx.db.delete(postLikes).where(eq(postLikes.id, existing.id));
      return { liked: false };
    }
    await ctx.db.insert(postLikes).values({ postId: input.postId, userId: ctx.user.id });
    return { liked: true };
  }),

  getLikes: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ ctx, input }) => {
    const likes = await ctx.db.select().from(postLikes).where(eq(postLikes.postId, input.postId));
    return { count: likes.length, userLiked: likes.some(l => l.userId === ctx.user.id) };
  }),

  getComments: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ ctx, input }) => {
    return ctx.db.select({
      id: postComments.id, content: postComments.content, createdAt: postComments.createdAt,
      userId: postComments.userId, parentId: postComments.parentId,
      userName: users.name, userImage: users.image,
    }).from(postComments).leftJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, input.postId)).orderBy(postComments.createdAt);
  }),

  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1), parentId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [c] = await ctx.db.insert(postComments).values({ postId: input.postId, userId: ctx.user.id, content: input.content, parentId: input.parentId ?? null }).returning();
      return c;
    }),
});
