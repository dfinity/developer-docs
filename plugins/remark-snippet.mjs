/**
 * Remark plugin that extracts code snippets from .sources/examples/.
 *
 * Usage in markdown/mdx code fences:
 *
 *   ```rust snippet="send_http_get/src/send_http_get_backend/src/lib.rs#http_get_request"
 *   ```
 *
 * The plugin resolves the path relative to .sources/examples/<lang>/, extracts
 * content between `// #region <name>` and `// #endregion <name>` markers, and
 * injects it as the code block body.
 *
 * If no #region fragment is specified, the entire file is included (with all
 * region marker comments stripped).
 *
 * A missing file or region causes a build error.
 */
import { visit } from "unist-util-visit";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EXAMPLES_DIR = join(ROOT, ".sources", "examples");

// Map code fence languages to example subdirectories
const LANG_TO_DIR = {
  rust: "rust",
  rs: "rust",
  motoko: "motoko",
  mo: "motoko",
  javascript: "hosting",
  js: "hosting",
  typescript: "hosting",
  ts: "hosting",
};

// Region marker pattern: // #region <name> or // #endregion <name>
const REGION_START = /^\s*\/\/\s*#region\s+(\S+)/;
const REGION_END = /^\s*\/\/\s*#endregion\s+(\S+)/;

/**
 * Extract a named region from file content.
 * Returns the lines between `// #region <name>` and `// #endregion <name>`,
 * excluding the marker lines themselves.
 */
function extractRegion(content, regionName, filePath) {
  const lines = content.split("\n");
  let capturing = false;
  const captured = [];

  for (const line of lines) {
    const startMatch = line.match(REGION_START);
    if (startMatch && startMatch[1] === regionName) {
      capturing = true;
      continue;
    }

    const endMatch = line.match(REGION_END);
    if (endMatch && endMatch[1] === regionName) {
      if (!capturing) {
        throw new Error(
          `remark-snippet: found #endregion "${regionName}" before #region in ${filePath}`,
        );
      }
      return dedent(captured);
    }

    if (capturing) {
      captured.push(line);
    }
  }

  if (capturing) {
    throw new Error(
      `remark-snippet: #region "${regionName}" was opened but never closed in ${filePath}`,
    );
  }

  throw new Error(
    `remark-snippet: region "${regionName}" not found in ${filePath}`,
  );
}

/**
 * Strip all region markers from file content (for whole-file inclusion).
 */
function stripRegionMarkers(content) {
  return content
    .split("\n")
    .filter((line) => !REGION_START.test(line) && !REGION_END.test(line))
    .join("\n");
}

/**
 * Remove common leading whitespace from all non-empty lines.
 */
function dedent(lines) {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return lines.join("\n").trim();

  const minIndent = Math.min(
    ...nonEmpty.map((l) => l.match(/^(\s*)/)[1].length),
  );

  if (minIndent === 0) return lines.join("\n").trim();
  return lines
    .map((l) => (l.trim().length > 0 ? l.slice(minIndent) : ""))
    .join("\n")
    .trim();
}

/**
 * Parse a snippet attribute value.
 * Format: "<example>/<path>#<region>" or "<example>/<path>" (whole file)
 *
 * Returns { examplePath, region | null }
 */
function parseSnippetAttr(value) {
  const hashIdx = value.indexOf("#");
  if (hashIdx === -1) {
    return { examplePath: value, region: null };
  }
  return {
    examplePath: value.slice(0, hashIdx),
    region: value.slice(hashIdx + 1),
  };
}

/**
 * Resolve a snippet attribute to its extracted code content.
 * Used by both the remark plugin (AST-level) and the agent-docs plugin (string-level).
 *
 * @param {string} lang - code fence language (e.g. "rust", "motoko")
 * @param {string} snippet - snippet attribute value (e.g. "send_http_get/src/.../lib.rs#get_request")
 * @returns {string} extracted code
 */
export function extractSnippet(lang, snippet) {
  const langDir = LANG_TO_DIR[lang];
  if (!langDir) return null;

  const { examplePath, region } = parseSnippetAttr(snippet);
  const fullPath = join(EXAMPLES_DIR, langDir, examplePath);

  if (!existsSync(fullPath)) return null;

  const content = readFileSync(fullPath, "utf-8");

  if (region) {
    return extractRegion(content, region, fullPath);
  }
  return stripRegionMarkers(content).trim();
}

export { EXAMPLES_DIR, LANG_TO_DIR };

export default function remarkSnippet() {
  return (tree, file) => {
    visit(tree, "code", (node) => {
      const snippet = node.meta?.match(/snippet="([^"]+)"/)?.[1];
      if (!snippet) return;

      const lang = node.lang;
      const langDir = LANG_TO_DIR[lang];
      if (!langDir) {
        throw new Error(
          `remark-snippet: unsupported language "${lang}" for snippet in ${file.path || "unknown file"}. ` +
            `Supported: ${Object.keys(LANG_TO_DIR).join(", ")}`,
        );
      }

      const { examplePath, region } = parseSnippetAttr(snippet);
      const fullPath = join(EXAMPLES_DIR, langDir, examplePath);

      if (!existsSync(fullPath)) {
        throw new Error(
          `remark-snippet: file not found: ${fullPath} (from snippet="${snippet}" in ${file.path || "unknown file"})`,
        );
      }

      const content = readFileSync(fullPath, "utf-8");

      if (region) {
        node.value = extractRegion(content, region, fullPath);
      } else {
        node.value = stripRegionMarkers(content).trim();
      }
    });
  };
}

