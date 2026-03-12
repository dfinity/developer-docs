---
title: "Project Structure"
description: "Understand icp.yaml, recipes, binding generation, and the .icp/ directory"
sidebar:
  order: 2
icskills: [icp-cli]
---

TODO: Write content for this page.

<!-- Content Brief -->
Explain the output of `icp new`: icp.yaml configuration file, the .icp/ directory, canister source layout, and binding generation. Cover recipes (what they are, the four official recipes), and how canister discovery works (env vars, ic_env cookie). Walk through the hello-world template file-by-file.

<!-- Source Material -->
- icp-cli: concepts/project-model.md, concepts/recipes.md, concepts/binding-generation.md, guides/using-recipes.md
- icp-cli: reference/configuration.md
- Template: hello-world template structure
- Recipes: @dfinity/rust, @dfinity/motoko, @dfinity/asset-canister, @dfinity/prebuilt
- Examples: backend_only (both)

<!-- Cross-Links -->
- getting-started/quickstart -- prerequisite
- guides/canister-calls/binding-generation -- deep dive on bindgen
- guides/frontends/asset-canister -- frontend recipe details
- icp-cli docs: https://dfinity.github.io/icp-cli/
