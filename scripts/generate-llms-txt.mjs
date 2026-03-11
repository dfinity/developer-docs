#!/usr/bin/env node
/**
 * Generates llms.txt (curated index) and llms-full.txt (all content concatenated)
 * in the dist/ directory after build.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, relative, basename, dirname } from "path";
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

  // Group files by top-level directory
  const sections = new Map();
  for (const file of files) {
    const rel = relative(DOCS_DIR, file);
    const parts = rel.split("/");
    const section = parts.length > 1 ? parts[0] : "_root";
    if (!sections.has(section)) {
      sections.set(section, []);
    }
    const content = readFileSync(file, "utf-8");
    const { data, content: body } = matter(content);
    sections.get(section).push({
      file,
      url: fileToUrl(file),
      title: data.title || basename(file, ".md"),
      description: data.description || "",
      body,
    });
  }

  // --- Generate llms.txt ---
  const sectionLabels = {
    "getting-started": "Getting Started",
    capabilities: "IC Capabilities",
    "building-apps": "Building Apps",
    canisters: "Canisters",
    defi: "DeFi",
    governance: "Governance",
    security: "Security",
    languages: "Languages",
    tools: "Tools",
    references: "References",
  };

  let llmsTxt = `# ICP Developer Documentation

> Build on the Internet Computer — the world's fastest and most powerful blockchain.
> Canisters (smart contracts) run WebAssembly, pay their own gas (reverse gas model),
> and can natively sign transactions on Bitcoin, Ethereum, and other chains via
> chain-key cryptography. Use icp-cli to develop and deploy.

`;

  for (const [section, pages] of sections) {
    if (section === "_root") continue; // skip 404, index — not real doc pages
    const label = sectionLabels[section] || section;
    llmsTxt += `## ${label}\n`;
    for (const page of pages) {
      const desc = page.description ? `: ${page.description}` : "";
      llmsTxt += `- [${page.title}](${SITE_URL}${page.url})${desc}\n`;
    }
    llmsTxt += "\n";
  }

  llmsTxt += `## External Resources
- [icp-cli Documentation](https://dfinity.github.io/icp-cli/): CLI tool for ICP development
- [JavaScript SDK](https://js.icp.build): JS/TS libraries for ICP
- [icskills](https://skills.internetcomputer.org): Agent skill files for ICP development
- [Learn Hub](https://learn.internetcomputer.org): How the Internet Computer works
- [Motoko Core Library](https://mops.one/core/docs): Motoko standard library reference
- [Rust CDK API](https://docs.rs/ic-cdk/latest/ic_cdk/): Rust canister development kit
`;

  writeFileSync(resolve(OUT_DIR, "llms.txt"), llmsTxt);
  console.log(`Generated llms.txt (${llmsTxt.length} bytes)`);

  // --- Generate llms-full.txt ---
  let llmsFullTxt = llmsTxt + "\n---\n\n# Full Documentation Content\n\n";

  for (const [section, pages] of sections) {
    if (section === "_root") continue;
    for (const page of pages) {
      llmsFullTxt += `---\n\n## ${page.title}\n\nURL: ${SITE_URL}${page.url}\n\n${page.body.trim()}\n\n`;
    }
  }

  writeFileSync(resolve(OUT_DIR, "llms-full.txt"), llmsFullTxt);
  console.log(`Generated llms-full.txt (${llmsFullTxt.length} bytes)`);
}

main();
