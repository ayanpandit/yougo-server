import { Hono } from "hono";
import { getHealth } from "@/controllers/health.controller";

export const healthRoutes = new Hono();

healthRoutes.get("/health", getHealth);
