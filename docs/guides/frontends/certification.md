---
title: "Response Certification"
description: "Verify that frontend responses are authentic and untampered using IC certificates"
sidebar:
  order: 3
---

TODO: Write content for this page.

<!-- Content Brief -->
Verify that query responses from canisters are authentic. Cover client-side certificate verification using @icp-sdk/core, the service worker approach for transparent verification, and how the asset canister handles certification automatically. Explain when you need custom certification vs when the asset canister handles it.

<!-- Source Material -->
- Portal: building-apps/frontends/asset-security.mdx
- icskills: certified-variables
- JS SDK: @icp-sdk/core (https://js.icp.build/core) -- certificate verification
- Learn Hub: [Asset Certification](https://learn.internetcomputer.org/hc/en-us/articles/34276431179412)

<!-- Cross-Links -->
- guides/backends/certified-variables -- server-side implementation
- concepts/security -- why certification matters
- reference/http-gateway-spec -- how boundary nodes verify
