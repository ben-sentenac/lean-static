// src/core/validate/budgetConfig.ts
import type { Budget } from "../audit/types.js";
import {
	assertNoUnknownKeys,
	isPlainObject,
	readBoolean,
	readOptionalNonNegativeInt,
	readOptionalNonNegativeNumber,
} from "../utils/utils.js";

export function parseBudgetConfig(input: unknown): Budget | undefined {
	if (typeof input === "undefined") return undefined;
	if (!isPlainObject(input))
		throw new Error(`Invalid "budgets": expected object.`);

	assertNoUnknownKeys(
		input,
		[
			"strict",
			"maxTransferBytes",
			"maxRequests",
			"maxJsBytes",
			"maxCssBytes",
			"maxImageBytes",
			"maxSingleImageBytes",
			"estimate",
		],
		`"budgets"`,
	);

	const strict = readBoolean(input, "strict", false);

	const budget: Budget = {
		strict,
		maxTransferBytes: readOptionalNonNegativeInt(input, "maxTransferBytes"),
		maxRequests: readOptionalNonNegativeInt(input, "maxRequests"),
		maxJsBytes: readOptionalNonNegativeInt(input, "maxJsBytes"),
		maxCssBytes: readOptionalNonNegativeInt(input, "maxCssBytes"),
		maxImageBytes: readOptionalNonNegativeInt(input, "maxImageBytes"),
		maxSingleImageBytes: readOptionalNonNegativeInt(
			input,
			"maxSingleImageBytes",
		),
		estimate: parseEstimateConfig((input as Record<string, unknown>).estimate),
	};

	// Invariant utile: si maxJsBytes = 0 => pas de JS autorisé.
	// Rien de plus ici; pas de logique cachée.

	return budget;
}

function parseEstimateConfig(input: unknown) {
	if (typeof input === "undefined") return undefined;
	if (!isPlainObject(input))
		throw new Error(`Invalid "budgets.estimate": expected object.`);

	assertNoUnknownKeys(
		input,
		["enabled", "requestOverheadBytes", "kwhPerGB", "emissionFactor_gPerKwh"],
		`"budgets.estimate"`,
	);

	const enabled = readBoolean(input, "enabled", true);

	const requestOverheadBytes = readOptionalNonNegativeInt(
		input,
		"requestOverheadBytes",
	);
	const kwhPerGB = readOptionalNonNegativeNumber(input, "kwhPerGB");
	const emissionFactor_gPerKwh = readOptionalNonNegativeNumber(
		input,
		"emissionFactor_gPerKwh",
	);

	return {
		enabled,
		requestOverheadBytes: requestOverheadBytes ?? 2048,
		kwhPerGB: kwhPerGB ?? 0.5,
		emissionFactor_gPerKwh,
	};
}
