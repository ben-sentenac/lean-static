import type { SiteConfig } from "../../build/types.js";

function expectString(v: unknown, field: string): string {
	if (typeof v !== "string" || v.trim() === "")
		throw new Error(`Invalid ${field}`);
	return v;
}

function expectNumber(v: unknown, field: string): number {
	if (typeof v !== "number" || !Number.isFinite(v))
		throw new Error(`Invalid ${field}`);
	return v;
}

function expectOptionalObject(
	v: unknown,
	field: string,
): Record<string, unknown> | undefined {
	if (v === undefined) return undefined;
	if (!v || typeof v !== "object" || Array.isArray(v))
		throw new Error(`Invalid ${field}`);
	return v as Record<string, unknown>;
}

const ALLOWED_TOP_KEYS = new Set([
	"name",
	"url",
	"locale",
	"timezone",
	"titleDefault",
	"descriptionDefault",
	"blog",
	"social",
]);

export function parseSiteConfig(input: unknown): SiteConfig {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new Error("site.json must be an object");
	}
	const obj = input as Record<string, unknown>;

	// refuse unknown keys
	for (const k of Object.keys(obj)) {
		if (!ALLOWED_TOP_KEYS.has(k))
			throw new Error(`Unknown key in site.json: ${k}`);
	}

	const blogObj = expectOptionalObject(obj.blog, "blog");
	const socialObj = expectOptionalObject(obj.social, "social");

	const cfg: SiteConfig = {
		name: expectString(obj.name, "name"),
		url: expectString(obj.url, "url"),
		locale: expectString(obj.locale, "locale"),
		timezone: expectString(obj.timezone, "timezone"),
		titleDefault: expectString(obj.titleDefault, "titleDefault"),
		descriptionDefault: expectString(
			obj.descriptionDefault,
			"descriptionDefault",
		),
	};

	if (blogObj) {
		// allowed blog keys
		const allowedBlog = new Set(["basePath", "postsPerPage"]);
		for (const k of Object.keys(blogObj))
			if (!allowedBlog.has(k)) throw new Error(`Unknown blog key: ${k}`);

		cfg.blog = {
			basePath: expectString(blogObj.basePath, "blog.basePath"),
			postsPerPage: expectNumber(blogObj.postsPerPage, "blog.postsPerPage"),
		};
	}

	if (socialObj) {
		// social: map string->string, refuse non-string
		const out: Record<string, string> = Object.create(null);
		for (const [k, v] of Object.entries(socialObj)) {
			if (typeof v !== "string") throw new Error(`Invalid social.${k}`);
			out[k] = v;
		}
		cfg.social = out;
	}

	return cfg;
}
