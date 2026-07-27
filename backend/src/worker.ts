/**
 * Background worker entry (AGENTS §8, Choonvia's area). Polls the jobs table
 * and runs AI conversion / PDF jobs. Same repo, same models, same types as the
 * API — not a microservice. env.ts throws here if the environment is invalid.
 */
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { startPoller } from "@/jobs/poller";

logger.info({ env: env.NODE_ENV }, "worker starting");
startPoller();
