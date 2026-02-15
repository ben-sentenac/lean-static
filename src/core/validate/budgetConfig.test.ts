// src/core/validate/budgetConfig.test.ts

import assert from "node:assert/strict";
import test from "node:test";
import { parseBudgetConfig } from "./budgetConfig.js";

test("parseBudgetConfig accepts valid budgets and applies defaults", () => {
	const b = parseBudgetConfig({ maxJsBytes: 0, strict: true });
	assert.ok(b);
	assert.equal(b.strict, true);
	assert.equal(b.maxJsBytes, 0);
	assert.equal(b.maxTransferBytes, undefined);
});

test("parseBudgetConfig rejects unknown keys", () => {
	assert.throws(
		() => parseBudgetConfig({ strict: false, nope: 1 }),
		/Unknown key "budgets"\.nope/,
	);
});

test("parseBudgetConfig rejects negative values", () => {
	assert.throws(
		() => parseBudgetConfig({ strict: false, maxCssBytes: -1 }),
		/expected non-negative integer/,
	);
});

test("parseBudgetConfig validates budgets.estimate", () => {
	const b = parseBudgetConfig({
		strict: false,
		estimate: { enabled: true, requestOverheadBytes: 1000, kwhPerGB: 0.2 },
	});
	assert.ok(b?.estimate);
	assert.equal(b.estimate.requestOverheadBytes, 1000);
	assert.equal(b.estimate.kwhPerGB, 0.2);
});
