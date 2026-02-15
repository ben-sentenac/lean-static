// src/core/audit/computeAuditReport.ts
import type {
	AuditedAsset,
	AuditReport,
	AuditTotals,
	Budget,
	BudgetViolation,
	EstimateResult,
} from "./types.js";

export function computeAuditReport(
	params: Readonly<{
		assets: ReadonlyArray<AuditedAsset>;
		budget: Budget;
		distDir: string;
		now?: Date;
		topN?: number;
	}>,
): AuditReport {
	const now = params.now ?? new Date();
	const topN = params.topN ?? 20;

	const totals = computeTotals(params.assets);
	const violations = computeViolations(params.assets, totals, params.budget);

	const estimated = computeEstimated(totals, params.budget);

	const topAssets = [...params.assets]
		.sort((a, b) => b.bytes - a.bytes)
		.slice(0, topN);

	return {
		version: 1,
		generatedAt: now.toISOString(),
		distDir: params.distDir,
		budget: params.budget,
		totals,
		topAssets,
		violations,
		pass: violations.length === 0,
		estimated,
	};
}

function computeTotals(assets: ReadonlyArray<AuditedAsset>): AuditTotals {
	let transferBytes = 0;
	let requestCount = 0;

	let htmlBytes = 0;
	let cssBytes = 0;
	let jsBytes = 0;
	let imageBytes = 0;
	let fontBytes = 0;
	let otherBytes = 0;

	for (const a of assets) {
		transferBytes += a.bytes;
		requestCount += 1;

		switch (a.kind) {
			case "html":
				htmlBytes += a.bytes;
				break;
			case "css":
				cssBytes += a.bytes;
				break;
			case "js":
				jsBytes += a.bytes;
				break;
			case "image":
				imageBytes += a.bytes;
				break;
			case "font":
				fontBytes += a.bytes;
				break;
			default:
				otherBytes += a.bytes;
				break;
		}
	}

	return {
		transferBytes,
		requestCount,
		htmlBytes,
		cssBytes,
		jsBytes,
		imageBytes,
		fontBytes,
		otherBytes,
	};
}

function computeViolations(
	assets: ReadonlyArray<AuditedAsset>,
	totals: AuditTotals,
	budget: Budget,
): BudgetViolation[] {
	const violations: BudgetViolation[] = [];

	pushIfOver(violations, {
		id: "transfer",
		actual: totals.transferBytes,
		limit: budget.maxTransferBytes,
		unit: "bytes",
		message: "Total transfer size exceeds budget.",
	});

	pushIfOver(violations, {
		id: "requests",
		actual: totals.requestCount,
		limit: budget.maxRequests,
		unit: "count",
		message: "Total request count exceeds budget.",
	});

	pushIfOver(violations, {
		id: "js",
		actual: totals.jsBytes,
		limit: budget.maxJsBytes,
		unit: "bytes",
		message: "Total JS size exceeds budget.",
	});

	pushIfOver(violations, {
		id: "css",
		actual: totals.cssBytes,
		limit: budget.maxCssBytes,
		unit: "bytes",
		message: "Total CSS size exceeds budget.",
	});

	pushIfOver(violations, {
		id: "images",
		actual: totals.imageBytes,
		limit: budget.maxImageBytes,
		unit: "bytes",
		message: "Total image size exceeds budget.",
	});

	if (typeof budget.maxSingleImageBytes === "number") {
		for (const a of assets) {
			if (a.kind !== "image") continue;
			if (a.bytes <= budget.maxSingleImageBytes) continue;

			violations.push({
				id: "singleImage",
				message: `Image "${a.path}" exceeds single-image budget.`,
				actual: a.bytes,
				limit: budget.maxSingleImageBytes,
				unit: "bytes",
				delta: a.bytes - budget.maxSingleImageBytes,
			});
		}
	}

	return violations;
}

function pushIfOver(
	out: BudgetViolation[],
	p: Readonly<{
		id: BudgetViolation["id"];
		message: string;
		actual: number;
		limit: number | undefined;
		unit: BudgetViolation["unit"];
	}>,
) {
	if (typeof p.limit !== "number") return;
	if (p.actual <= p.limit) return;

	out.push({
		id: p.id,
		message: p.message,
		actual: p.actual,
		limit: p.limit,
		unit: p.unit,
		delta: p.actual - p.limit,
	});
}

function computeEstimated(
	totals: AuditTotals,
	budget: Budget,
): EstimateResult | undefined {
	const cfg = normalizeEstimateConfig(budget.estimate);
	if (!cfg.enabled) return undefined;

	const adjustedTransferBytes =
		totals.transferBytes + totals.requestCount * cfg.requestOverheadBytes;

	// bytes -> GB (décimal) -> kWh
	const energy_kWh = (adjustedTransferBytes / 1_000_000_000) * cfg.kwhPerGB;

	const res: EstimateResult = {
		model: {
			version: 1,
			requestOverheadBytes: cfg.requestOverheadBytes,
			kwhPerGB: cfg.kwhPerGB,
			emissionFactor_gPerKwh: cfg.emissionFactor_gPerKwh,
		},
		adjustedTransferBytes,
		energy_kWh,
	};

	if (typeof cfg.emissionFactor_gPerKwh === "number") {
		res.carbon_gCO2e = energy_kWh * cfg.emissionFactor_gPerKwh;
	}

	return res;
}

function normalizeEstimateConfig(input: Budget["estimate"]): Required<
	Pick<
		NonNullable<Budget["estimate"]>,
		"enabled" | "requestOverheadBytes" | "kwhPerGB"
	>
> & {
	emissionFactor_gPerKwh?: number;
} {
	// Valeurs par défaut “raisonnables” mais assumées heuristiques (pas scientifiques)
	const enabled = input?.enabled ?? true;
	const requestOverheadBytes = input?.requestOverheadBytes ?? 2048;
	const kwhPerGB = input?.kwhPerGB ?? 0.5;

	const emissionFactor_gPerKwh =
		typeof input?.emissionFactor_gPerKwh === "number"
			? input.emissionFactor_gPerKwh
			: undefined;

	return { enabled, requestOverheadBytes, kwhPerGB, emissionFactor_gPerKwh };
}
