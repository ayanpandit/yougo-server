import type { Context } from "hono";
import { getHealthStatus } from "@/services/health.service";

export const getHealth = async (c: Context) => {
  const status = await getHealthStatus();
  return c.json(status);
};
