import { access, lstat } from "node:fs/promises";
import path from "node:path";

export type UnknownRecord = Record<string, unknown>;
/**
 * Validation helpers
 */

export function expectString(v: unknown, field: string): string {
	if (typeof v !== "string" || v.trim() === "")
		throw new Error(`Invalid ${field}`);
	return v;
}

export function expectNumber(v: unknown, field: string): number {
	if (typeof v !== "number" || !Number.isFinite(v))
		throw new Error(`Invalid ${field}`);
	return v;
}

export function expectOptionalObject(
	v: unknown,
	field: string,
): Record<string, unknown> | undefined {
	if (v === undefined) return undefined;
	if (!v || typeof v !== "object" || Array.isArray(v))
		throw new Error(`Invalid ${field}`);
	return v as Record<string, unknown>;
}

export function isPlainObject(x: unknown): x is Record<string, unknown> {
	if (x === null || typeof x !== "object") return false;
	const proto = Object.getPrototypeOf(x);
	return proto === Object.prototype || proto === null;
}

export function assertNoUnknownKeys(
	obj: UnknownRecord,
	allowed: string[],
	where: string,
) {
	const allowedSet = new Set(allowed);
	for (const k of Object.keys(obj)) {
		if (!allowedSet.has(k)) {
			throw new Error(`Unknown key ${where}.${k}`);
		}
	}
}

export function readBoolean(
	obj: UnknownRecord,
	key: string,
	defaultValue: boolean,
): boolean {
	if (!(key in obj)) return defaultValue;
	const v = obj[key];
	if (typeof v !== "boolean")
		throw new Error(`Invalid "${key}": expected boolean.`);
	return v;
}

export function readOptionalNonNegativeInt(
	obj: UnknownRecord,
	key: string,
): number | undefined {
	if (!(key in obj)) return undefined;
	const v = obj[key];
	if (
		typeof v !== "number" ||
		!Number.isFinite(v) ||
		!Number.isInteger(v) ||
		v < 0
	) {
		throw new Error(`Invalid "${key}": expected non-negative integer.`);
	}
	return v;
}

export function readOptionalNonNegativeNumber(
	obj: UnknownRecord,
	key: string,
): number | undefined {
	if (!(key in obj)) return undefined;
	const v = obj[key];
	if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
		throw new Error(`Invalid "${key}": expected non-negative number.`);
	}
	return v;
}

export function readNonEmptyString(obj: UnknownRecord, key: string) {
	const v = obj[key];
	if (typeof v !== "string" || v.trim() === "") {
		throw new Error(`Invalid "${key}": expected non-empty string.`);
	}
	return v;
}

export function readOptionalString(
	obj: UnknownRecord,
	key: string,
): string | undefined {
	if (!(key in obj)) return undefined;
	const v = obj[key];
	if (typeof v !== "string")
		throw new Error(`Invalid "${key}": expected string.`);
	return v;
}

export function readOptionalBoolean(
	obj: UnknownRecord,
	key: string,
	def: boolean,
): boolean {
	if (!(key in obj)) return def;
	const v = obj[key];
	if (typeof v !== "boolean")
		throw new Error(`Invalid "${key}": expected boolean.`);
	return v;
}

export function readOptionalInt(
	obj: UnknownRecord,
	key: string,
): number | undefined {
	if (!(key in obj)) return undefined;
	const v = obj[key];
	if (typeof v !== "number" || !Number.isInteger(v)) {
		throw new Error(`Invalid "${key}": expected integer.`);
	}
	return v;
}

export function readOptionalStringArray(
	obj: UnknownRecord,
	key: string,
): string[] | undefined {
	if (!(key in obj)) return undefined;
	const v = obj[key];
	if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) {
		throw new Error(`Invalid "${key}": expected string array.`);
	}
	return v;
}

export function normalizeDateToIso(input: string): string {
	// accepte "YYYY-MM-DD" ou ISO complet
	// on normalise via Date; si invalide => throw
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) {
		throw new Error(`Invalid "date": cannot parse "${input}".`);
	}
	return d.toISOString();
}

/**
 * utils
 */

export function toPosix(p: string) {
	return p.split(path.sep).join("/");
}

export function isSafeSegment(s: string): boolean {
	// ultra simple, stable, pas d’espace, pas de caractères exotiques
	// a-z0-9 + "-" "_" seulement
	return /^[a-z0-9][a-z0-9_-]*$/i.test(s);
}

/**
 * files
 */

export async function assertSafeDirectory(dirAbs: string) {
	const st = await lstat(dirAbs);
	if (st.isSymbolicLink())
		throw new Error(`Directory must not be a symlink: ${dirAbs}`);
	if (!st.isDirectory()) throw new Error(`Not a directory: ${dirAbs}`);
}

export async function pathExists(p: string): Promise<boolean> {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}
