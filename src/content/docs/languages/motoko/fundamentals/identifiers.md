---
sidebar_position: 7
source_ref: 1.3.0
source_repo: https://github.com/caffeinelabs/motoko
last_verified: 2026-03-10
level: intermediate
doc_type: reference
description: Motoko language documentation
title: "Identifiers"
hide_table_of_contents: true
---

Identifiers are names used for variables, functions, types, and other entities. They must start with a letter or an underscore and can contain letters, digits, and underscores.

```motoko no-repl
let name = "Motoko";
let a1 = 123;
let camelCaseIdentifier = "best practice";
let snake_case_identifier = "for compatibility with other languages";
```

## Reserved syntax keywords

Motoko reserves [keywords](https://internetcomputer.org/docs/motoko/main/reference#keywords) for its syntax and they cannot be used as identifiers.
