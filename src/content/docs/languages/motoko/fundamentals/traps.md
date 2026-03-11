---
sidebar_position: 12
source_ref: 1.3.0
source_repo: https://github.com/caffeinelabs/motoko
last_verified: 2026-03-10
level: intermediate
doc_type: reference
description: Motoko language documentation
title: "Assertions"
hide_table_of_contents: true
---

An assertion checks a condition at runtime and traps if it fails.

```motoko
let n = 10;
assert n % 2 == 1; // Traps
```

```motoko
let n = 10;
assert n % 2 == 0; // Succeeds
```

Assertions help catch logic errors early, but should not be used for regular [error handling](/languages/motoko/fundamentals/9-error-handling).

