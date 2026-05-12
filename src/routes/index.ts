import { Hono } from "hono";
import { authRoutes } from "@/routes/auth";
import { healthRoutes } from "@/routes/health";
import { protectedRoutes } from "@/routes/protected";

export const apiRoutes = new Hono();

apiRoutes.route("/", healthRoutes);
apiRoutes.route("/", authRoutes);
apiRoutes.route("/", protectedRoutes);
