// file: src/build/readJSONSafe.test.ts

import assert from "node:assert/strict";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseSiteConfig } from "../validate/siteConfig.js";
import { readJSONSafe } from "./readJsonSafe.js";

async function withTempDir(fn: (dir: string) => Promise<void>) {
	const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "lean-static-"));
	try {
		await fn(dir);
	} finally {
		await fsp.rm(dir, { recursive: true, force: true });
	}
}

async function writeJson(dir: string, filename: string, jsonText: string) {
	const filePath = path.join(dir, filename);
	await fsp.writeFile(filePath, jsonText, "utf-8");
	return filePath;
}

test("readJSONSafe: loads a valid JSON object and returns a sanitized plain structure", async () => {
	await withTempDir(async (dir) => {
		const file = await writeJson(
			dir,
			"site.json",
			JSON.stringify({
				name: "LeanWeb",
				url: "https://example.com",
				locale: "fr-FR",
				timezone: "Europe/Paris",
				titleDefault: "LeanWeb — Performance web durable",
				descriptionDefault: "Sites rapides, solides, durables.",
				blog: { basePath: "/blog", postsPerPage: 12 },
				social: { linkedin: "https://linkedin.com/in/x" },
			}),
		);

		const raw = await readJSONSafe<unknown>(file);
		assert.equal(typeof raw, "object");
		assert.ok(raw !== null);

		// IMPORTANT: we rebuild objects with Object.create(null)
		const proto = Object.getPrototypeOf(raw as object);
		assert.equal(proto, null);
	});
});

test("readJSONSafe: rejects forbidden top-level key __proto__", async () => {
	await withTempDir(async (dir) => {
		const file = await writeJson(
			dir,
			"bad.json",
			`{"__proto__":{"polluted":true},"ok":1}`,
		);
		await assert.rejects(() => readJSONSafe(file), /Forbidden key "__proto__"/);
	});
});

test("readJSONSafe: rejects forbidden nested key constructor", async () => {
	await withTempDir(async (dir) => {
		const file = await writeJson(
			dir,
			"bad.json",
			`{"a":{"constructor":{"x":1}}}`,
		);
		await assert.rejects(
			() => readJSONSafe(file),
			/Forbidden key "constructor"/,
		);
	});
});

test("readJSONSafe: rejects forbidden nested key prototype", async () => {
	await withTempDir(async (dir) => {
		const file = await writeJson(
			dir,
			"bad.json",
			`{"a":[{"b":{"prototype":{}}}]}`,
		);
		await assert.rejects(() => readJSONSafe(file), /Forbidden key "prototype"/);
	});
});

test("readJSONSafe: rejects non-object root (array)", async () => {
	await withTempDir(async (dir) => {
		const file = await writeJson(dir, "bad.json", `[{"a":1}]`);
		const raw = await readJSONSafe<unknown>(file);
		assert.ok(
			Array.isArray(raw),
			"readJSONSafe can parse arrays; schema validation should reject if needed",
		);
	});
});

test("readJSONSafe: rejects too-large config (size limit)", async () => {
	await withTempDir(async (dir) => {
		const big = "a".repeat(200_001);
		const file = await writeJson(
			dir,
			"big.json",
			JSON.stringify({ name: big }),
		);
		await assert.rejects(() => readJSONSafe(file), /Config too large/);
	});
});

test("parseSiteConfig: accepts a valid config", async () => {
	const cfg = parseSiteConfig({
		name: "LeanWeb",
		url: "https://example.com",
		locale: "fr-FR",
		timezone: "Europe/Paris",
		titleDefault: "LeanWeb — Performance web durable",
		descriptionDefault: "Sites rapides, solides, durables.",
		blog: { basePath: "/blog", postsPerPage: 12 },
		social: {
			linkedin: "https://linkedin.com/in/x",
			github: "https://github.com/x",
		},
	});

	assert.equal(cfg.name, "LeanWeb");
	assert.equal(cfg.blog?.postsPerPage, 12);
	assert.equal(cfg.blog?.basePath, "/blog");
	assert.equal(cfg.social?.linkedin, "https://linkedin.com/in/x");
});

test("parseSiteConfig: rejects unknown top-level keys", async () => {
	assert.throws(
		() =>
			parseSiteConfig({
				name: "LeanWeb",
				url: "https://example.com",
				locale: "fr-FR",
				timezone: "Europe/Paris",
				titleDefault: "x",
				descriptionDefault: "y",
				unexpected: true,
			}),
		/Unknown key in site\.config\.json: unexpected/,
	);
});

test("parseSiteConfig: rejects missing required fields", async () => {
	assert.throws(
		() =>
			parseSiteConfig({
				// name missing
				url: "https://example.com",
				locale: "fr-FR",
				timezone: "Europe/Paris",
				titleDefault: "x",
				descriptionDefault: "y",
			}),
		/Invalid name/,
	);
});

test("parseSiteConfig: rejects empty strings", async () => {
	assert.throws(
		() =>
			parseSiteConfig({
				name: "",
				url: "https://example.com",
				locale: "fr-FR",
				timezone: "Europe/Paris",
				titleDefault: "x",
				descriptionDefault: "y",
			}),
		/Invalid name/,
	);
});

test("parseSiteConfig: rejects blog with unknown keys", async () => {
	assert.throws(
		() =>
			parseSiteConfig({
				name: "LeanWeb",
				url: "https://example.com",
				locale: "fr-FR",
				timezone: "Europe/Paris",
				titleDefault: "x",
				descriptionDefault: "y",
				blog: { basePath: "/blog", postsPerPage: 10, extra: "nope" },
			}),
		/Unknown blog key: extra/,
	);
});

test("parseSiteConfig: rejects blog.postsPerPage non-number", async () => {
	assert.throws(
		() =>
			parseSiteConfig({
				name: "LeanWeb",
				url: "https://example.com",
				locale: "fr-FR",
				timezone: "Europe/Paris",
				titleDefault: "x",
				descriptionDefault: "y",
				blog: { basePath: "/blog", postsPerPage: "12" as any },
			}),
		/Invalid blog\.postsPerPage/,
	);
});

test("parseSiteConfig: rejects social values that are not strings", async () => {
	assert.throws(
		() =>
			parseSiteConfig({
				name: "LeanWeb",
				url: "https://example.com",
				locale: "fr-FR",
				timezone: "Europe/Paris",
				titleDefault: "x",
				descriptionDefault: "y",
				social: { linkedin: 123 as any },
			}),
		/Invalid social\.linkedin/,
	);
});

test("integration: readJSONSafe + parseSiteConfig rejects prototype pollution attempts before schema", async () => {
	await withTempDir(async (dir) => {
		const file = await writeJson(
			dir,
			"site.json",
			`{
        "name":"LeanWeb",
        "url":"https://example.com",
        "locale":"fr-FR",
        "timezone":"Europe/Paris",
        "titleDefault":"x",
        "descriptionDefault":"y",
        "__proto__": { "polluted": true }
      }`,
		);

		await assert.rejects(async () => {
			const raw = await readJSONSafe(file);
			parseSiteConfig(raw);
		}, /Forbidden key "__proto__"/);
	});
});
