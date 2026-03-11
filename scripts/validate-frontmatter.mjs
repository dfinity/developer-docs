#!/usr/bin/env node
/**
 * Validates frontmatter in all .md files under src/content/docs/.
 * Checks for required fields and valid values.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, relative } from "path";
import { glob } from "glob";
import matter from "gray-matter";

const DOCS_DIR = "src/content/docs";

const VALID_DOC_TYPES = ["tutorial", "how-to", "reference", "explanation"];
const VALID_LEVELS = ["beginner", "intermediate", "advanced"];

const errors = [];

function validate(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const { data } = matter(content);
  const rel = relative(process.cwd(), filePath);

  // Required fields
  if (!data.title) {
    errors.push(`${rel}: missing required field 'title'`);
  }
  if (!data.description) {
    errors.push(`${rel}: missing required field 'description'`);
  }

  // doc_type validation
  if (!data.doc_type) {
    errors.push(`${rel}: missing required field 'doc_type'`);
  } else if (!VALID_DOC_TYPES.includes(data.doc_type)) {
    errors.push(
      `${rel}: invalid doc_type '${data.doc_type}'. Must be one of: ${VALID_DOC_TYPES.join(", ")}`
    );
  }

  // level validation
  if (!data.level) {
    errors.push(`${rel}: missing required field 'level'`);
  } else if (!VALID_LEVELS.includes(data.level)) {
    errors.push(
      `${rel}: invalid level '${data.level}'. Must be one of: ${VALID_LEVELS.join(", ")}`
    );
  }

  // last_verified validation
  if (!data.last_verified) {
    errors.push(`${rel}: missing required field 'last_verified'`);
  } else {
    // gray-matter auto-parses YYYY-MM-DD as a Date object
    const val = data.last_verified;
    if (val instanceof Date) {
      // Valid — gray-matter parsed it successfully
      if (isNaN(val.getTime())) {
        errors.push(`${rel}: invalid last_verified date`);
      }
    } else {
      const dateStr = String(val);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        errors.push(
          `${rel}: invalid last_verified '${dateStr}'. Must be YYYY-MM-DD`
        );
      }
    }
  }

  // Optional field type checks
  if (data.features && !Array.isArray(data.features)) {
    errors.push(`${rel}: 'features' must be an array`);
  }
  if (data.icskills && !Array.isArray(data.icskills)) {
    errors.push(`${rel}: 'icskills' must be an array`);
  }
}

async function main() {
  const files = await glob(`${DOCS_DIR}/**/*.md`);

  if (files.length === 0) {
    console.log("No .md files found to validate.");
    process.exit(0);
  }

  console.log(`Validating frontmatter in ${files.length} files...`);

  for (const file of files) {
    try {
      validate(resolve(file));
    } catch (err) {
      errors.push(`${file}: failed to parse — ${err.message}`);
    }
  }

  if (errors.length > 0) {
    console.error(`\nFound ${errors.length} frontmatter error(s):\n`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log("All frontmatter is valid.");
}

main();
