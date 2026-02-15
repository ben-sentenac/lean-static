export type ContentKind = "page" | "post";

export type ContentBase = Readonly<{
	kind: ContentKind;
	sourcePath: string;
	slug: string;
	title: string;
	description?: string;
	draft: boolean;
	bodyMarkdown: string;
	bodyHtml: string;
}>;

export type ContentPage = ContentBase &
	Readonly<{
		kind: "page";
		order?: number;
		//menu?:{order:number;label:string}
	}>;

export type ContentPost = ContentBase &
	Readonly<{
		kind: "post";
		/** ISO date (YYYY-MM-DD ou ISO complet) normalisé en ISO string */
		date: string;
		tags: ReadonlyArray<string>;
	}>;

export type LoadedContent = Readonly<{
	pages: ReadonlyArray<ContentPage>;
	posts: ReadonlyArray<ContentPost>;
}>;
