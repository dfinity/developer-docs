---
title: "Paginating query results"
description: "How to implement reliable pagination for canister query methods, including cursor-based patterns for mutable datasets"
sidebar:
  order: 6
---

Many canisters expose query methods that return lists of items: messages, transactions, tokens, users. When the list grows large, returning all items in a single response is impractical. Pagination splits results into pages, but the approach matters: a naive offset-based implementation produces incorrect results as soon as the underlying dataset changes.

## The problem with offset-based pagination

The simplest pagination approach passes an `offset` (number of items to skip) and a `limit` (maximum items to return). This works correctly when the dataset is immutable, but breaks as soon as items are added or removed between pages.

**Example:** a user fetches page 1 (items 0-9). Before they fetch page 2, a new item is inserted at position 0. Page 2 now returns items 10-19, but item 9 has shifted to position 10 and is returned again. Item 0 from the original ordering is never seen.

This is a common source of bugs in applications that allow concurrent writes.

## Cursor-based pagination

Cursor-based pagination identifies the last item the caller received, rather than its position in the list. The caller passes a cursor (typically the ID or key of the last item they received), and the canister returns the next batch of items that come after that cursor.

Because the cursor is tied to an item identity rather than a position, insertions and deletions before the cursor position do not affect the correctness of subsequent pages.

### Motoko example

```motoko
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";

persistent actor {

  type Item = { id : Nat; name : Text };
  type Page = { items : [Item]; nextCursor : ?Nat };

  var nextId : Nat = 0;
  let items = Map.empty<Nat, Item>();

  public func insert(name : Text) : async Nat {
    let id = nextId;
    Map.add(items, Nat.compare, id, { id; name });
    nextId += 1;
    id
  };

  // Returns up to `limit` items with IDs strictly greater than `afterId`.
  // Pass `null` for `afterId` to start from the beginning.
  // Returns `nextCursor = null` when there are no more items.
  public query func listItems(afterId : ?Nat, limit : Nat) : async Page {
    let threshold = switch afterId { case null 0; case (?n) n + 1 };
    var collected : [Item] = [];
    var count = 0;
    label scan for ((id, item) in Map.entries(items)) {
      if (id < threshold) continue scan;
      if (count >= limit) break scan;
      collected := Array.concat(collected, [item]);
      count += 1;
    };
    let nextCursor = if (count < limit) null else ?(collected[count - 1].id);
    { items = collected; nextCursor }
  };

}
```

### Rust example

```rust
use ic_stable_structures::{StableBTreeMap, memory_manager::{MemoryId, MemoryManager, VirtualMemory}, DefaultMemoryImpl};
use ic_stable_structures::storable::{Bound, Storable};
use ic_cdk::{query, update};
use candid::{CandidType, Deserialize};
use serde::Serialize;
use std::borrow::Cow;
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct Item {
    id: u64,
    name: String,
}

impl Storable for Item {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = vec![];
        ciborium::into_writer(self, &mut buf).expect("failed to encode Item");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        ciborium::from_reader(bytes.as_ref()).expect("failed to decode Item")
    }
}

#[derive(CandidType)]
struct Page {
    items: Vec<Item>,
    next_cursor: Option<u64>,
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static ITEMS: RefCell<StableBTreeMap<u64, Item, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        ));

    static NEXT_ID: RefCell<u64> = RefCell::new(0);
}

#[update]
fn insert(name: String) -> u64 {
    let id = NEXT_ID.with(|n| {
        let current = *n.borrow();
        *n.borrow_mut() = current + 1;
        current
    });
    ITEMS.with(|items| items.borrow_mut().insert(id, Item { id, name }));
    id
}

/// Returns up to `limit` items with IDs strictly greater than `after_id`.
/// Pass `None` for `after_id` to start from the beginning.
/// Returns `next_cursor = None` when there are no more items.
#[query]
fn list_items(after_id: Option<u64>, limit: u64) -> Page {
    let start = after_id.map(|id| id + 1).unwrap_or(0);
    let mut result = Vec::new();

    ITEMS.with(|items| {
        for (_, item) in items.borrow().range(start..) {
            if result.len() as u64 >= limit {
                break;
            }
            result.push(item.clone());
        }
    });

    let next_cursor = if result.len() as u64 < limit {
        None
    } else {
        result.last().map(|item| item.id)
    };

    Page { items: result, next_cursor }
}

ic_cdk::export_candid!();
```

## Handling deleted cursor items

When a caller resumes pagination using a cursor that no longer exists (the item was deleted), the canister should return items that come after where the cursor item would have been, based on sort order. In both examples above, the cursor is a monotonically increasing integer ID. Because deleted IDs are never reused, a query with `after_id = 42` will always return items with IDs greater than 42, even if ID 42 no longer exists.

If your dataset uses non-integer cursors or allows ID reuse, you need to handle this case explicitly in your query method. Return the next batch that would logically follow the cursor position in the current sort order.

## Sort order stability

Cursor-based pagination requires a consistent sort order. If the sort order can change between pages (for example, items are re-ranked by score while the user is paginating), cursor-based pagination can still produce gaps or duplicates.

For datasets with a stable natural sort order (by insertion time, by monotonic ID, or by an immutable attribute), cursor pagination is reliable. For datasets sorted by frequently changing attributes, consider whether pagination is the right interface at all, or whether the caller should re-fetch from the beginning when the sort order changes.

## Cycle cost considerations

Each call to a query method on a canister on the IC mainnet costs cycles. When paginating a large dataset, the total cycle cost is proportional to the number of pages fetched. If callers frequently paginate through the entire dataset, consider:

- Increasing the page size to reduce the number of round trips
- Caching recent results at the frontend layer
- Exposing a bulk export method for callers that need the full dataset

## Related

- [Inter-canister calls](./inter-canister-calls.md): calling query methods from other canisters
- [Calling from clients](./calling-from-clients.md): making query calls from a browser or CLI
- [Data persistence](../backends/data-persistence.md): storage patterns for canister state
- [Stable structures (Rust)](../../languages/rust/stable-structures.md): deep dive into `ic-stable-structures` used in the Rust example above

<!-- Upstream: informed by dfinity/portal docs/building-apps/best-practices/general.mdx (pagination item) -->
