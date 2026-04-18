---
sidebar_position: 3
description: "Motoko language documentation"
title: "Caller identification"
---

On ICP, every user and canister has a unique **principal** identifier. When a canister receives a message, such as a function call, the principal identifying the caller of the function is included in the message.

The caller’s principal is provided by the network, not the user or canister. A principal cannot be forged or spoofed by a malicious user.

Motoko’s `shared` keyword is used to declare a shared function. Shared functions support a simple form of caller identification that can be used to inspect incoming messages and implement access control based on the caller's principal. The shared function can also declare an optional parameter of type `{caller : Principal}`.

For example, when a shared function is called by a user or another canister, the caller's principal can be captured with `msg.caller`:

``` motoko no-repl
shared(msg) func inc() : async () {
  // ... msg.caller ...
}
```

In this example, the shared function `inc()` specifies a `msg` parameter, a record, and the `msg.caller` accesses the principal field of `msg`.

To access the caller of an actor class constructor, you use the same syntax on the actor class declaration:

``` motoko
shared(msg) persistent actor class Counter(init : Nat) {
  // ... msg.caller ...
}
```

## Adding access control

Access control can be added to an application by recording a caller's principal and then introducing control rules, such as a list of allowed principals that are permitted to call the function. If the caller's principal is not within the list, their call to the function will be rejected.

For example, if you have an actor called `Counter`, you can record the principal that installed the actor by binding it to an `owner` variable. Then, you can implement a check that verifies that the caller of each method the actor exposes is equal to the principal stored in `owner`:

```motoko
shared(msg) persistent actor class Counter(init : Nat) {

  transient let owner = msg.caller;

  var count = init;

  public shared(msg) func inc() : async () {
    assert (owner == msg.caller);
    count += 1;
  };

  public func read() : async Nat {
    count
  };

  public shared(msg) func bump() : async Nat {
    assert (owner == msg.caller);
    count := 1;
    count;
  };
}
```

In this example, the `assert (owner == msg.caller)` expression causes the functions `inc()` and `bump()` to trap if the call is unauthorized, preventing any modification of the `count` variable. However, the `read()` function permits any caller.

The argument to `shared` is just a pattern. You can rewrite the above to use pattern matching:

```motoko
shared({caller = owner}) persistent actor class Counter(init : Nat) {

  var count : Nat = init;

  public shared({caller}) func inc() : async () {
    assert (owner == caller);
    count += 1;
  };

  // ...
}
```

:::note

Simple actor declarations do not let you access their installer. If you need access to the installer of an actor, rewrite the actor declaration as a zero-argument actor class instead.

```motoko no-repl
shared(msg) actor class InstallerAware() {
  let installer = msg.caller; // This is the principal of the installer

  public func whoInstalled() : async Principal {
    installer
  };
}
```

:::


## Recording principals

Principals support equality, ordering, and hashing, so you can efficiently store principals in containers for functions such as maintaining an allow or deny list. More operations on principals are available in the [principal](https://mops.one/core/docs/Principal) core module.

The data type of `Principal` in Motoko supports equality, ordering, and hashing. `Principal`s both sharable and stable, meaning you can compare them for equality directly.

Below is an example of how you can record a function's caller `Principal`s in a set and check if a caller is already in the set:

```motoko
import Principal "mo:core/Principal";
import Set "mo:core/pure/Set";
import Error "mo:core/Error";

persistent actor {

    // Create set to record principals
    var principals : Set.Set<Principal> = Set.empty();

    // Check if principal is recorded
    public shared query(msg) func isRecorded() : async Bool {
        let caller = msg.caller;
        Set.contains(principals, Principal.compare, caller);
    };

    // Record a new principal
    public shared(msg) func recordPrincipal() : async () {
        let caller = msg.caller;
        if (Principal.isAnonymous(caller)) {
            throw Error.reject("Anonymous principal not allowed");
        };

        principals := Set.add(principals, Principal.compare, caller)
    };
};
```


