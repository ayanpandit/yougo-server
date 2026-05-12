import { env } from "@/config";
import { APP_VERSION } from "@/constants";
import { checkDatabase } from "@/repositories/health.repository";
import type { HealthStatus } from "@/types/health";

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const dbOk = await checkDatabase();

  return {
    status: dbOk ? "ok" : "degraded",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    dependencies: {
      database: dbOk ? "up" : "down",
    },
  };
};
