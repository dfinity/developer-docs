---
title: "Certification"
description: "Certified state trees, delegation chains, certificate encoding, and the HTTP Gateway protocol"
sidebar:
  label: "Certification"
  order: 4
---

## Certification {#certification}

Some parts of the IC state are exposed to users in a tamperproof way via certification: the IC can reveal a *partial state tree* which includes just the data of interest, together with a signature on the root hash of the state tree. This means that a user can be sure that the response is correct, even if the user happens to be communicating with a malicious node, or has received the certificate via some other untrusted way.

To validate a value using a certificate, the user conceptually

1.  checks the validity of the partial tree using `verify_cert`,

2.  looks up the value in the certificate using `lookup` at a given path, which uses the subroutine `lookup_path` on the certificate's tree.

This mechanism is used in the `read_state` request type, and eventually also for other purposes.

### Root of trust

The root of trust is the *root public key*, which must be known to the user a priori. In a local canister execution environment, the key can be fetched via the [`/api/v2/status`](./https-interface.md#api-status) endpoint.

### Certificate

A certificate consists of

-   a tree

-   a signature on the tree root hash valid under some *public key*

-   an optional *delegation* that links that public key to *root public key*.

The IC will certify states by issuing certificates where the tree is a partial state tree. The state tree can be pruned by replacing subtrees with their root hashes (yielding a new and potentially smaller but still valid certificate) to only include paths pertaining to relevant data but still preserving enough information to recover the *tree root hash*.

More formally, a certificate is described by the following data structure:
```
Certificate = {
  tree : HashTree
  signature : Signature
  delegation : NoDelegation | Delegation
}
HashTree
  = Empty
  | Fork HashTree HashTree
  | Labeled Label HashTree
  | Leaf blob
  | Pruned Hash
Label = Blob
Hash = Blob
Signature = Blob
```

A certificate is validated with regard to the root of trust by the following algorithm (which uses `check_delegation` defined in [Delegation](#certification-delegation)):

    verify_cert(cert) =
      let root_hash = reconstruct(cert.tree)
      // see section Delegations below
      if check_delegation(cert.delegation) = false then return false
      let bls_key = delegation_key(cert.delegation)
      verify_bls_signature(bls_key, cert.signature, domain_sep("ic-state-root") · root_hash)

    reconstruct(Empty)       = H(domain_sep("ic-hashtree-empty"))
    reconstruct(Fork t1 t2)  = H(domain_sep("ic-hashtree-fork") · reconstruct(t1) · reconstruct(t2))
    reconstruct(Labeled l t) = H(domain_sep("ic-hashtree-labeled") · l · reconstruct(t))
    reconstruct(Leaf v)      = H(domain_sep("ic-hashtree-leaf") · v)
    reconstruct(Pruned h)    = h

    domain_sep(s) = byte(|s|) · s

where `H` is the SHA-256 hash function,

    verify_bls_signature : PublicKey -> Signature -> Blob -> Bool

is the [BLS signature verification function](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature-04#section-4), ciphersuite BLS\_SIG\_BLS12381G1\_XMD:SHA-256\_SSWU\_RO\_NUL\_. See that document also for details on the encoding of BLS public keys and signatures.

All state trees include the time at path `/time` (see [Time](./index.md#state-tree-time)). Users that get a certificate with a state tree can look up the timestamp to guard against working on obsolete data.

### Lookup {#lookup}

Given a (verified) tree, the user can fetch the value at a given path, which is a sequence of labels (blobs). In this document, we write paths suggestively with slashes as separators; the actual encoding is not actually using slashes as delimiters.

The following algorithm looks up a `path` in a certificate, and returns either

-   `Found v`: the requested `path` has an associated value `v` in the tree,

-   `Absent`: the requested path is not in the tree,

-   `Unknown`: it cannot be syntactically determined if the requested `path` was pruned or not; i.e., there exist at least two trees (one containing the requested path and one *not* containing the requested path) from which the given tree can be obtained by pruning some subtrees,

-   `Error`: the requested path does not have an associated value in the tree, but the requested path is in the tree:

```html

lookup(path, cert) = lookup_path(path, cert.tree)

lookup_path([], Empty) = Absent
lookup_path([], Leaf v) = Found v
lookup_path([], Pruned _) = Unknown
lookup_path([], Labeled _ _) = Error
lookup_path([], Fork _ _) = Error

lookup_path(l::ls, tree) =
  match find_label(l, flatten_forks(tree)) with
  | Absent -> Absent
  | Unknown -> Unknown
  | Error -> Error
  | Found subtree -> lookup_path ls subtree

flatten_forks(Empty) = []
flatten_forks(Fork t1 t2) = flatten_forks(t1) · flatten_forks(t2)
flatten_forks(t) = [t]

find_label(l, _ · Labeled l1 t · _)                | l == l1     = Found t
find_label(l, _ · Labeled l1 _ · Labeled l2 _ · _) | l1 < l < l2 = Absent
find_label(l,                    Labeled l2 _ · _) |      l < l2 = Absent
find_label(l, _ · Labeled l1 _ )                   | l1 < l      = Absent
find_label(l, [Leaf _])                                          = Absent
find_label(l, [])                                                = Absent
find_label(l, _)                                                 = Unknown

```

Given a path `prefix`, we define `lookup*(prefix, cert)` to be the concatenation of all values at paths with the given prefix,
i.e., for every `path` of the form `path = prefix · _` with `lookup(path, cert) = Found v`.

The IC will only produce well-formed state trees, and the above algorithm assumes well-formed trees. These have the property that labeled subtrees appear in strictly increasing order of labels, and are not mixed with leaves. More formally:

    well_formed(tree) =
      (tree = Leaf _) ∨ (well_formed_forest(flatten_forks(tree)))

    well_formed_forest(trees) =
      strictly_increasing([l | Label l _ ∈ trees]) ∧
      ∀ Label _ t ∈ trees. well_formed(t) ∧
      ∀ t ∈ trees. t ≠ Leaf _

### Delegation {#certification-delegation}

The root key can delegate certification authority to other keys.

A certificate by the root subnet does not have a delegation field. A certificate by other subnets include a delegation, which is itself a certificate that proves that the subnet is listed in the root subnet's state tree (see [Subnet information](./index.md#state-tree-subnet)), and reveals its public key.

:::note

The certificate included in the delegation (if present) must not itself again contain a delegation.

:::

```
Delegation = {
   subnet_id : Principal;
   certificate : Certificate;
 }
```

A delegation is verified using the following algorithm:
```
check_delegation(NoDelegation) = true
check_delegation(Delegation d) = verify_cert(d.certificate) and lookup(["subnet",d.subnet_id,"public_key"],d.certificate) = Found _ and d.certificate.delegation = NoDelegation
```

The delegation key (a BLS key) is computed by the following algorithm:
```
delegation_key(NoDelegation) : public_bls_key = root_public_key
delegation_key(Delegation d) : public_bls_key =
  match lookup(["subnet",d.subnet_id,"public_key"],d.certificate) with
    Found der_key -> extract_der(der_key)
```

where `root_public_key` is the a priori known root key and
```
extract_der : Blob -> Blob
```

implements DER decoding of the public key, following [RFC5480](https://datatracker.ietf.org/doc/html/rfc5480) using OID 1.3.6.1.4.1.44668.5.3.1.2.1 for the algorithm and 1.3.6.1.4.1.44668.5.3.2.1 for the curve.

Delegations are *scoped*, i.e., they indicate which set of canister principals the delegatee subnet may certify for. This set can be obtained from a delegation `d` using `lookup*(["canister_ranges",d.subnet_id],d.certificate)`. See [lookup](#lookup) for the definition of `lookup*` and [Canister ranges](./index.md#state-tree-canister-ranges) for the description of the encoding used. The various applications of certificates describe if and how the subnet scope comes into play.

### Encoding of certificates {#certification-encoding}

The binary encoding of a certificate is a CBOR (see [CBOR](./index.md#cbor)) value according to the following CDDL (see [CDDL](./index.md#cddl)). You can also [download the file](_attachments/certificates.cddl).

The values in the [The system state tree](./index.md#state-tree) are encoded to blobs as follows:

-   natural numbers are leb128-encoded.

-   text values are UTF-8-encoded

-   blob values are encoded as is

### Example

Consider the following tree-shaped data (all single character strings denote labels, all other denote values)

    ─┬╴ "a" ─┬─ "x" ─╴"hello"
     │       └╴ "y" ─╴"world"
     ├╴ "b" ──╴ "good"
     ├╴ "c"
     └╴ "d" ──╴ "morning"

A possible hash tree for this labeled tree might be, where `┬` denotes a fork. This is not a typical encoding (a fork with `Empty` on one side can be avoided), but it is valid.

    ─┬─┬╴"a" ─┬─┬╴"x" ─╴"hello"
     │ │      │ └╴Empty
     │ │      └╴  "y" ─╴"world"
     │ └╴"b" ──╴"good"
     └─┬╴"c" ──╴Empty
       └╴"d" ──╴"morning"

This tree has the following CBOR (see [CBOR](./index.md#cbor)) encoding

    8301830183024161830183018302417882034568656c6c6f810083024179820345776f726c6483024162820344676f6f648301830241638100830241648203476d6f726e696e67

and the following root hash

    eb5c5b2195e62d996b84c9bcc8259d19a83786a2f59e0878cec84c811f669aa0

Pruning this tree with the following paths

      /a/y
      /ax
      /d

would lead to this tree (with pruned subtree represented by their hash):

    ─┬─┬╴"a" ─┬─ 1B4FEFF9BEF8131788B0C9DC6DBAD6E81E524249C879E9F10F71CE3749F5A638
     │ │      └╴ "y" ─╴"world"
     │ └╴"b" ──╴7B32AC0C6BA8CE35AC82C255FC7906F7FC130DAB2A090F80FE12F9C2CAE83BA6
     └─┬╴EC8324B8A1F1AC16BD2E806EDBA78006479C9877FED4EB464A25485465AF601D
       └╴"d" ──╴"morning"

Note that the `"b"` label is included (without content) to prove the absence of the `/ax` path.

This tree encodes to CBOR as

    83018301830241618301820458201b4feff9bef8131788b0c9dc6dbad6e81e524249c879e9f10f71ce3749f5a63883024179820345776f726c6483024162820458207b32ac0c6ba8ce35ac82c255fc7906f7fc130dab2a090f80fe12f9c2cae83ba6830182045820ec8324b8a1f1ac16bd2e806edba78006479c9877fed4eb464a25485465af601d830241648203476d6f726e696e67

and (obviously) the same root hash.

In the pruned tree, the `lookup_path` function behaves as follows:

    lookup_path(["a", "a"], pruned_tree) = Unknown
    lookup_path(["a", "y"], pruned_tree) = Found "world"
    lookup_path(["aa"],     pruned_tree) = Absent
    lookup_path(["ax"],     pruned_tree) = Absent
    lookup_path(["b"],      pruned_tree) = Unknown
    lookup_path(["bb"],     pruned_tree) = Unknown
    lookup_path(["d"],      pruned_tree) = Found "morning"
    lookup_path(["e"],      pruned_tree) = Absent

## The HTTP Gateway protocol {#http-gateway}

The HTTP Gateway Protocol has been moved into its own [specification](../http-gateway-spec.md).

<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->
