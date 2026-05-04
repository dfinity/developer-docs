#!/usr/bin/env python3
"""Split docs/reference/ic-interface-spec.md into a sub-directory of focused pages."""
import re
import os
import shutil

INPUT = "docs/reference/ic-interface-spec.md"
OUTPUT_DIR = "docs/reference/ic-interface-spec"

with open(INPUT) as f:
    raw = f.read()

lines = raw.splitlines(keepends=True)
print(f"Total lines: {len(lines)}")

# Section boundaries (0-indexed Python slices).
# Original file frontmatter is lines[0:8] (lines 1-8, 1-indexed) — skipped.
# Each section starts at the ## heading line.
SECTIONS = [
    ("index.md",               8,    631),
    ("https-interface.md",     631,  1367),
    ("canister-interface.md",  1367, 2393),
    ("management-canister.md", 2393, 3486),
    ("certification.md",       3486, 3733),
    ("abstract-behavior.md",   3733, 9480),
    ("changelog.md",           9480, 9953),  # excludes original Upstream comment at line 9954
]

FRONTMATTER = {
    "index.md": """\
---
title: "IC Interface Specification"
description: "Introduction, pervasive concepts, and the IC system state tree"
sidebar:
  order: 11
---

""",
    "https-interface.md": """\
---
title: "HTTPS Interface"
description: "HTTP endpoints for submitting calls, reading state, and querying canisters on the Internet Computer"
sidebar:
  label: "HTTPS Interface"
  order: 1
---

""",
    "canister-interface.md": """\
---
title: "Canister Interface (System API)"
description: "WebAssembly module format and the System API available to canisters at runtime"
sidebar:
  label: "Canister Interface"
  order: 2
---

""",
    "management-canister.md": """\
---
title: "IC Management Canister"
description: "The virtual management canister interface: canister lifecycle, threshold signing, Bitcoin, and provisional APIs"
sidebar:
  label: "Management Canister"
  order: 3
---

""",
    "certification.md": """\
---
title: "Certification"
description: "Certified state trees, delegation chains, certificate encoding, and the HTTP Gateway protocol"
sidebar:
  label: "Certification"
  order: 4
---

""",
    "abstract-behavior.md": """\
---
title: "Abstract Behavior"
description: "Formal specification of the Internet Computer abstract state machine and execution semantics"
sidebar:
  label: "Abstract Behavior"
  order: 5
---

:::note
This section is a rigorous formal specification intended for protocol implementors and security researchers. Most application developers do not need to read this section — see the [HTTPS Interface](./https-interface.md), [Canister Interface](./canister-interface.md), and [IC Management Canister](./management-canister.md) pages instead.
:::

""",
    "changelog.md": """\
---
title: "IC Interface Spec Changelog"
description: "Version history and changes to the IC Interface Specification"
sidebar:
  label: "Changelog"
  order: 6
---

""",
}

UPSTREAM = {
    "index.md":
        "<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->",
    "https-interface.md":
        "<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->",
    "canister-interface.md":
        "<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->",
    "management-canister.md":
        "<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->",
    "certification.md":
        "<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->",
    "abstract-behavior.md":
        "<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->",
    "changelog.md":
        "<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md, docs/references/_attachments/interface-spec-changelog.md -->",
}

# Step 1: Build anchor → file mapping from heading {#anchor} syntax.
anchor_to_file: dict[str, str] = {}
heading_re = re.compile(r"^#{1,6}\s+.*\{#([^}]+)\}")

for sec_file, start, end in SECTIONS:
    sec_lines = lines[start:end]
    for line in sec_lines:
        m = heading_re.match(line)
        if m:
            anchor = m.group(1)
            anchor_to_file[anchor] = sec_file

print(f"Mapped {len(anchor_to_file)} anchors to files")

# Step 2: Cross-reference replacement.
# Matches (#anchor) in markdown links but NOT {#anchor} heading IDs.
link_re = re.compile(r"\(#([a-zA-Z0-9_./:-]+)\)")

def make_replacer(current_file: str):
    def replacer(m: re.Match) -> str:
        anchor = m.group(1)
        target = anchor_to_file.get(anchor)
        if target is None or target == current_file:
            return m.group(0)  # same file or unknown — keep as-is
        return f"(./{target}#{anchor})"
    return replacer

# Step 3: Write output files.
os.makedirs(OUTPUT_DIR, exist_ok=True)

for sec_file, start, end in SECTIONS:
    body = "".join(lines[start:end])
    body = link_re.sub(make_replacer(sec_file), body)

    # Ensure body ends with a single newline before the Upstream comment.
    body = body.rstrip("\n") + "\n"

    out_path = os.path.join(OUTPUT_DIR, sec_file)
    with open(out_path, "w") as f:
        f.write(FRONTMATTER[sec_file])
        f.write(body)
        f.write("\n")
        f.write(UPSTREAM[sec_file])
        f.write("\n")

    size_kb = os.path.getsize(out_path) // 1024
    print(f"  {sec_file}: {size_kb} KB")

print(f"\nAll files written to {OUTPUT_DIR}/")
print("Next steps:")
print("  1. Delete docs/reference/ic-interface-spec.md")
print("  2. Update docs/reference/index.md")
print("  3. Update CLAUDE.md sync rules")
print("  4. Run npm run build")
