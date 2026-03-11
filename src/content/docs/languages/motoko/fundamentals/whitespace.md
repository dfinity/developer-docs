---
sidebar_position: 11
source_ref: 1.3.0
source_repo: https://github.com/caffeinelabs/motoko
last_verified: 2026-03-10
level: intermediate
doc_type: reference
description: Motoko language documentation
title: "Whitespace"
---

Whitespace characters (spaces, tabs, newlines) are generally ignored in Motoko, but are essential for separating syntax components like keywords and identifiers. Proper use of whitespace enhances code readability.

### Incorrect use of whitespace

```motoko
persistent actor Counter{var x : Nat = 0; public func inc(): async Int{x+1; }};
```

### Proper whitespace usage

```motoko
persistent actor Counter {
  var x : Nat = 0;
  public func inc() : async Int {
    x + 1;
  };
};
```

## Resources

- [Motoko style guide](https://internetcomputer.org/docs/motoko/main/reference)

