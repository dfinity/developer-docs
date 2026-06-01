/**
 * Rehype plugin that rewrites relative .md links to absolute paths for Astro's directory-based output.
 *
 * Authors write GitHub-friendly relative links with .md extensions:
 *   [Quickstart](quickstart.md)
 *   [Concepts](../concepts/canisters.md#lifecycle)
 *
 * Astro outputs each page as a directory (resource-limits.md → resource-limits/index.html).
 * Relative hrefs in the output HTML are resolved by the browser relative to the current URL.
 * This means links break when the page is accessed without a trailing slash (e.g. /resource-limits
 * instead of /resource-limits/) because `../foo/` resolves to different paths in each case.
 *
 * This plugin avoids the ambiguity by emitting absolute paths. It locates the current file
 * within the docs tree, resolves the relative .md link against that position, and writes a
 * root-relative href that works regardless of whether the browser URL has a trailing slash.
 *
 * Result:
 *   quickstart.md                              → /getting-started/quickstart/
 *   ../concepts/canisters.md#lifecycle         → /concepts/canisters/#lifecycle
 *   ./sibling.md                               → /references/sibling/
 *   backends/data-persistence.md               → /guides/backends/data-persistence/
 *
 * Only relative links with a .md extension are affected — external URLs, anchor-only links,
 * and already-absolute paths are untouched.
 *
 * Important: Astro caches rendered content in node_modules/.astro/data-store.json.
 * After changing this plugin, delete that file to force re-rendering.
 *
 * Note: This is a rehype (HTML-level) plugin, not a remark plugin. Starlight overrides
 * Astro's markdown.remarkPlugins, but rehypePlugins are correctly merged. See:
 * https://github.com/dfinity/icp-cli/issues/423
 */
import { posix as posixPath } from "path";
import { visit } from "unist-util-visit";

export default function rehypeRewriteLinks() {
  return (tree, file) => {
    const filePath = (file?.path || file?.history?.[0] || "").replace(/\\/g, "/");

    // Extract the docs-relative directory of the current file.
    // Handles both the real path (.../docs/references/resource-limits.md)
    // and the symlinked path (.../src/content/docs/references/resource-limits.md).
    const docsRelMatch = filePath.match(/(?:\/src\/content\/docs|\/docs)\/(.*)/);
    const docsRelPath = docsRelMatch ? docsRelMatch[1] : "";
    // e.g. "references/resource-limits.md" → "references/"
    const fileDir = docsRelPath.replace(/[^/]+$/, "");

    visit(tree, "element", (node) => {
      if (node.tagName !== "a") return;

      const href = node.properties?.href;
      if (!href || typeof href !== "string") return;

      // Skip external links and protocol links
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return;

      // Skip anchor-only links
      if (href.startsWith("#")) return;

      // Skip absolute paths
      if (href.startsWith("/")) return;

      // Only process links that have .md extension (our internal doc links)
      if (!href.includes(".md")) return;

      let url = href;

      // Strip .md extension, preserving anchors and query strings
      url = url.replace(/\.md(#|$|\?)/, "$1");

      // Rewrite index links to directory root (index → ./, foo/index → foo/)
      url = url.replace(/(^|\/)index(#|$|\?)/, "$1$2");

      // Split off anchor/query suffix
      const splitMatch = url.match(/^([^#?]*)((?:#|\?).*)?$/);
      let linkPath = splitMatch[1] || "";
      const suffix = splitMatch[2] || "";

      // Add trailing slash if the path doesn't already end with one
      if (linkPath && !linkPath.endsWith("/")) {
        linkPath += "/";
      }

      // Strip leading ./ if present
      if (linkPath.startsWith("./")) {
        linkPath = linkPath.slice(2);
      }

      // Resolve the relative link against the current file's absolute docs path.
      // posixPath.resolve strips trailing slashes, so re-add one afterward.
      // This produces a root-relative href that works regardless of whether the
      // browser URL has a trailing slash.
      const resolved = posixPath.resolve("/" + fileDir, linkPath || ".");
      const absoluteHref = resolved === "/" ? "/" : resolved + "/";

      node.properties.href = absoluteHref + suffix;
    });
  };
}
