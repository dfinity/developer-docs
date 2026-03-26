/**
 * Resolves the .sources/examples submodule commit hash at import time.
 * Used by the CodeExample component to generate commit-pinned ICP Ninja URLs.
 */
import { execSync } from "node:child_process";

let commit;
try {
  // Use git submodule status — does not depend on cwd or import.meta.url
  const output = execSync("git submodule status .sources/examples", {
    encoding: "utf-8",
  });
  // Output format: " 0f3feb6... .sources/examples (v1.0)" or "+0f3feb6..." (dirty)
  commit = output.trim().replace(/^[+ -]/, "").split(/\s+/)[0];
} catch {
  commit = "master";
}

export const examplesCommit = commit;
