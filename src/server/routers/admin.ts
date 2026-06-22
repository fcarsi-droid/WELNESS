import { router, adminProcedure } from "../trpc";
import { users, posts, postComments, postLikes, wellnessResources, resourceLikes, culturalPosts, culturalPostComments, culturalPostLikes, bookReviews, books, bookLoans, notifications, sessions, accounts, moodEntries, sleepEntries, hydrationEntries, calorieEntries, calorieGoals, recipes, recipeComments, recipeRatings, recipeLikes, culturalGroupMembers, readingProgress, bookClubVoteChoices, bookClubVotes, eventParticipants, ergonomicCheckins, painReports } from "../db/schema";
import { eq, ne, desc } from "drizzle-orm";
import { z } from "zod";
import { getLookupToken } from "../lib/encryption";

export const adminRouter = router({
  // Users
  getPendingUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(users).where(eq(users.status, "pending")).orderBy(desc(users.createdAt));
  }),

  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(users).where(ne(users.id, ctx.user.id)).orderBy(desc(users.createdAt));
  }),

  approveUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ status: "active" }).where(eq(users.id, input.userId));
      await ctx.db.insert(notifications).values({
        userId: input.userId, type: "system",
        title: "Acesso aprovado!",
        message: "Seu acesso ao Wellness foi aprovado. Bem-vindo(a)!",
      } as any);
      return { success: true };
    }),

  banUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ status: "banned" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  reactivateUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ status: "active" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  promoteToAdmin: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ role: "admin" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const uid = input.userId;
      const healthToken = await getLookupToken(uid);
      // Delete all content in cascade order
      await ctx.db.delete(bookClubVoteChoices).where(eq(bookClubVoteChoices.userId, uid));
      await ctx.db.delete(bookClubVotes).where(eq(bookClubVotes.userId, uid));
      await ctx.db.delete(readingProgress).where(eq(readingProgress.userId, uid));
      await ctx.db.delete(bookReviews).where(eq(bookReviews.userId, uid));
      await ctx.db.delete(bookLoans).where(eq(bookLoans.requesterId, uid));
      await ctx.db.delete(books).where(eq(books.ownerId, uid));
      await ctx.db.delete(eventParticipants).where(eq(eventParticipants.userId, uid));
      await ctx.db.delete(culturalGroupMembers).where(eq(culturalGroupMembers.userId, uid));
      await ctx.db.delete(culturalPostLikes).where(eq(culturalPostLikes.userId, uid));
      await ctx.db.delete(culturalPostComments).where(eq(culturalPostComments.userId, uid));
      await ctx.db.delete(culturalPosts).where(eq(culturalPosts.userId, uid));
      await ctx.db.delete(resourceLikes).where(eq(resourceLikes.userId, uid));
      await ctx.db.delete(wellnessResources).where(eq(wellnessResources.userId, uid));
      await ctx.db.delete(recipeLikes).where(eq(recipeLikes.userId, uid));
      await ctx.db.delete(recipeRatings).where(eq(recipeRatings.userId, uid));
      await ctx.db.delete(recipeComments).where(eq(recipeComments.userId, uid));
      await ctx.db.delete(recipes).where(eq(recipes.userId, uid));
      await ctx.db.delete(postLikes).where(eq(postLikes.userId, uid));
      await ctx.db.delete(postComments).where(eq(postComments.userId, uid));
      await ctx.db.delete(posts).where(eq(posts.userId, uid));
      await ctx.db.delete(calorieGoals).where(eq(calorieGoals.lookupToken, healthToken));
      await ctx.db.delete(calorieEntries).where(eq(calorieEntries.lookupToken, healthToken));
      await ctx.db.delete(hydrationEntries).where(eq(hydrationEntries.lookupToken, healthToken));
      await ctx.db.delete(sleepEntries).where(eq(sleepEntries.lookupToken, healthToken));
      await ctx.db.delete(moodEntries).where(eq(moodEntries.lookupToken, healthToken));
      await ctx.db.delete(ergonomicCheckins).where(eq(ergonomicCheckins.lookupToken, healthToken));
      await ctx.db.delete(painReports).where(eq(painReports.lookupToken, healthToken));
      await ctx.db.delete(notifications).where(eq(notifications.userId, uid));
      await ctx.db.delete(sessions).where(eq(sessions.userId, uid));
      await ctx.db.delete(accounts).where(eq(accounts.userId, uid));
      await ctx.db.delete(users).where(eq(users.id, uid));
      return { success: true };
    }),

  // Content moderation — fetch all
  getAllPosts: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: posts.id, content: posts.content, createdAt: posts.createdAt,
      userId: posts.userId, userName: users.name,
    }).from(posts).leftJoin(users, eq(posts.userId, users.id)).orderBy(desc(posts.createdAt));
  }),

  getAllComments: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: postComments.id, content: postComments.content, createdAt: postComments.createdAt,
      userId: postComments.userId, userName: users.name,
    }).from(postComments).leftJoin(users, eq(postComments.userId, users.id)).orderBy(desc(postComments.createdAt));
  }),

  getAllWellnessResources: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: wellnessResources.id, title: wellnessResources.title, url: wellnessResources.url,
      type: wellnessResources.type, createdAt: wellnessResources.createdAt,
      userId: wellnessResources.userId, userName: users.name,
    }).from(wellnessResources).leftJoin(users, eq(wellnessResources.userId, users.id)).orderBy(desc(wellnessResources.createdAt));
  }),

  getAllCulturalPosts: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: culturalPosts.id, content: culturalPosts.content, title: culturalPosts.title,
      createdAt: culturalPosts.createdAt, userId: culturalPosts.userId, userName: users.name,
    }).from(culturalPosts).leftJoin(users, eq(culturalPosts.userId, users.id)).orderBy(desc(culturalPosts.createdAt));
  }),

  getAllReviews: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: bookReviews.id, content: bookReviews.content, rating: bookReviews.rating,
      createdAt: bookReviews.createdAt, userId: bookReviews.userId, userName: users.name,
    }).from(bookReviews).leftJoin(users, eq(bookReviews.userId, users.id)).orderBy(desc(bookReviews.createdAt));
  }),

  getAllBooks: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: books.id, title: books.title, author: books.author, status: books.status,
      createdAt: books.createdAt, ownerId: books.ownerId, ownerName: users.name,
    }).from(books).leftJoin(users, eq(books.ownerId, users.id)).orderBy(desc(books.createdAt));
  }),

  getAllLoans: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: bookLoans.id, status: bookLoans.status, requestedAt: bookLoans.requestedAt,
      startDate: bookLoans.startDate, dueDate: bookLoans.dueDate, returnedAt: bookLoans.returnedAt,
      bookId: bookLoans.bookId, bookTitle: books.title,
      requesterId: bookLoans.requesterId, requesterName: users.name,
    }).from(bookLoans)
      .leftJoin(books, eq(bookLoans.bookId, books.id))
      .leftJoin(users, eq(bookLoans.requesterId, users.id))
      .orderBy(desc(bookLoans.requestedAt));
  }),

  // Delete content
  deletePost: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(postLikes).where(eq(postLikes.postId, input.id));
    await ctx.db.delete(postComments).where(eq(postComments.postId, input.id));
    await ctx.db.delete(posts).where(eq(posts.id, input.id));
    return { success: true };
  }),

  deleteComment: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(postComments).where(eq(postComments.id, input.id));
    return { success: true };
  }),

  deleteWellnessResource: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(resourceLikes).where(eq(resourceLikes.resourceId, input.id));
    await ctx.db.delete(wellnessResources).where(eq(wellnessResources.id, input.id));
    return { success: true };
  }),

  deleteCulturalPost: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(culturalPostLikes).where(eq(culturalPostLikes.postId, input.id));
    await ctx.db.delete(culturalPostComments).where(eq(culturalPostComments.postId, input.id));
    await ctx.db.delete(culturalPosts).where(eq(culturalPosts.id, input.id));
    return { success: true };
  }),

  deleteReview: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(bookReviews).where(eq(bookReviews.id, input.id));
    return { success: true };
  }),

  deleteBook: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(bookLoans).where(eq(bookLoans.bookId, input.id));
    await ctx.db.delete(books).where(eq(books.id, input.id));
    return { success: true };
  }),

  deleteLoan: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const [loan] = await ctx.db.select().from(bookLoans).where(eq(bookLoans.id, input.id));
    if (loan) await ctx.db.update(books).set({ status: "available" }).where(eq(books.id, loan.bookId));
    await ctx.db.delete(bookLoans).where(eq(bookLoans.id, input.id));
    return { success: true };
  }),
});
