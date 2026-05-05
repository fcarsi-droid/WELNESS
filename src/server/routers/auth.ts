import { router, publicProcedure, protectedProcedure } from "../trpc";
import { users, accounts, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index";
import { randomUUID } from "crypto";

const APP_URL = process.env.APP_URL || "http://localhost:5173";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => ({
    user: ctx.user,
    session: ctx.session,
  })),

  getGoogleAuthUrl: publicProcedure.query(() => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${APP_URL}/api/auth/callback`,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session) {
      await ctx.db.delete(sessions).where(eq(sessions.id, ctx.session.id));
    }
    return { success: true };
  }),

  me: protectedProcedure.query(({ ctx }) => ctx.user),

  updateProfile: protectedProcedure
    .input(z.object({ bio: z.string().max(500).optional(), name: z.string().min(1).optional() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({ ...input })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return updated;
    }),
});

export async function handleGoogleCallback(code: string): Promise<{ sessionId: string; expiresAt: Date }> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${APP_URL}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json() as any;
  if (!tokens.access_token) throw new Error("No access token");

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const googleUser = await userRes.json() as any;

  const existingAccount = await db.query.accounts.findFirst({
    where: eq(accounts.providerAccountId, googleUser.id),
  });

  let userId: string;

  if (existingAccount) {
    userId = existingAccount.userId;
    await db.update(users).set({ name: googleUser.name, image: googleUser.picture })
      .where(eq(users.id, userId));
  } else {
    userId = randomUUID();
    const allUsers = await db.select().from(users);
    const isFirst = allUsers.length === 0;

    await db.insert(users).values({
      id: userId,
      name: googleUser.name,
      email: googleUser.email,
      image: googleUser.picture,
      role: isFirst ? "admin" : "user",
      status: isFirst ? "active" : "pending",
    });

    await db.insert(accounts).values({
      id: randomUUID(),
      userId,
      provider: "google",
      providerAccountId: googleUser.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
    });
  }

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: sessionId, userId, expiresAt });

  return { sessionId, expiresAt };
}
