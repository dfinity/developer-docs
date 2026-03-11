#!/usr/bin/env node
/**
 * Generates docs-manifest.json in the dist/ directory after build.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, relative, basename } from "path";
import { glob } from "glob";
import matter from "gray-matter";

const DOCS_DIR = "src/content/docs";
const OUT_DIR = "public";
const SITE_URL = "https://docs.internetcomputer.org";

function fileToUrl(filePath) {
  let url = relative(DOCS_DIR, filePath)
    .replace(/\.md$/, "/")
    .replace(/index\/$/, "");
  return `/${url}`;
}

async function main() {
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  const files = await glob(`${DOCS_DIR}/**/*.md`);
  files.sort();

  const pages = [];

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const { data } = matter(content);
    pages.push({
      path: fileToUrl(file),
      title: data.title || basename(file, ".md"),
      description: data.description || "",
      doc_type: data.doc_type || null,
      level: data.level || null,
      features: data.features || [],
      icskills: data.icskills || [],
      last_verified: data.last_verified
        ? String(data.last_verified)
        : null,
    });
  }

  const manifest = {
    version: "1.0.0",
    last_updated: new Date().toISOString(),
    base_url: SITE_URL,
    llms_txt: "/llms.txt",
    llms_full_txt: "/llms-full.txt",
    external_docs: {
      "icp-cli": "https://dfinity.github.io/icp-cli/",
      "js-sdk": "https://js.icp.build",
      icskills: "https://skills.internetcomputer.org",
      "learn-hub": "https://learn.internetcomputer.org",
      "motoko-core": "https://mops.one/core/docs",
      "rust-cdk": "https://docs.rs/ic-cdk/latest/ic_cdk/",
    },
    page_count: pages.length,
    pages,
  };

  const json = JSON.stringify(manifest, null, 2);
  writeFileSync(resolve(OUT_DIR, "docs-manifest.json"), json);
  console.log(
    `Generated docs-manifest.json (${pages.length} pages, ${json.length} bytes)`
  );
}

main();
