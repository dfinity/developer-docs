/**
 * Remark plugin that embeds file contents into code blocks using a file= attribute.
 *
 * Usage in markdown code fences:
 *
 *   ```candid file=<rootDir>/public/references/ic.did
 *   ```
 *
 *   ```motoko file=<motokoExamples>/counter.mo
 *   ```
 *
 *   ```motoko file=<motokoExamples>/todo-error.mo#L49-L58
 *   ```
 *
 * Placeholders:
 *   <rootDir>        — project root
 *   <motokoExamples> — .sources/motoko/doc/md/examples/
 *
 * An optional #L<start>-L<end> suffix slices specific lines (1-based, inclusive).
 *
 * A missing file or out-of-range line slice causes a build error.
 */
import { visit } from "unist-util-visit";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const PLACEHOLDERS = {
  "<rootDir>": ROOT,
  "<motokoExamples>": join(ROOT, ".sources", "motoko", "doc", "md", "examples"),
};

export default function remarkIncludeFile() {
  return (tree, file) => {
    visit(tree, "code", (node) => {
      const fileMeta = (node.meta || "")
        .split(" ")
        .find((m) => m.startsWith("file="));
      if (!fileMeta) return;

      let rawPath = fileMeta.slice("file=".length);

      // Extract optional #L<start>-L<end> line range before resolving the path
      let lineStart = null;
      let lineEnd = null;
      const rangeMatch = rawPath.match(/#L(\d+)-L(\d+)$/);
      if (rangeMatch) {
        lineStart = parseInt(rangeMatch[1], 10);
        lineEnd = parseInt(rangeMatch[2], 10);
        rawPath = rawPath.slice(0, -rangeMatch[0].length);
      }

      // Expand placeholders
      for (const [placeholder, expansion] of Object.entries(PLACEHOLDERS)) {
        if (rawPath.startsWith(placeholder)) {
          rawPath = expansion + rawPath.slice(placeholder.length);
          break;
        }
      }

      const absPath = resolve(file.dirname || ROOT, rawPath);

      if (!existsSync(absPath)) {
        throw new Error(
          `remark-include-file: file not found: ${absPath} (from file=${fileMeta})`,
        );
      }

      let content = readFileSync(absPath, "utf-8");

      if (lineStart !== null) {
        const lines = content.split("\n");
        if (lineStart < 1 || lineEnd > lines.length) {
          throw new Error(
            `remark-include-file: line range L${lineStart}-L${lineEnd} out of bounds ` +
            `(file has ${lines.length} lines): ${absPath}`,
          );
        }
        content = lines.slice(lineStart - 1, lineEnd).join("\n");
      }

      node.value = content.trimEnd();
    });
  };
}
