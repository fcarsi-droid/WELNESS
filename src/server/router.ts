import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";
import { moodRouter } from "./routers/mood";
import { sleepRouter } from "./routers/sleep";
import { hydrationRouter } from "./routers/hydration";
import { caloriesRouter } from "./routers/calories";
import { recipesRouter } from "./routers/recipes";
import { wellnessRouter } from "./routers/wellness";
import { communityRouter } from "./routers/community";
import { culturalRouter } from "./routers/cultural";
import { bookclubRouter } from "./routers/bookclub";
import { reportsRouter } from "./routers/reports";

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  mood: moodRouter,
  sleep: sleepRouter,
  hydration: hydrationRouter,
  calories: caloriesRouter,
  recipes: recipesRouter,
  wellness: wellnessRouter,
  community: communityRouter,
  cultural: culturalRouter,
  bookclub: bookclubRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
