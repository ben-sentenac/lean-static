// src/core/routes/buildRoutes.ts
import type { LoadedContent } from "../content/types.js";
import type { Route, RoutesConfig } from "./types.js";

export function buildRoutes(
	content: LoadedContent,
	cfg?: Partial<RoutesConfig>,
): ReadonlyArray<Route> {
	const config: RoutesConfig = normalizeConfig(cfg);

	const routes: Route[] = [];

	// Pages
	for (const p of content.pages) {
		if (p.draft) continue;

		const urlPath = pageUrlPath(p.slug, config.homeSlug);
		const outFile = urlToOutFile(urlPath);

		routes.push({
			kind: "page",
			urlPath,
			outFile,
			template: "page",
			ref: { contentKind: "page", slug: p.slug },
		});
	}

	// Posts
	for (const post of content.posts) {
		if (post.draft) continue;

		const urlPath = ensureSlash(`/${config.postsBase}/${post.slug}/`);
		const outFile = urlToOutFile(urlPath);

		routes.push({
			kind: "post",
			urlPath,
			outFile,
			template: "post",
			ref: { contentKind: "post", slug: post.slug },
		});
	}

	// Listing minimal (blog index) — utile dès maintenant, même sans pagination
	routes.push({
		kind: "listing",
		urlPath: ensureSlash(`/${config.postsBase}/`),
		outFile: urlToOutFile(ensureSlash(`/${config.postsBase}/`)),
		template: "posts-index",
	});

	assertNoOutputCollisions(routes);

	return Object.freeze(routes);
}

function normalizeConfig(cfg?: Partial<RoutesConfig>): RoutesConfig {
	const postsBase = (cfg?.postsBase ?? "blog").trim();
	const homeSlug = (cfg?.homeSlug ?? "index").trim();

	if (!isSafeSegment(postsBase)) {
		throw new Error(`Invalid postsBase "${postsBase}"`);
	}
	if (!isSafeSegment(homeSlug)) {
		throw new Error(`Invalid homeSlug "${homeSlug}"`);
	}

	return { postsBase, homeSlug };
}

function pageUrlPath(slug: string, homeSlug: string): string {
	if (slug === homeSlug) return "/";
	return ensureSlash(`/${slug}/`);
}

function ensureSlash(urlPath: string): string {
	if (!urlPath.startsWith("/")) urlPath = `/${urlPath}`;
	return urlPath.endsWith("/") ? urlPath : `${urlPath}/`;
}

function urlToOutFile(urlPath: string): string {
	// "/" -> "index.html"
	if (urlPath === "/") return "index.html";

	// "/about/" -> "about/index.html"
	const trimmed = urlPath.replace(/^\/+/, "").replace(/\/+$/, "");
	if (trimmed === "") return "index.html";

	// Normalisation "safe" : on refuse les segments suspects ici aussi
	const segments = trimmed.split("/").filter(Boolean);
	for (const seg of segments) {
		if (!isSafeSegment(seg)) {
			throw new Error(`Unsafe url segment "${seg}" from urlPath "${urlPath}"`);
		}
	}

	return `${segments.join("/")}/index.html`;
}

function isSafeSegment(s: string): boolean {
	return /^[a-z0-9][a-z0-9_-]*$/i.test(s);
}

function assertNoOutputCollisions(routes: ReadonlyArray<Route>) {
	const seen = new Map<string, Route>();
	for (const r of routes) {
		const existing = seen.get(r.outFile);
		if (existing) {
			throw new Error(
				`Route collision on outFile "${r.outFile}": ${existing.urlPath} and ${r.urlPath}`,
			);
		}
		seen.set(r.outFile, r);
	}
}
