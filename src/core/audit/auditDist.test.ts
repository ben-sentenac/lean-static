// src/build/audit/auditDist.test.ts

import assert from "node:assert/strict";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { auditDist } from "./auditDist.js";

test("auditDist writes audit.json and can fail in strict mode", async () => {
	const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "lean-static-dist-"));
	const dist = path.join(tmp, "dist");
	await fsp.mkdir(dist);

	await fsp.writeFile(path.join(dist, "index.html"), "x".repeat(10_000));
	await fsp.writeFile(path.join(dist, "styles.css"), "x".repeat(10_000));
	await fsp.writeFile(path.join(dist, "app.js"), "x".repeat(1));

	await assert.rejects(
		auditDist({
			distDir: dist,
			budget: { strict: true, maxJsBytes: 0 },
		}),
		/Audit failed/,
	);

	const auditPath = path.join(dist, "audit.json");
	const json = JSON.parse(await fsp.readFile(auditPath, "utf8"));
	assert.equal(json.version, 1);
	assert.equal(json.pass, false);
});

test("auditDist refuses symlinks", async () => {
	const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "lean-static-dist-"));
	const dist = path.join(tmp, "dist");
	await fsp.mkdir(dist);
	// create a symlink inside dist
	const target = path.join(tmp, "outside.txt");
	await fsp.writeFile(target, "oops");
	await fsp.symlink(target, path.join(dist, "link.txt"));

	await assert.rejects(
		auditDist({
			distDir: dist,
			budget: { strict: false },
		}),
		/Symlink refused/,
	);
});
