// src/core/routes/types.ts
export type RouteKind = "page" | "post" | "listing";

export type Route = Readonly<{
	kind: RouteKind;

	/** URL publique, toujours slash-terminated ("/about/") */
	urlPath: string;

	/** Chemin de fichier dans dist (POSIX, ex: "about/index.html") */
	outFile: string;

	/** Template Eta à utiliser plus tard (ex: "page", "post", "index") */
	template: string;

	/** Données minimales pour lier contenu/route (facile à étendre) */
	ref?: Readonly<{
		contentKind: "page" | "post";
		slug: string;
	}>;
}>;

export type RoutesConfig = Readonly<{
	/** base des posts (ex: "blog") */
	postsBase: string;

	/** slug de la home page (souvent "index") */
	homeSlug: string;
}>;
