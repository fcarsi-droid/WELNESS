import { router, protectedProcedure, adminProcedure } from "../trpc";
import { moodEntries, wellnessAlertSettings, wellnessContent, wellnessAlertDismissals } from "../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { z } from "zod";

export const wellnessAlertRouter = router({
  // Check if current user should see alert
  checkAlert: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];

    // Already dismissed today?
    const [dismissed] = await ctx.db.select().from(wellnessAlertDismissals)
      .where(and(eq(wellnessAlertDismissals.userId, ctx.user.id), eq(wellnessAlertDismissals.alertDate, today)));
    if (dismissed) return { show: false };

    // Get settings
    const [settings] = await ctx.db.select().from(wellnessAlertSettings);
    const cfg = settings ?? { consecutiveDays: 3, percentageThreshold: 70, windowDays: 7, negativeLevel: 2 };

    // Get recent mood entries
    const from = new Date();
    from.setDate(from.getDate() - Math.max(cfg.windowDays, cfg.consecutiveDays + 1));
    const fromStr = from.toISOString().split("T")[0];

    const entries = await ctx.db.select().from(moodEntries)
      .where(and(eq(moodEntries.userId, ctx.user.id), gte(moodEntries.date, fromStr)))
      .orderBy(desc(moodEntries.date));

    if (entries.length === 0) return { show: false };

    // Group last entry per day
    const byDate: Record<string, string> = {};
    entries.forEach(e => { if (!byDate[e.date]) byDate[e.date] = e.level; });
    const days = Object.entries(byDate).sort(([a],[b])=>b.localeCompare(a));

    // Check consecutive days
    let consecutive = 0;
    for (const [, level] of days) {
      if (parseInt(level) <= cfg.negativeLevel) consecutive++;
      else break;
    }

    // Check percentage in window
    const windowDays = days.slice(0, cfg.windowDays);
    const negativeDays = windowDays.filter(([,l]) => parseInt(l) <= cfg.negativeLevel).length;
    const pct = windowDays.length > 0 ? (negativeDays / windowDays.length) * 100 : 0;

    const trigger = consecutive >= cfg.consecutiveDays || pct >= cfg.percentageThreshold;
    if (!trigger) return { show: false };

    // Get content
    const content = await ctx.db.select().from(wellnessContent).where(eq(wellnessContent.isActive, true));
    const motivations = content.filter(c => c.type === "motivation");
    const tips = content.filter(c => c.type === "tip");
    const reflections = content.filter(c => c.type === "reflection");

    const pick = (arr: any[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

    return {
      show: true,
      consecutiveDays: consecutive,
      negativePct: Math.round(pct),
      motivation: pick(motivations)?.content ?? "Você já superou 100% dos seus dias difíceis até aqui.",
      tip: pick(tips)?.content ?? "Respire fundo e faça uma coisa de cada vez.",
      reflection: pick(reflections)?.content ?? "Olhe para seu diário de humor — ele pode revelar padrões importantes.",
    };
  }),

  dismiss: protectedProcedure.mutation(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const [existing] = await ctx.db.select().from(wellnessAlertDismissals)
      .where(and(eq(wellnessAlertDismissals.userId, ctx.user.id), eq(wellnessAlertDismissals.alertDate, today)));
    if (!existing) {
      await ctx.db.insert(wellnessAlertDismissals).values({ userId: ctx.user.id, alertDate: today });
    }
    return { success: true };
  }),

  // Admin: get/update settings
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const [settings] = await ctx.db.select().from(wellnessAlertSettings);
    return settings ?? { consecutiveDays: 3, percentageThreshold: 70, windowDays: 7, negativeLevel: 2 };
  }),

  updateSettings: adminProcedure
    .input(z.object({
      consecutiveDays: z.number().min(1).max(30),
      percentageThreshold: z.number().min(10).max(100),
      windowDays: z.number().min(3).max(30),
      negativeLevel: z.number().min(1).max(3),
    }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(wellnessAlertSettings);
      if (existing) {
        await ctx.db.update(wellnessAlertSettings).set({ ...input, updatedAt: new Date(), updatedBy: ctx.user.id }).where(eq(wellnessAlertSettings.id, existing.id));
      } else {
        await ctx.db.insert(wellnessAlertSettings).values({ ...input, updatedBy: ctx.user.id });
      }
      return { success: true };
    }),

  // Admin: manage content
  getContent: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(wellnessContent).orderBy(wellnessContent.type, wellnessContent.createdAt);
  }),

  addContent: adminProcedure
    .input(z.object({ type: z.enum(["motivation","tip","reflection"]), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [c] = await ctx.db.insert(wellnessContent).values({ ...input, createdBy: ctx.user.id }).returning();
      return c;
    }),

  updateContent: adminProcedure
    .input(z.object({ id: z.number(), content: z.string().min(1), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(wellnessContent).set({ content: input.content, isActive: input.isActive }).where(eq(wellnessContent.id, input.id));
      return { success: true };
    }),

  deleteContent: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(wellnessContent).where(eq(wellnessContent.id, input.id));
      return { success: true };
    }),
});
