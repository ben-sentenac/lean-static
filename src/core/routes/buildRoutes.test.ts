// src/core/routes/buildRoutes.test.ts

import assert from "node:assert/strict";
import test from "node:test";
import type { LoadedContent } from "../content/types.js";
import { buildRoutes } from "./buildRoutes.js";

test("buildRoutes creates home route for index page", () => {
	const content: LoadedContent = {
		pages: [
			{
				kind: "page",
				sourcePath: "content/pages/index.md",
				slug: "index",
				title: "Home",
				draft: false,
				bodyMarkdown: "",
				bodyHtml: "",
			},
		],
		posts: [],
	};

	const routes = buildRoutes(content);
	const home = routes.find((r) => r.urlPath === "/");
	assert.ok(home);
	assert.equal(home.outFile, "index.html");
});

test("buildRoutes creates blog post route under /blog/", () => {
	const content: LoadedContent = {
		pages: [],
		posts: [
			{
				kind: "post",
				sourcePath: "content/posts/hello.md",
				slug: "hello",
				title: "Hello",
				draft: false,
				date: new Date("2026-02-15").toISOString(),
				tags: [],
				bodyMarkdown: "",
				bodyHtml: "",
			},
		],
	};

	const routes = buildRoutes(content);
	const post = routes.find((r) => r.kind === "post");
	assert.ok(post);
	assert.equal(post.urlPath, "/blog/hello/");
	assert.equal(post.outFile, "blog/hello/index.html");
});

test("buildRoutes refuses outFile collisions", () => {
	const content: LoadedContent = {
		pages: [
			{
				kind: "page",
				sourcePath: "content/pages/a.md",
				slug: "a",
				title: "A",
				draft: false,
				bodyMarkdown: "",
				bodyHtml: "",
			},
		],
		posts: [
			{
				kind: "post",
				sourcePath: "content/posts/a.md",
				slug: "a",
				title: "A",
				draft: false,
				date: new Date("2026-02-15").toISOString(),
				tags: [],
				bodyMarkdown: "",
				bodyHtml: "",
			},
		],
	};

	// With postsBase="": would collide, but we disallow invalid base anyway.
	// Let's force collision by setting postsBase="": should throw earlier.
	assert.throws(
		() => buildRoutes(content, { postsBase: "" }),
		/Invalid postsBase/,
	);

	// Simpler collision: if someone sets postsBase="a" and also has a page slug "a"
	assert.throws(
		() => buildRoutes(content, { postsBase: "a" }),
		/Route collision/,
	);
});
