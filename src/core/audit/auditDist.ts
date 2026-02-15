import { lstat, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { computeAuditReport } from "./computeAuditReport.js";
import type { AuditedAsset, Budget } from "./types.js";

export type AuditDistOptions = {
	distDir: string; //ex:dist
	budget: Budget;
	//if true include audit.json into stats default:false
	includeAuditFile?: boolean;
};

export async function auditDist(options: AuditDistOptions): Promise<void> {
	const distAbs = path.resolve(options.distDir);

	const assets = await collectDistAssets(distAbs, {
		includeAuditFile: options.includeAuditFile ?? false,
	});

	const report = computeAuditReport({
		assets,
		budget: options.budget,
		distDir: options.distDir,
	});

	const outPath = path.join(distAbs, "audit.json");
	await writeJsonAtomic(outPath, report);

	if (options.budget.strict && !report.pass) {
		const first = report.violations[0];
		throw new Error(
			`Audit failed (${report.violations.length} violation(s)). First: ${first.id} actual=${first.actual} limit=${first.limit}`,
		);
	}
}

async function collectDistAssets(
	distAbs: string,
	opts: Readonly<{ includeAuditFile: boolean }>,
): Promise<AuditedAsset[]> {
	//don'tscan if dist not real dir
	const st = await lstat(distAbs);
	if (!st.isDirectory())
		throw new Error(`distDir is not a directory: ${distAbs}`);
	if (st.isSymbolicLink())
		throw new Error(`distDir must not be a symlink: ${distAbs}`);

	const out: AuditedAsset[] = [];
	await walk(distAbs, distAbs, out, opts);
	return out;
}

function toPosix(p: string) {
	return p.split(path.sep).join("/");
}

async function walk(
	rootAbs: string,
	dirAbs: string,
	out: AuditedAsset[],
	opts: Readonly<{ includeAuditFile: boolean }>,
) {
	const entries = await readdir(dirAbs, { withFileTypes: true });

	for (const ent of entries) {
		const abs = path.join(dirAbs, ent.name);

		//avoid symlinks
		const lst = await lstat(abs);

		if (lst.isSymbolicLink()) {
			throw new Error(`Symlink refused in dist: ${abs}`);
		}

		if (lst.isDirectory()) {
			await walk(rootAbs, abs, out, opts);
			continue;
		}

		if (!lst.isFile()) continue;

		const rel = toPosix(path.relative(rootAbs, abs));
		if (!opts.includeAuditFile && rel === "audit.json") continue;

		const kind = classifyByExtension(rel);
		out.push({ path: rel, bytes: lst.size, kind });
	}
}

function classifyByExtension(relPath: string) {
	const ext = path.extname(relPath).toLowerCase();

	if (ext === ".html") return "html";
	if (ext === ".css") return "css";
	if (ext === ".js" || ext === ".mjs") return "js";

	// images
	if (
		ext === ".png" ||
		ext === ".jpg" ||
		ext === ".jpeg" ||
		ext === ".webp" ||
		ext === ".avif" ||
		ext === ".gif" ||
		ext === ".svg"
	) {
		return "image";
	}

	// fonts
	if (
		ext === ".woff" ||
		ext === ".woff2" ||
		ext === ".ttf" ||
		ext === ".otf" ||
		ext === ".eot"
	) {
		return "font";
	}

	return "other";
}

async function writeJsonAtomic(fileAbs: string, value: unknown) {
	const dir = path.dirname(fileAbs);
	const tmp = path.join(
		dir,
		`.tmp.${path.basename(fileAbs)}.${process.pid}.${Date.now()}`,
	);

	const json = JSON.stringify(value, null, 2) + "\n";
	await writeFile(tmp, json, { encoding: "utf8", flag: "wx" });
	await rename(tmp, fileAbs);
}
