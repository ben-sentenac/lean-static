import assert from "node:assert/strict";
import test from "node:test";
import { slugFromRelativePath } from "./slug.js";

test("slugFromRelativeMdPath builds path-like slug", () => {
	assert.equal(
		slugFromRelativePath("docs/getting-started.md"),
		"docs/getting-started",
	);
});

test("slugFromRelativeMdPath rejects unsafe segment", () => {
	assert.throws(() => slugFromRelativePath("a b.md"), /Unsafe/);
});
