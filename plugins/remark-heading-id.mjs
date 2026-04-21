/**
 * Remark plugin that handles Docusaurus-style explicit heading IDs.
 *
 * Docusaurus supports `## My Heading {#custom-id}` — the `{#custom-id}` token
 * is stripped from the visible heading text and applied as the HTML anchor id.
 * Starlight does not understand this syntax and renders the token literally.
 *
 * This plugin:
 *   1. Finds headings whose last text node ends with `{#some-id}` or
 *      `{$some_id}` (the portal uses both `#` and `$` variants).
 *   2. Strips the token from the text.
 *   3. Sets `data.hProperties.id` so rehype-slug uses the explicit id.
 */
import { visit } from "unist-util-visit";

const HEADING_ID = /\s*\{[#$]([\w-]+)\}\s*$/;

export default function remarkHeadingId() {
  return (tree) => {
    visit(tree, "heading", (node) => {
      if (!node.children?.length) return;

      const last = node.children[node.children.length - 1];
      if (last.type !== "text") return;

      const match = last.value.match(HEADING_ID);
      if (!match) return;

      // Strip the token from the visible text
      last.value = last.value.replace(HEADING_ID, "");
      // Remove trailing empty text nodes
      if (last.value === "") node.children.pop();

      // Apply as the HTML id
      node.data = node.data ?? {};
      node.data.hProperties = node.data.hProperties ?? {};
      node.data.hProperties.id = match[1];
      node.data.id = match[1];
    });
  };
}
