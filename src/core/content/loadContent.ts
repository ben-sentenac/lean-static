import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { logger } from "../../lib/logger.js";
import { assertSafeDirectory, pathExists, toPosix } from "../utils/utils.js";
import { parseFrontMatter } from "./frontmatter.js";
import { slugFromRelativePath } from "./slug.js";
import type { ContentPage, ContentPost, LoadedContent } from "./types.js";

type LoadContentOptions = Readonly<{
	contentDir: string;
}>;

export async function loadContent(
	opts: LoadContentOptions,
): Promise<LoadedContent> {
	const contentAbs = path.resolve(opts.contentDir);
	await assertSafeDirectory(contentAbs);

	const md = new MarkdownIt({
		html: false, //security no html in markdown for now
		typographer: true,
		linkify: true,
	});

	const pagesDir = path.join(contentAbs, "pages");
	const postsDir = path.join(contentAbs, "posts");

	const pages = (await loadKind({
		md,
		kind: "page",
		dirAbs: pagesDir,
		contentDirForSourcePath: opts.contentDir,
	})) as ContentPage[];
	const posts = (await loadKind({
		md,
		kind: "post",
		dirAbs: postsDir,
		contentDirForSourcePath: opts.contentDir,
	})) as ContentPost[];

	// tri
	const pagesSorted = [...pages].sort(
		(a, b) => (a.order ?? 0) - (b.order ?? 0) || a.slug.localeCompare(b.slug),
	);
	const postsSorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));

	return { pages: pagesSorted, posts: postsSorted };
}

type LoadKindOpts = {
	md: MarkdownIt;
	kind: "page" | "post";
	dirAbs: string;
	contentDirForSourcePath: string;
};

type LoadKindReturn = Promise<Array<ContentPage | ContentPost>>;

async function loadKind(opts: LoadKindOpts): LoadKindReturn {
	const { md, kind, dirAbs, contentDirForSourcePath } = opts;

	// Si le dossier n'existe pas, on retourne vide.
	const exists = pathExists(dirAbs);
	if (!exists) return [];

	await assertSafeDirectory(dirAbs);

	const files = await collectMarkDownFiles(dirAbs);

	const out: Array<ContentPage | ContentPost> = [];

	for (const file of files) {
		const relFromKind = toPosix(path.relative(dirAbs, file));
		const slug = slugFromRelativePath(relFromKind);

		const kdir = kind === "page" ? "pages" : "posts";
		const sourcePath = toPosix(
			path.join(contentDirForSourcePath, kdir, relFromKind),
		);

		const raw = await readFile(file, "utf8");
		const parsed = matter(raw);

		//logger.debug(parsed.data);

		const fm = parseFrontMatter(kind, parsed.data);

		const bodyMarkdown = String(parsed.content ?? "");
		const bodyHtml = md.render(bodyMarkdown);

		if (kind === "page") {
			out.push({
				kind,
				sourcePath,
				slug,
				title: fm.title,
				description: fm.description,
				draft: fm.draft,
				order: fm.order,
				bodyMarkdown,
				bodyHtml,
			});
		} else {
			out.push({
				kind,
				sourcePath,
				slug,
				title: fm.title,
				description: fm.description,
				draft: fm.draft,
				date: fm.date!, // garanti par parseFrontmatter
				tags: Object.freeze([...(fm.tags ?? [])]),
				bodyMarkdown,
				bodyHtml,
			});
		}
	}

	return out;
}

async function collectMarkDownFiles(rootAbs: string): Promise<string[]> {
	const out: string[] = [];
	await walk(rootAbs, rootAbs, out);
	return out;
}

async function walk(rootAbs: string, dirAbs: string, out: string[]) {
	const entries = await readdir(dirAbs, { withFileTypes: true });

	for (const ent of entries) {
		const abs = path.join(dirAbs, ent.name);

		const lst = await lstat(abs);
		if (lst.isSymbolicLink()) {
			throw new Error(`Symlink refused in content: ${abs}`);
		}

		if (lst.isDirectory()) {
			await walk(rootAbs, abs, out);
			continue;
		}

		if (!lst.isFile()) continue;
		if (!ent.name.toLowerCase().endsWith(".md")) continue;

		// défense traversal via chemins relatifs (normalement safe car on part du FS)
		const rel = path.relative(rootAbs, abs);
		if (rel.startsWith("..") || path.isAbsolute(rel)) {
			throw new Error(`Path traversal detected: ${abs}`);
		}

		out.push(abs);
	}
}
