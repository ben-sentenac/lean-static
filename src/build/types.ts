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
