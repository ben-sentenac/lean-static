// file: src/build/siteConfig.test.ts

import assert from "node:assert/strict";
import test from "node:test";
import { parseSiteConfig } from "./siteConfig.js";

test("parseSiteConfig: rejects non-object roots", () => {
	assert.throws(
		() => parseSiteConfig(null),
		/site\.config\.json must be an object/,
	);
	assert.throws(
		() => parseSiteConfig([]),
		/site\.config\.json must be an object/,
	);
	assert.throws(
		() => parseSiteConfig("x"),
		/site\.config\.json must be an object/,
	);
});
