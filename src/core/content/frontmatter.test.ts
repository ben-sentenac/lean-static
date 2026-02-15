import assert from "node:assert/strict";
import test from "node:test";
import { parseFrontMatter } from "./frontmatter.js";

test("parseFrontmatter(page) rejects unknown keys", () => {
	assert.throws(
		() => parseFrontMatter("page", { title: "A", nope: 1 }),
		/Unknown key/,
	);
});

test("parseFrontmatter(post) requires date and normalizes iso", () => {
	const fm = parseFrontMatter("post", { title: "Hello", date: "2026-02-15" });
	assert.equal(fm.title, "Hello");
	assert.ok(fm.date);
	assert.match(fm.date, /T00:00:00/);
});
