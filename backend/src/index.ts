import { createApp } from "@/app";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

// API server entry (AGENTS §1). env.ts throws here if the environment is
// invalid — fail fast rather than boot half-configured.
const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "API server listening");
});
