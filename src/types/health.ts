export type HealthStatus = {
  status: "ok" | "degraded";
  environment: string;
  timestamp: string;
  version: string;
  dependencies: {
    database: "up" | "down";
  };
};
