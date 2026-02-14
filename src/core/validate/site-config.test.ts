// file: src/build/siteConfig.test.ts

import assert from "node:assert/strict";
import test from "node:test";
import { parseSiteConfig } from "./site-config.js";

test("parseSiteConfig: rejects non-object roots", () => {
	assert.throws(() => parseSiteConfig(null), /site\.json must be an object/);
	assert.throws(() => parseSiteConfig([]), /site\.json must be an object/);
	assert.throws(() => parseSiteConfig("x"), /site\.json must be an object/);
});
