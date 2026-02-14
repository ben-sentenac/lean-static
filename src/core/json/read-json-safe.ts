import fs, { readFile } from "node:fs/promises";
import { sanitize } from "./sanitize.js";

export async function readJSONSafe<T = unknown>(filePath: string): Promise<T> {
	const raw = await readFile(filePath, "utf8");

	//avoid big file in memory
	if (raw.length > 200_000) {
		throw new Error(`Config too large: ${filePath}`);
	}

	const parsed = JSON.parse(raw) as unknown;

	const safe = sanitize(parsed);
	return safe as T;
}
