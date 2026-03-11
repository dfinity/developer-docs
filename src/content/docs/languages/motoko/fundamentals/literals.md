---
sidebar_position: 6
source_ref: 1.3.0
source_repo: https://github.com/caffeinelabs/motoko
last_verified: 2026-03-10
level: intermediate
doc_type: reference
description: Motoko language documentation
title: "Literals"
hide_table_of_contents: true
---

Literals are constant expressions that require no further evaluation:

- **Integer literals**: (Numbers, hexadecimal), such as: `42`, `109231`, `0x2A`

- **Float literals**: (Floating point numbers), such as: `3.14`, `2.5e3`

- **Character literals**: (Unicode characters), such as: `'A'`, `'J'`, `'✮'`

- **Text literals**: `"Hello"`

- **Blob literals**: Byte sequences using the same syntax as `Text`, such as: `"Motoko" : Blob` (interpreted as [UTF-8](https://en.wikipedia.org/wiki/UTF-8) when converted)

You can use literals directly in expressions.

```motoko
100 + 50
```

## Resources

- [Literals](https://internetcomputer.org/docs/motoko/main/reference#literals)

