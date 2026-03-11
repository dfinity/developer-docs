/**
 * Remark plugin that rewrites icp-cli doc links to include the current version.
 *
 * Authors write unversioned links:
 *   https://dfinity.github.io/icp-cli/guides/deploying-to-mainnet/
 *
 * The plugin rewrites them at build time to:
 *   https://dfinity.github.io/icp-cli/0.2/guides/deploying-to-mainnet/
 *
 * The version is read from src/versions.json.
 */
import { visit } from "unist-util-visit";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const versions = JSON.parse(
  readFileSync(join(__dirname, "../src/versions.json"), "utf-8"),
);
const ICP_CLI_VERSION = versions["icp-cli"];
const BASE = "https://dfinity.github.io/icp-cli/";

function rewriteUrl(url) {
  if (!url || !url.startsWith(BASE)) return url;

  const rest = url.slice(BASE.length);

  // Already has a version segment (e.g. 0.2/guides/...) — skip
  if (/^\d+\.\d+/.test(rest)) return url;

  return `${BASE}${ICP_CLI_VERSION}/${rest}`;
}

export default function remarkIcpCliVersion() {
  return (tree) => {
    visit(tree, (node) => {
      // Rewrite markdown links [text](url)
      if (node.type === "link") {
        node.url = rewriteUrl(node.url);
      }

      // Rewrite autolinks and bare URLs in text
      if (node.type === "text" && node.value && node.value.includes(BASE)) {
        node.value = node.value.replace(
          new RegExp(BASE.replace(/[/.]/g, "\\$&") + "(?!\\d+\\.\\d+)", "g"),
          `${BASE}${ICP_CLI_VERSION}/`,
        );
      }
    });
  };
}
