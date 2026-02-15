import type { AuditReport, BudgetViolation } from "./types.js";

function fmtNumber(n: number, maxFractionDigits: number): string {
	// deterministic-ish formatting: avoid locale commas
	const s = n.toFixed(maxFractionDigits);
	// trim trailing zeros
	return s.replace(/\.?0+$/, "");
}

function fmtBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${fmtNumber(kb, 1)} KB`;
	const mb = kb / 1024;
	if (mb < 1024) return `${fmtNumber(mb, 2)} MB`;
	const gb = mb / 1024;
	return `${fmtNumber(gb, 3)} GB`;
}

function formatViolation(v: BudgetViolation): string {
	const unit = v.unit === "count" ? "" : "";
	const actual = v.unit === "bytes" ? fmtBytes(v.actual) : String(v.actual);
	const limit = v.unit === "bytes" ? fmtBytes(v.limit) : String(v.limit);
	const delta = v.unit === "bytes" ? fmtBytes(v.delta) : String(v.delta);
	void unit;
	return `${v.id}: actual=${actual} limit=${limit} (+${delta})`;
}

export function formatAuditSummary(report: AuditReport) {
	const status = report.pass ? "PASS" : "FAIL";

	const lines: string[] = [];

	lines.push(`[AUDIT] ${status} (${report.violations.length} violation(s))`);

	lines.push(
		`transfer=${fmtBytes(report.totals.transferBytes)} requests=${report.totals.requestCount} js=${fmtBytes(report.totals.jsBytes)} css=${fmtBytes(report.totals.cssBytes)} images=${fmtBytes(report.totals.imageBytes)}`,
	);

	if (!report.pass) {
		const max = 5;
		const shown = report.violations.slice(0, max);
		for (const v of shown) lines.push(`- ${formatViolation(v)}`);
		if (report.violations.length > max) {
			lines.push(
				`… and ${report.violations.length - max} more (see dist/audit.json)`,
			);
		}
	} else {
		lines.push(`See dist/audit.json for details.`);
	}

	return lines.join("\n");
}
