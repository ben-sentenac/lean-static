import path from "node:path";
import { readJSONSafe } from "../core/json/read-json-safe.js";
import { parseSiteConfig } from "../core/validate/site-config.js";
import { logger } from "../lib/logger.js";

const raw = await readJSONSafe(
	path.join(process.cwd(), "config/site.config.json"),
);
const site = parseSiteConfig(raw);

logger.info(site);
