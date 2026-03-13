/**
 * Rehype plugin that rewrites relative .md links for Astro's directory-based output.
 *
 * Authors write GitHub-friendly relative links with .md extensions:
 *   [Quickstart](quickstart.md)
 *   [Concepts](../concepts/canisters.md#lifecycle)
 *
 * Astro outputs each page as a directory (project-structure.md → project-structure/index.html),
 * so the browser resolves relative links one level deeper than the author expects.
 * This plugin strips .md extensions and prepends an extra ../ to compensate.
 *
 * Result:
 *   quickstart.md                              → ../quickstart/
 *   ../concepts/canisters.md#lifecycle         → ../../concepts/canisters/#lifecycle
 *   ./sibling.md                               → ../sibling/
 *
 * Only relative links are affected — external URLs, anchors, and absolute paths are untouched.
 *
 * Note: This is a rehype (HTML-level) plugin, not a remark plugin. Starlight overrides
 * Astro's markdown.remarkPlugins, but rehypePlugins are correctly merged. See:
 * https://github.com/dfinity/icp-cli/issues/423
 */
import { visit } from "unist-util-visit";

export default function rehypeRewriteLinks() {
  return (tree) => {
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
      const splitMatch = url.match(/^([^#?]*)((?:#|\\?).*)?$/);
      let path = splitMatch[1] || "";
      const suffix = splitMatch[2] || "";

      // Add trailing slash if the path doesn't already end with one
      if (path && !path.endsWith("/")) {
        path += "/";
      }

      // Strip leading ./ if present (normalize before prepending ../)
      if (path.startsWith("./")) {
        path = path.slice(2);
      }

      // Prepend ../ to compensate for Astro's directory-based output.
      // The page lives at e.g. /getting-started/project-structure/index.html,
      // so the browser's base is /getting-started/project-structure/.
      // An extra ../ goes up from that virtual directory to where the author expects.
      path = "../" + path;

      node.properties.href = path + suffix;
    });
  };
}
