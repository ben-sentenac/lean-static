// src/core/audit/formatAuditSummary.test.ts

import assert from "node:assert/strict";
import test from "node:test";
import { formatAuditSummary } from "./formatAuditSummary.js";
import type { AuditReport } from "./types.js";

test("formatAuditSummary prints PASS with estimated", () => {
	const report: AuditReport = {
		version: 1,
		generatedAt: "2026-02-15T00:00:00.000Z",
		distDir: "dist",
		budget: { strict: true },
		totals: {
			transferBytes: 1000,
			requestCount: 2,
			htmlBytes: 1000,
			cssBytes: 0,
			jsBytes: 0,
			imageBytes: 0,
			fontBytes: 0,
			otherBytes: 0,
		},
		estimated: {
			model: { version: 1, requestOverheadBytes: 2048, kwhPerGB: 0.5 },
			adjustedTransferBytes: 5096,
			energy_kWh: 0.000002548,
		},
		topAssets: [],
		violations: [],
		pass: true,
	};

	const s = formatAuditSummary(report);
	assert.match(s, /\[AUDIT\] PASS/);
	assert.match(s, /transfer=1000 B requests=2 js=0 B css=0 B images=0 B\n/);
});

test("formatAuditSummary prints FAIL with violations", () => {
	const report: AuditReport = {
		version: 1,
		generatedAt: "2026-02-15T00:00:00.000Z",
		distDir: "dist",
		budget: { strict: true, maxJsBytes: 0 },
		totals: {
			transferBytes: 10,
			requestCount: 1,
			htmlBytes: 0,
			cssBytes: 0,
			jsBytes: 10,
			imageBytes: 0,
			fontBytes: 0,
			otherBytes: 0,
		},
		topAssets: [{ path: "app.js", bytes: 10, kind: "js" }],
		violations: [
			{
				id: "js",
				message: "Total JS size exceeds budget.",
				actual: 10,
				limit: 0,
				unit: "bytes",
				delta: 10,
			},
		],
		pass: false,
	};

	const s = formatAuditSummary(report);
	assert.match(s, /\[AUDIT\] FAIL/);
	assert.match(s, /js: actual=10 B limit=0 B/);
});
