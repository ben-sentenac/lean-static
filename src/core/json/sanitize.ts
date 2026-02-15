import { isPlainObject } from "../validate/utils.js";

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function sanitize(value: unknown, path = "root"): unknown {
	if (Array.isArray(value)) {
		return value.map((v, i) => sanitize(v, `${path}[${i}]`));
	}

	if (isPlainObject(value)) {
		const out: Record<string, unknown> = Object.create(null);
		for (const [k, v] of Object.entries(value)) {
			if (FORBIDDEN_KEYS.has(k)) {
				throw new Error(`Forbidden key "${k}" at ${path}`);
			}
			out[k] = sanitize(v, `${path}.${k}`);
		}
		return out;
	}

	// primitives (string/number/bool/null)

	if (
		value === null ||
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return value;
	}

	// anything else (functions, symbols, bigints...) should not exist in JSON anyway
	throw new Error(`Invalid JSON value at ${path}`);
}
