---
sidebar_position: 12
description: "Motoko language documentation"
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

Assertions help catch logic errors early, but should not be used for regular [error handling](/languages/motoko/fundamentals/error-handling).

