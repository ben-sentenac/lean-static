// src/core/audit/computeAuditReport.test.ts

import assert from "node:assert/strict";
import test from "node:test";
import { computeAuditReport } from "./computeAuditReport.js";
import type { AuditedAsset, Budget } from "./types.js";

test("computeAuditReport computes totals and detects violations", () => {
	const assets: AuditedAsset[] = [
		{ path: "index.html", bytes: 10_000, kind: "html" },
		{ path: "styles.css", bytes: 20_000, kind: "css" },
		{ path: "app.js", bytes: 1, kind: "js" },
		{ path: "hero.webp", bytes: 50_000, kind: "image" },
	];

	const budget: Budget = {
		strict: true,
		maxTransferBytes: 60_000,
		maxRequests: 3,
		maxJsBytes: 0,
		maxCssBytes: 30_000,
		maxImageBytes: 40_000,
		maxSingleImageBytes: 49_000,
	};

	const report = computeAuditReport({
		assets,
		budget,
		distDir: "dist",
		now: new Date("2026-02-14T00:00:00.000Z"),
	});

	assert.equal(report.totals.transferBytes, 80_001);
	assert.equal(report.totals.requestCount, 4);
	assert.equal(report.totals.jsBytes, 1);
	assert.equal(report.totals.imageBytes, 50_000);

	assert.equal(report.pass, false);
	const ids = report.violations.map((v) => v.id).sort();
	assert.deepEqual(
		ids,
		["images", "js", "requests", "singleImage", "transfer"].sort(),
	);

	assert.ok(report.estimated);
	assert.equal(report.estimated.model.version, 1);
	assert.equal(
		report.estimated.adjustedTransferBytes,
		report.totals.transferBytes + report.totals.requestCount * 2048,
	);
	assert.ok(report.estimated.energy_kWh >= 0);
});
