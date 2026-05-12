/**
 * Remark plugin that embeds file contents into code blocks using a file= attribute.
 *
 * Usage in markdown code fences:
 *
 *   ```candid file=<rootDir>/public/references/ic.did
 *   ```
 *
 * The plugin resolves <rootDir> to the project root and reads the file
 * synchronously at build time, replacing the empty code block body with the
 * file's contents.
 *
 * A missing file causes a build error.
 */
import { visit } from "unist-util-visit";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export default function remarkIncludeFile() {
  return (tree, file) => {
    visit(tree, "code", (node) => {
      const fileMeta = (node.meta || "")
        .split(" ")
        .find((m) => m.startsWith("file="));
      if (!fileMeta) return;

      const rawPath = fileMeta.slice("file=".length).replace(/^<rootDir>/, ROOT);
      const absPath = resolve(file.dirname || ROOT, rawPath);

      if (!existsSync(absPath)) {
        throw new Error(
          `remark-include-file: file not found: ${absPath} (from file=${fileMeta})`,
        );
      }

      node.value = readFileSync(absPath, "utf-8").trimEnd();
    });
  };
}
