export type UnknownRecord = Record<string, unknown>;

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
