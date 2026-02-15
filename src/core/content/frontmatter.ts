import {
	assertNoUnknownKeys,
	isPlainObject,
	normalizeDateToIso,
	readNonEmptyString,
	readOptionalBoolean,
	readOptionalInt,
	readOptionalString,
	readOptionalStringArray,
} from "../utils/utils.js";
import type { ContentKind } from "./types.js";

type ParseFrontMatterReturn = Readonly<{
	title: string;
	description?: string;
	draft: boolean;
	order?: number; // pages
	date?: string; // posts (required)
	tags?: string[]; // posts
}>;

export function parseFrontMatter(
	kind: ContentKind,
	data: unknown,
): ParseFrontMatterReturn {
	if (!isPlainObject(data)) {
		throw new Error(`Invalid frontmatter: expected object.`);
	}

	const allowed =
		kind === "page"
			? ["kind", "title", "description", "draft", "order", "slug", "menu"]
			: ["kind", "title", "description", "draft", "date", "tags", "slug"];

	assertNoUnknownKeys(data, allowed, "frontmatter");

	const title = readNonEmptyString(data, "title");
	const description = readOptionalString(data, "description");
	const draft = readOptionalBoolean(data, "draft", false);

	if (kind === "page") {
		const order = readOptionalInt(data, "order");
		return { title, description, draft, order };
	}

	const dateRow = readNonEmptyString(data, "date");
	const date = normalizeDateToIso(dateRow);

	const tags = readOptionalStringArray(data, "tags");

	return {
		title,
		description,
		date,
		draft,
		tags,
	};
}
