import path from "node:path";
import { isSafeSegment } from "../utils/utils.js";

export function slugFromRelativePath(relPosix: string): string {
	// relPosix: ex "about.md" ou "docs/getting-started.md"
	const noExt = relPosix.replace(/\.md$/i, "");
	const parts = noExt.split("/").filter(Boolean);

	if (parts.length === 0) throw new Error(`Empty slug from path "${relPosix}"`);

	// autorise sous-dossiers, slug = join("-") ou join("/") ? (on décidera au routing)
	// Ici on renvoie un slug “path-like” stable (avec "/"), plus flexible.
	for (const p of parts) {
		if (!isSafeSegment(p)) {
			throw new Error(`Unsafe path segment "${p}" in "${relPosix}"`);
		}
	}
	return parts.join("/");
}
