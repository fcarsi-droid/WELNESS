import { router, protectedProcedure, adminProcedure } from "../trpc";
import { culturalCategories, culturalGroups, culturalGroupMembers, culturalPosts, culturalPostLikes, culturalPostComments, culturalEvents, eventParticipants, users } from "../db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { z } from "zod";

export const culturalRouter = router({
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(culturalCategories).orderBy(culturalCategories.name);
  }),

  createCategory: protectedProcedure
    .input(z.object({ name: z.string().min(1), icon: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [c] = await ctx.db.insert(culturalCategories).values({ name: input.name, icon: input.icon, createdBy: ctx.user.id }).returning();
      return c;
    }),

  getGroups: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: culturalGroups.id, name: culturalGroups.name, description: culturalGroups.description,
      categoryId: culturalGroups.categoryId, createdAt: culturalGroups.createdAt, createdBy: culturalGroups.createdBy,
    }).from(culturalGroups).where(isNull(culturalGroups.deletedAt)).orderBy(desc(culturalGroups.createdAt));
  }),

  createGroup: protectedProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional(), categoryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [g] = await ctx.db.insert(culturalGroups).values({ ...input, createdBy: ctx.user.id }).returning();
      await ctx.db.insert(culturalGroupMembers).values({ groupId: g.id, userId: ctx.user.id });
      return g;
    }),

  // Only admin can delete groups
  deleteGroup: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(culturalGroups).set({ deletedAt: new Date() }).where(eq(culturalGroups.id, input.id));
      return { success: true };
    }),

  joinGroup: protectedProcedure.input(z.object({ groupId: z.number() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(culturalGroupMembers).where(and(eq(culturalGroupMembers.groupId, input.groupId), eq(culturalGroupMembers.userId, ctx.user.id)));
    if (existing) {
      await ctx.db.delete(culturalGroupMembers).where(eq(culturalGroupMembers.id, existing.id));
      return { joined: false };
    }
    await ctx.db.insert(culturalGroupMembers).values({ groupId: input.groupId, userId: ctx.user.id });
    return { joined: true };
  }),

  getMembers: protectedProcedure.input(z.object({ groupId: z.number() })).query(async ({ ctx, input }) => {
    return ctx.db.select().from(culturalGroupMembers).where(eq(culturalGroupMembers.groupId, input.groupId));
  }),

  getPosts: protectedProcedure.input(z.object({ groupId: z.number() })).query(async ({ ctx, input }) => {
    return ctx.db.select({
      id: culturalPosts.id, content: culturalPosts.content, title: culturalPosts.title,
      rating: culturalPosts.rating, createdAt: culturalPosts.createdAt,
      userId: culturalPosts.userId, userName: users.name, userImage: users.image,
    }).from(culturalPosts).leftJoin(users, eq(culturalPosts.userId, users.id))
      .where(eq(culturalPosts.groupId, input.groupId)).orderBy(desc(culturalPosts.createdAt));
  }),

  createPost: protectedProcedure
    .input(z.object({ groupId: z.number(), content: z.string().min(1), title: z.string().optional(), rating: z.number().min(1).max(5).optional() }))
    .mutation(async ({ ctx, input }) => {
      const [p] = await ctx.db.insert(culturalPosts).values({ ...input, userId: ctx.user.id }).returning();
      return p;
    }),

  deletePost: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(culturalPosts).where(and(eq(culturalPosts.id, input.id), eq(culturalPosts.userId, ctx.user.id)));
    return { success: true };
  }),

  likePost: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(culturalPostLikes).where(and(eq(culturalPostLikes.postId, input.postId), eq(culturalPostLikes.userId, ctx.user.id)));
    if (existing) {
      await ctx.db.delete(culturalPostLikes).where(eq(culturalPostLikes.id, existing.id));
      return { liked: false };
    }
    await ctx.db.insert(culturalPostLikes).values({ postId: input.postId, userId: ctx.user.id });
    return { liked: true };
  }),

  getPostLikes: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ ctx, input }) => {
    const likes = await ctx.db.select().from(culturalPostLikes).where(eq(culturalPostLikes.postId, input.postId));
    return { count: likes.length, userLiked: likes.some(l => l.userId === ctx.user.id) };
  }),

  getPostComments: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ ctx, input }) => {
    return ctx.db.select({
      id: culturalPostComments.id, content: culturalPostComments.content, createdAt: culturalPostComments.createdAt,
      userId: culturalPostComments.userId, userName: users.name, userImage: users.image,
    }).from(culturalPostComments).leftJoin(users, eq(culturalPostComments.userId, users.id))
      .where(eq(culturalPostComments.postId, input.postId)).orderBy(culturalPostComments.createdAt);
  }),

  addPostComment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [c] = await ctx.db.insert(culturalPostComments).values({ postId: input.postId, userId: ctx.user.id, content: input.content }).returning();
      return c;
    }),

  deletePostComment: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(culturalPostComments).where(and(eq(culturalPostComments.id, input.id), eq(culturalPostComments.userId, ctx.user.id)));
    return { success: true };
  }),

  getEvents: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: culturalEvents.id, title: culturalEvents.title, description: culturalEvents.description,
      location: culturalEvents.location, eventDate: culturalEvents.eventDate,
      groupId: culturalEvents.groupId, userId: culturalEvents.userId, userName: users.name,
    }).from(culturalEvents).leftJoin(users, eq(culturalEvents.userId, users.id))
      .where(isNull(culturalEvents.deletedAt))
      .orderBy(culturalEvents.eventDate);
  }),

  createEvent: protectedProcedure
    .input(z.object({ title: z.string().min(1), description: z.string().optional(), location: z.string().optional(), eventDate: z.string(), groupId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [e] = await ctx.db.insert(culturalEvents).values({ ...input, eventDate: new Date(input.eventDate), userId: ctx.user.id }).returning();
      await ctx.db.insert(eventParticipants).values({ eventId: e.id, userId: ctx.user.id });
      return e;
    }),

  // Creator or admin can delete events
  deleteEvent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [event] = await ctx.db.select().from(culturalEvents).where(eq(culturalEvents.id, input.id));
      if (!event) throw new Error("Evento não encontrado");
      if (event.userId !== ctx.user.id && ctx.user.role !== "admin") throw new Error("Sem permissão");
      await ctx.db.update(culturalEvents).set({ deletedAt: new Date() }).where(eq(culturalEvents.id, input.id));
      return { success: true };
    }),

  joinEvent: protectedProcedure.input(z.object({ eventId: z.number() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(eventParticipants).where(and(eq(eventParticipants.eventId, input.eventId), eq(eventParticipants.userId, ctx.user.id)));
    if (existing) {
      await ctx.db.delete(eventParticipants).where(eq(eventParticipants.id, existing.id));
      return { joined: false };
    }
    await ctx.db.insert(eventParticipants).values({ eventId: input.eventId, userId: ctx.user.id });
    return { joined: true };
  }),

  getEventParticipants: protectedProcedure.input(z.object({ eventId: z.number() })).query(async ({ ctx, input }) => {
    return ctx.db.select().from(eventParticipants).where(eq(eventParticipants.eventId, input.eventId));
  }),
});
