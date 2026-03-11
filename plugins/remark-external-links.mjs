import { visit } from "unist-util-visit";

/**
 * Remark plugin that adds target="_blank" and rel="noopener noreferrer"
 * to all external links (links starting with http:// or https://).
 */
export default function remarkExternalLinks() {
  return (tree) => {
    visit(tree, "link", (node) => {
      if (/^https?:\/\//.test(node.url)) {
        node.data ??= {};
        node.data.hProperties ??= {};
        node.data.hProperties.target = "_blank";
        node.data.hProperties.rel = "noopener noreferrer";
      }
    });
  };
}
