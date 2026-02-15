// src/build/audit/auditDistWithSummary.ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatAuditSummary } from "../../core/audit/formatAuditSummary.js";
import type { AuditReport, Budget } from "../../core/audit/types.js";
import { readJSONSafe } from "../../core/json/readJsonSafe.js";
import { logger } from "../../lib/logger.js";
import { auditDist } from "./auditDist.js";

export async function auditDistWithSummary(
	params: Readonly<{
		distDir: string;
		budget: Budget;
	}>,
): Promise<void> {
	const distAbs = path.resolve(params.distDir);
	const auditPath = path.join(distAbs, "audit.json");

	try {
		await auditDist({ distDir: params.distDir, budget: params.budget });
		const report = await readAuditReport(auditPath);
		if (report) logger.info(formatAuditSummary(report));
	} catch (err) {
		const report = await readAuditReport(auditPath);
		if (report) logger.info(formatAuditSummary(report));
		throw err;
	}
}

async function readAuditReport(auditPath: string): Promise<AuditReport | null> {
	try {
		// Sécurité: on parse via reader défensif
		const obj = (await readJSONSafe(auditPath)) as unknown;
		// Ici pas de validation complète: on a écrit nous-mêmes le fichier.
		// on pourra ajouter une validateReport v1 plus tard.
		return obj as AuditReport;
	} catch {
		return null;
	}
}
