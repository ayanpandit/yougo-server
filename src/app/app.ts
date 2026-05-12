import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

import { corsOptions } from "@/config";
import { requestId } from "@/middleware";
import { apiRoutes } from "@/routes";
import type { AppBindings } from "@/types/hono";

export const createApp = () => {
  const app = new Hono<AppBindings>();

  app.use("*", logger());
  app.use("*", requestId);
  app.use("*", cors(corsOptions));
  app.use("*", secureHeaders());
  app.use("*", prettyJSON());

  app.route("/api", apiRoutes);

  app.notFound((c) => c.json({ message: "Not Found" }, 404));

  app.onError((err, c) => {
    console.error(err);
    return c.json(
      { message: "Internal Server Error", requestId: c.req.header("x-request-id") },
      500,
    );
  });

  return app;
};
