import { router, protectedProcedure } from "../trpc";
import { ergonomicCheckins, painReports } from "../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { z } from "zod";
import { getLookupToken } from "../lib/encryption";

const REGIONS = ["neck","shoulders","upper_back","lower_back","wrists","eyes","head"] as const;

export const ergonomicsRouter = router({
  todayCheckin: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const token = await getLookupToken(ctx.user.id);
    const [entry] = await ctx.db.select().from(ergonomicCheckins)
      .where(and(eq(ergonomicCheckins.lookupToken, token), eq(ergonomicCheckins.date, today)));
    return entry ?? null;
  }),

  checkin: protectedProcedure
    .input(z.object({ bodyScore: z.number().min(1).max(5), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const today = new Date().toISOString().split("T")[0];
      const token = await getLookupToken(ctx.user.id);
      const [existing] = await ctx.db.select().from(ergonomicCheckins)
        .where(and(eq(ergonomicCheckins.lookupToken, token), eq(ergonomicCheckins.date, today)));
      if (existing) {
        const [u] = await ctx.db.update(ergonomicCheckins)
          .set({ bodyScore: input.bodyScore, note: input.note ?? null })
          .where(eq(ergonomicCheckins.id, existing.id)).returning();
        return u;
      }
      const [c] = await ctx.db.insert(ergonomicCheckins)
        .values({ userId: token, lookupToken: token, date: today, bodyScore: input.bodyScore, note: input.note ?? null })
        .returning();
      return c;
    }),

  reportPain: protectedProcedure
    .input(z.object({ region: z.enum(REGIONS), intensity: z.number().min(1).max(5), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const today = new Date().toISOString().split("T")[0];
      const token = await getLookupToken(ctx.user.id);
      const [c] = await ctx.db.insert(painReports)
        .values({ userId: token, lookupToken: token, date: today, ...input, note: input.note ?? null })
        .returning();
      return c;
    }),

  getRecentPain: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const token = await getLookupToken(ctx.user.id);
      return ctx.db.select().from(painReports)
        .where(and(eq(painReports.lookupToken, token), gte(painReports.date, from.toISOString().split("T")[0])))
        .orderBy(desc(painReports.createdAt));
    }),

  deletePain: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const token = await getLookupToken(ctx.user.id);
      await ctx.db.delete(painReports).where(and(eq(painReports.id, input.id), eq(painReports.lookupToken, token)));
      return { success: true };
    }),

  getHistory: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      const fromStr = from.toISOString().split("T")[0];
      const token = await getLookupToken(ctx.user.id);
      const [checkins, pains] = await Promise.all([
        ctx.db.select().from(ergonomicCheckins)
          .where(and(eq(ergonomicCheckins.lookupToken, token), gte(ergonomicCheckins.date, fromStr)))
          .orderBy(desc(ergonomicCheckins.date)),
        ctx.db.select().from(painReports)
          .where(and(eq(painReports.lookupToken, token), gte(painReports.date, fromStr)))
          .orderBy(desc(painReports.date)),
      ]);
      return { checkins, pains };
    }),
});
