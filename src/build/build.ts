import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { auditDist } from "../core/audit/auditDist.js";
import { auditDistWithSummary } from "../core/audit/auditDistWithSummary.js";
import { readJSONSafe } from "../core/json/readJsonSafe.js";
import { parseSiteConfig } from "../core/validate/siteConfig.js";
import { logger } from "../lib/logger.js";
import type { SiteConfig } from "./types.js";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");

const SITE_JSON = path.join(ROOT, "config", "site.config.json");

const PUBLIC_DIR = path.join(ROOT, "src", "public");
const STYLES_DIR = path.join(ROOT, "src", "styles");

export async function build(): Promise<void> {
	await cleanDist(DIST_DIR);

	const siteConfig = await loadSiteConfig(SITE_JSON);

	// TEMP: on vérifie qu’on arrive ici
	logger.debug(`[build] config loaded: ${siteConfig.name}`);

	// next:
	// - copyPublic()
	// - buildCss()
	// - loadContent()
	// - renderPages()

	await copyPublic(PUBLIC_DIR, DIST_DIR);

	await buildCss({
		inFile: path.join(STYLES_DIR, "main.css"),
		outFile: path.join(DIST_DIR, "assets", "main.css"),
	});

	if (siteConfig.budgets) {
		await auditDistWithSummary({
			distDir: "dist",
			budget: siteConfig.budgets,
		});
	}

	logger.debug("[build] ok");
}

/**
 * Copy src/public -> dist
 * Safe-by-design choices:
 * - refuse symlinks (avoid copying unexpected targets)
 * - refuse escaping the source root (basic path traversal defense)
 */
async function copyPublic(srcDir: string, destDir: string): Promise<void> {
	if (!fs.existsSync(srcDir)) return;

	// Copy contents of srcDir INTO destDir (not nesting srcDir name)
	await copyDirNoSymlinks(srcDir, destDir, srcDir);
}

async function copyDirNoSymlinks(
	currentSrc: string,
	currentDest: string,
	srcRoot: string,
): Promise<void> {
	// Ensure we are not escaping srcRoot (defense in depth)
	const rel = path.relative(srcRoot, currentSrc);
	if (rel.startsWith("..") || path.isAbsolute(rel)) {
		throw new Error(`Refusing to read outside public root: ${currentSrc}`);
	}

	ensureDir(currentDest);

	const entries = await fsp.readdir(currentSrc, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = path.join(currentSrc, entry.name);
		const destPath = path.join(currentDest, entry.name);

		// lstat to detect symlinks
		const st = await fsp.lstat(srcPath);
		if (st.isSymbolicLink()) {
			throw new Error(`Refusing symlink in public/: ${srcPath}`);
		}

		if (entry.isDirectory()) {
			await copyDirNoSymlinks(srcPath, destPath, srcRoot);
		} else if (entry.isFile()) {
			ensureDir(path.dirname(destPath));
			await fsp.copyFile(srcPath, destPath);
		} else {
			// sockets/FIFOs/etc. should not exist in a repo
			throw new Error(`Unsupported file type in public/: ${srcPath}`);
		}
	}
}

async function buildCss(opts: {
	inFile: string;
	outFile: string;
}): Promise<void> {
	const css = await fsp.readFile(opts.inFile, "utf-8");

	// MVP: no minify yet (we'll add later)
	ensureDir(path.dirname(opts.outFile));
	await fsp.writeFile(opts.outFile, css, "utf-8");
}

async function cleanDist(distDir: string): Promise<void> {
	// 1) supprime dist/ (si existe)
	await fsp.rm(distDir, { recursive: true, force: true });
	// 2) recrée dist/
	ensureDir(distDir);
}

async function loadSiteConfig(filePath: string): Promise<SiteConfig> {
	const raw = await readJSONSafe<unknown>(filePath);
	const site = parseSiteConfig(raw);
	return site;
}

function ensureDir(dirPath: string): void {
	fs.mkdirSync(dirPath, { recursive: true });
}

// CLI entrypoint
if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	build().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
