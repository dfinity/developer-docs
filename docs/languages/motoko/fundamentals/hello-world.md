---
sidebar_position: 1
description: "Motoko language documentation"
title: "Hello, world!"
hide_table_of_contents: true
---

"Hello, world!" is a common starting point used to showcase a programming language's basic syntax.

Below is an example of "Hello, world!" written in Motoko:

```motoko
// If an actor is declared with the persistent keyword, all private declarations are considered stable by default
persistent actor HelloWorld {
  // We store the greeting in a stable variable such that it gets persisted over canister upgrades.
  var greeting : Text = "Hello, ";

  // This update method modifies the greeting prefix.
  public func setGreeting(prefix : Text) : async () {
    greeting := prefix;
  };

  // This query method returns the currently persisted greeting with the given name.
  public query func greet(name : Text) : async Text {
    return greeting # name # "!";
  };
};
```

In this example:

1. The code begins by defining an [actor](/languages/motoko/fundamentals/actors-async) named `HelloWorld`. In Motoko, an actor is an object capable of maintaining state and communicating with other entities via message passing.

2. It then declares the variable `greeting`. This is a [stable variable](/languages/motoko/fundamentals/stable-types) because the actor is declared with the keyword `persistent`. Stable variables are used to store data that persists across canister upgrades. [Read more about canister upgrades.](https://internetcomputer.org/docs/building-apps/canister-management/upgrade)

3. An [update method](https://internetcomputer.org/docs/building-apps/interact-with-canisters/update-calls) named `setGreeting` is used to modify the canister’s state. This method specifically updates the value stored in `greeting`.

4. Finally, a [query method](https://internetcomputer.org/docs/building-apps/interact-with-canisters/query-calls) named `greet` is defined. Query methods are read-only and return information from the canister without changing its state. This method returns the current `greeting` value, followed by the input text. The method body produces a response by concatenating `"Hello, "` with the input `name`, followed by an exclamation point.

[Learn more about actors and basic syntax](/languages/motoko/fundamentals/defining-an-actor).