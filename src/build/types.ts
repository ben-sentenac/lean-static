export type ContentType = "page" | "post";

export interface FrontMatterBase {
	type: ContentType;
	title: string;
	description?: string;
	slug?: string;
	draft?: boolean;
}

export interface FrontMatterPage extends FrontMatterBase {
	type: "page";
	menu?: { label: string; order: number };
}

export interface FrontMatterPost extends FrontMatterBase {
	type: "post";
	date: string; // ISO YYYY-MM-DD
	updatedAt: string; //ISO
	tags?: string[];
}

export type FrontMatter = FrontMatterPost | FrontMatterPage;

export interface ContentDoc {
	sourcePath: string;
	fm: FrontMatter;
	bodyMarkdown: string;
	bodyHtml: string;
	urlPath: string; // e.g. "/contact/"
	outputPath: string; // e.g. "dist/contact/index.html"
}

export interface SiteConfig {
	name: string;
	url: string;
	locale: string;
	timezone: string;
	titleDefault: string;
	descriptionDefault: string;
	social?: Record<string, string>;
	blog?: { basePath: string; postsPerPage: number };
}

export interface PageContext {
	site: SiteConfig;
	page: ContentDoc;
	nav: Array<{ label: string; urlPath: string }>;
	collections: {
		posts: ContentDoc[];
		latestPosts: ContentDoc[];
		tags: Record<string, ContentDoc[]>;
	};
	build: {
		generatedAtIso: string;
	};
}
