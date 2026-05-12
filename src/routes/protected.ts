import { Hono } from "hono";
import { requireAuth } from "@/middleware";
import type { AppBindings } from "@/types/hono";

export const protectedRoutes = new Hono<AppBindings>();

protectedRoutes.get("/protected/me", requireAuth, (c) => {
  const user = c.get("user");
  const session = c.get("session");
  return c.json({ user, session });
});
