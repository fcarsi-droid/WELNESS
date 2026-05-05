import { router, protectedProcedure, adminProcedure } from "../trpc";
import { books, bookLoans, bookClubReadings, bookClubVotes, bookClubVoteChoices, readingProgress, bookReviews, users } from "../db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { z } from "zod";

export const bookclubRouter = router({
  // Library
  getBooks: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: books.id, title: books.title, author: books.author, type: books.type,
      status: books.status, notes: books.notes, createdAt: books.createdAt,
      ownerId: books.ownerId, ownerName: users.name,
    }).from(books).leftJoin(users, eq(books.ownerId, users.id)).orderBy(desc(books.createdAt));
  }),

  addBook: protectedProcedure
    .input(z.object({ title: z.string().min(1), author: z.string().min(1), type: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [b] = await ctx.db.insert(books).values({ ownerId: ctx.user.id, ...input }).returning();
      return b;
    }),

  deleteMyBook: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(bookLoans).where(eq(bookLoans.bookId, input.id));
    await ctx.db.delete(books).where(and(eq(books.id, input.id), eq(books.ownerId, ctx.user.id)));
    return { success: true };
  }),

  requestLoan: protectedProcedure.input(z.object({ bookId: z.number() })).mutation(async ({ ctx, input }) => {
    const [b] = await ctx.db.select().from(books).where(eq(books.id, input.bookId));
    if (!b || b.status !== "available") throw new Error("Livro não disponível");
    if (b.ownerId === ctx.user.id) throw new Error("Você não pode solicitar seu próprio livro");
    const [loan] = await ctx.db.insert(bookLoans).values({ bookId: input.bookId, requesterId: ctx.user.id }).returning();
    await ctx.db.update(books).set({ status: "reserved" }).where(eq(books.id, input.bookId));
    return loan;
  }),

  cancelRequest: protectedProcedure.input(z.object({ loanId: z.number() })).mutation(async ({ ctx, input }) => {
    const [loan] = await ctx.db.select().from(bookLoans).where(and(eq(bookLoans.id, input.loanId), eq(bookLoans.requesterId, ctx.user.id)));
    if (!loan || loan.status !== "requested") throw new Error("Solicitação não encontrada");
    await ctx.db.update(bookLoans).set({ status: "cancelled" }).where(eq(bookLoans.id, input.loanId));
    await ctx.db.update(books).set({ status: "available" }).where(eq(books.id, loan.bookId));
    return { success: true };
  }),

  getMyLoans: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: bookLoans.id, status: bookLoans.status, requestedAt: bookLoans.requestedAt,
      startDate: bookLoans.startDate, dueDate: bookLoans.dueDate, returnedAt: bookLoans.returnedAt,
      notes: bookLoans.notes, bookId: bookLoans.bookId,
      bookTitle: books.title, bookAuthor: books.author,
      requesterId: bookLoans.requesterId,
    }).from(bookLoans).leftJoin(books, eq(bookLoans.bookId, books.id))
      .where(eq(bookLoans.requesterId, ctx.user.id)).orderBy(desc(bookLoans.requestedAt));
  }),

  getLoanRequests: protectedProcedure.query(async ({ ctx }) => {
    const myBooks = await ctx.db.select({ id: books.id }).from(books).where(eq(books.ownerId, ctx.user.id));
    if (myBooks.length === 0) return [];
    const myBookIds = myBooks.map(b => b.id);
    const loans = await ctx.db.select({
      id: bookLoans.id, status: bookLoans.status, requestedAt: bookLoans.requestedAt,
      startDate: bookLoans.startDate, dueDate: bookLoans.dueDate, returnedAt: bookLoans.returnedAt,
      bookId: bookLoans.bookId, bookTitle: books.title,
      requesterId: bookLoans.requesterId, requesterName: users.name,
    }).from(bookLoans).leftJoin(books, eq(bookLoans.bookId, books.id))
      .leftJoin(users, eq(bookLoans.requesterId, users.id))
      .orderBy(desc(bookLoans.requestedAt));
    return loans.filter(l => myBookIds.includes(l.bookId!));
  }),

  approveLoan: protectedProcedure
    .input(z.object({ loanId: z.number(), daysToReturn: z.number().default(14) }))
    .mutation(async ({ ctx, input }) => {
      const dueDate = new Date(Date.now() + input.daysToReturn * 24 * 60 * 60 * 1000);
      await ctx.db.update(bookLoans).set({ status: "active", startDate: new Date(), dueDate }).where(eq(bookLoans.id, input.loanId));
      const [loan] = await ctx.db.select().from(bookLoans).where(eq(bookLoans.id, input.loanId));
      await ctx.db.update(books).set({ status: "borrowed" }).where(eq(books.id, loan.bookId));
      return { success: true };
    }),

  rejectLoan: protectedProcedure.input(z.object({ loanId: z.number() })).mutation(async ({ ctx, input }) => {
    const [loan] = await ctx.db.select().from(bookLoans).where(eq(bookLoans.id, input.loanId));
    if (!loan) throw new Error("Empréstimo não encontrado");
    await ctx.db.update(bookLoans).set({ status: "cancelled" }).where(eq(bookLoans.id, input.loanId));
    await ctx.db.update(books).set({ status: "available" }).where(eq(books.id, loan.bookId));
    return { success: true };
  }),

  confirmReturn: protectedProcedure.input(z.object({ loanId: z.number() })).mutation(async ({ ctx, input }) => {
    const [loan] = await ctx.db.select().from(bookLoans).where(eq(bookLoans.id, input.loanId));
    if (!loan) throw new Error("Empréstimo não encontrado");
    await ctx.db.update(bookLoans).set({ status: "returned", returnedAt: new Date() }).where(eq(bookLoans.id, input.loanId));
    await ctx.db.update(books).set({ status: "available" }).where(eq(books.id, loan.bookId));
    return { success: true };
  }),

  // Club
  getCurrentReading: protectedProcedure.query(async ({ ctx }) => {
    const [reading] = await ctx.db.select().from(bookClubReadings).where(eq(bookClubReadings.isActive, true));
    return reading ?? null;
  }),

  setCurrentReading: adminProcedure
    .input(z.object({ bookId: z.number().optional(), externalTitle: z.string().optional(), externalAuthor: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(bookClubReadings).set({ isActive: false });
      const [r] = await ctx.db.insert(bookClubReadings).values({ ...input, isActive: true }).returning();
      return r;
    }),

  getVotes: protectedProcedure.query(async ({ ctx }) => {
    const votes = await ctx.db.select().from(bookClubVotes).orderBy(desc(bookClubVotes.createdAt));
    const choices = await ctx.db.select().from(bookClubVoteChoices);
    return votes.map(v => ({
      ...v,
      voteCount: choices.filter(c => c.voteId === v.id).length,
      userVoted: choices.some(c => c.voteId === v.id && c.userId === ctx.user.id),
    }));
  }),

  suggestBook: protectedProcedure
    .input(z.object({ title: z.string().min(1), author: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [v] = await ctx.db.insert(bookClubVotes).values({ userId: ctx.user.id, ...input }).returning();
      return v;
    }),

  vote: protectedProcedure.input(z.object({ voteId: z.number() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(bookClubVoteChoices).where(and(eq(bookClubVoteChoices.voteId, input.voteId), eq(bookClubVoteChoices.userId, ctx.user.id)));
    if (existing) {
      await ctx.db.delete(bookClubVoteChoices).where(eq(bookClubVoteChoices.id, existing.id));
      return { voted: false };
    }
    await ctx.db.insert(bookClubVoteChoices).values({ voteId: input.voteId, userId: ctx.user.id });
    return { voted: true };
  }),

  getMyProgress: protectedProcedure.input(z.object({ readingId: z.number() })).query(async ({ ctx, input }) => {
    const [p] = await ctx.db.select().from(readingProgress).where(and(eq(readingProgress.readingId, input.readingId), eq(readingProgress.userId, ctx.user.id)));
    return p ?? null;
  }),

  updateProgress: protectedProcedure
    .input(z.object({ readingId: z.number(), currentPage: z.number(), totalPages: z.number().optional(), finished: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(readingProgress).where(and(eq(readingProgress.readingId, input.readingId), eq(readingProgress.userId, ctx.user.id)));
      if (existing) {
        await ctx.db.update(readingProgress).set({ ...input, updatedAt: new Date() }).where(eq(readingProgress.id, existing.id));
      } else {
        await ctx.db.insert(readingProgress).values({ userId: ctx.user.id, ...input });
      }
      return { success: true };
    }),

  getReviews: protectedProcedure.input(z.object({ readingId: z.number() })).query(async ({ ctx, input }) => {
    return ctx.db.select({
      id: bookReviews.id, rating: bookReviews.rating, content: bookReviews.content,
      createdAt: bookReviews.createdAt, userId: bookReviews.userId,
      userName: users.name, userImage: users.image,
    }).from(bookReviews).leftJoin(users, eq(bookReviews.userId, users.id))
      .where(eq(bookReviews.readingId, input.readingId)).orderBy(desc(bookReviews.createdAt));
  }),

  addReview: protectedProcedure
    .input(z.object({ readingId: z.number(), content: z.string().min(1), rating: z.number().min(1).max(5).optional() }))
    .mutation(async ({ ctx, input }) => {
      const [r] = await ctx.db.insert(bookReviews).values({ userId: ctx.user.id, ...input }).returning();
      return r;
    }),

  deleteReview: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(bookReviews).where(and(eq(bookReviews.id, input.id), eq(bookReviews.userId, ctx.user.id)));
    return { success: true };
  }),
});
