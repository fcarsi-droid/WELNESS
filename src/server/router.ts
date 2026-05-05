import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";
import { moodRouter } from "./routers/mood";
import { sleepRouter } from "./routers/sleep";
import { hydrationRouter } from "./routers/hydration";
import { caloriesRouter } from "./routers/calories";

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  mood: moodRouter,
  sleep: sleepRouter,
  hydration: hydrationRouter,
  calories: caloriesRouter,
});

export type AppRouter = typeof appRouter;
