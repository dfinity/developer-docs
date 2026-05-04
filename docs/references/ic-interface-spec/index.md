---
title: "IC Interface Specification"
description: "Introduction, pervasive concepts, and the IC system state tree"
sidebar:
  label: "Introduction"
  order: 0
---

## Introduction

Welcome to *the Internet Computer*! We speak of "the" Internet Computer, because although under the hood a large number of physical computers are working together in a blockchain protocol, in the end we have the appearance of a single, shared, secure and world-wide accessible computer. Developers who want to build decentralized applications (or *dapps* for short) that run on the Internet Computer blockchain and end-users who want to use those dapps need to know very little, if anything, about the underlying protocol. However, knowing some details about the interfaces that the Internet Computer exposes can allow interested developers and architects to take fuller advantages of the unique features that the Internet Computer provides.

### Target audience

This document describes this *external* view of the Internet Computer, i.e. the low-level interfaces it provides to dapp developers and users, and what will happen when they use these interfaces.

:::note

While this document describes the external interface and behavior of the Internet Computer, it is not intended as end-user or end-developer documentation. Most developers will interact with the Internet Computer through additional tooling like the SDK, Canister Development Kits and Motoko. Please see the [developer docs](/) for suitable documentation.

:::

The target audience of this document are

-   those who use these low-level interfaces (e.g. implement agents, canister developments kits, emulators, other tooling).

-   those who implement these low-level interfaces (e.g. developers of the Internet Computer implementation)

-   those who want to understand the intricacies of the Internet Computer's behavior in great detail (e.g. to do a security analysis)

:::note

This document is a rigorous, technically dense reference. It is not an introduction to the Internet Computer, and as such most useful to those who understand the high-level concepts. Please see more high-level documentation first.

:::

### Scope of this document

If you think of the Internet Computer as a distributed engine that executes WebAssembly-based dapps, then this document describes exclusively the aspect of executing those dapps. To the extent possible, this document will *not* talk about consensus protocols, nodes, subnets, orthogonal persistence or governance.

This document tries to be implementation agnostic: It would apply just as well to a (hypothetical) compatible reimplementation of the Internet Computer. This implies that this document does not cover interfaces towards those running the Internet Computer (e.g. data center operators, protocol developers, governance users), as topics like node update, monitoring, logging are inherently tied to the actual *implementation* and its architecture.

### Overview of the Internet Computer

Dapps on the Internet Computer, or *IC* for short, are implemented as *canister smart contracts*, or *canisters* for short. If you want to build on the Internet Computer as a dapp developer, you first create a *canister module* that contains the WebAssembly code and configuration for your dapp, and deploy it using the [HTTPS interface](./https-interface.md#http-interface). You can create canister modules using the Motoko language and the SDK, which is more convenient. If you want to use your own tooling, however, then this document describes [what a canister module looks like](./canister-interface.md#canister-module-format) and how the [WebAssembly code can interact with the IC](./canister-interface.md#system-api).

Once your dapp is running on the Internet Computer, it is a canister smart contract, and users can interact with it. They can use the [HTTPS interface](./https-interface.md#http-interface) to interact with the canister according to the [System API](./canister-interface.md#system-api).

The user can also use the HTTPS interface to issue read-only queries, which are faster, but cannot change the state of a canister.

```plantuml
    actor Developer
    actor User
    participant "Internet Computer" as IC
    participant "Canister 1" as Can1
    Developer -> IC : /submit create canister
    create Can1
    IC -> Can1 : create
    Developer <-- IC : canister-id=1
    Developer -> IC : /submit install module
    IC -> Can1 : initialize
    |||
    User -> IC : /submit call "hello"
    IC -> Can1 : hello
    return "Hello world!"
    User <-- IC : "Hello World!"
```
**A typical use of the Internet Computer. (This is a simplified view; some of the arrows represent multiple interaction steps or polling.)**

Sections "[HTTPS Interface](./https-interface.md#http-interface)" and "[Canister interface (System API)](./canister-interface.md#system-api)" describe these interfaces, together with a brief description of what they do. Afterwards, you will find a [more formal description](./abstract-behavior.md#abstract-behavior) of the Internet Computer that describes its abstract behavior with more rigor.

### Nomenclature

To get some consistency in this document, we try to use the following terms with precision:

We avoid the term "client", as it could be the client of the Internet Computer or the client inside the distributed network that makes up the Internet Computer. Instead, we use the term *user* to denote the external entity interacting with the Internet Computer, even if in most cases it will be some code (sometimes called "agent") acting on behalf of a (human) user.

The public entry points of canisters are called *methods*. Methods can be declared to be either *update methods* (state mutation is preserved, can call update and query methods of arbitrary canisters), *query methods* (state mutation is discarded, no further calls can be made), or *composite query* methods (state mutation is discarded, can call query and composite query methods of canisters on the same subnet).

Methods can be *called*, from *caller* to *callee*, and will eventually incur a *response* which is either a *reply* or a *reject*. A method may have *parameters*, which are provided with concrete *arguments* in a method call.

External calls can be update calls, which can *only* call update and query methods, and query calls, which can *only* call query and composite query methods. Inter-canister calls issued while evaluating an update call can call update and query methods (just like update calls). Inter-canister calls issued while evaluating a query call (to a composite query method) can call query and composite query methods (just like query calls). Note that calls from a canister to itself also count as "inter-canister". Update and query call offer a security/efficiency trade-off.
Update calls are executed in *replicated* mode, i.e. execution takes place in parallel on multiple replicas who need to arrive at a consensus on what the result of the call is. Query calls are fast but offer less guarantees since they are executed in *non-replicated* mode, by a single replica.

Internally, a call or a response is transmitted as a *message* from a *sender* to a *receiver*. Messages do not have a response.

WebAssembly *functions* are exported by the WebAssembly module or provided by the System API. These are *invoked* and can either *trap* or *return*, possibly with a return value. A trap is caused by an irrecoverable error in the WebAssembly module (e.g., division by zero) or System API execution (e.g., running out of memory or exceeding the instruction limit for a single message execution imposed by the Internet Computer). Functions, too, have parameters and take arguments.

External *users* interact with the Internet Computer by issuing *requests* on the HTTPS interface. Requests have responses which can either be replies or rejects. Some requests cause internal messages to be created.

Canisters and users are identified by a *principal*, sometimes also called an *id*.

## Pervasive concepts

Before going into the details of the four public interfaces described in this document (namely the agent-facing [HTTPS interface](./https-interface.md#http-interface), the canister-facing [System API](./canister-interface.md#system-api), the [virtual Management canister](./management-canister.md#ic-management-canister) and the [System State Tree](#state-tree)), this section introduces some concepts that transcend multiple interfaces.

### Unspecified constants and limits

This specification may refer to certain constants and limits without specifying their concrete value (yet), i.e. they are implementation defined. Many are resource limits which are relevant only to specify the error-handling behavior of the IC (which, as mentioned above, is also not yet precisely described in this document). This list is not complete.

-   `MAX_CYCLES_PER_MESSAGE`

    Amount of cycles that a canister has to have before a message is attempted to be executed, which is deducted from the canister balance before message execution. See [Message execution](./abstract-behavior.md#rule-message-execution).

-   `MAX_CYCLES_PER_RESPONSE`

    Amount of cycles that the IC sets aside when a canister performs a call. This is used to pay for processing the response message, and unused cycles after the execution of the response are refunded. See [Message execution](./abstract-behavior.md#rule-message-execution).

-   `MAX_CYCLES_PER_QUERY`

    Maximum amount of cycles that can be used in total (across all calls to query and composite query methods and their callbacks) during evaluation of a query call.

-   `CHUNK_STORE_SIZE`

    Maximum number of chunks that can be stored within the chunk store of a canister.

-   `MAX_CHUNKS_IN_LARGE_WASM`

    Maximum number of chunks that can comprise a large Wasm module.

-   `DEFAULT_PROVISIONAL_CYCLES_BALANCE`

    Amount of cycles allocated to a new canister by default, if not explicitly specified. See [IC method](./management-canister.md#ic-provisional_create_canister_with_cycles).

-   `MAX_CALL_DEPTH_COMPOSITE_QUERY`

    Maximum nesting level of calls during evaluation of a query call to a composite query method.

-   `MAX_WALL_CLOCK_TIME_COMPOSITE_QUERY`

    Maximum wall clock time spent on evaluation of a query call.

-   `MAX_SNAPSHOTS`

    Maximum number of canister snapshots per canister.

-   `MAX_CALL_TIMEOUT`

    The maximum timeout (in seconds) for an inter-canister call.

-   `MAX_ENV_VAR_NAME_LENGTH`

    The maximum length of an environment variable name.

-   `MAX_ENV_VAR_VALUE_LENGTH`

    The maximum length of an environment variable value.

-   `MAX_ENV_VAR_COUNT`

    The maximum number of environment variables allowed.

### Principals {#principal}

Principals are generic identifiers for canisters, users and possibly other concepts in the future. As far as most uses of the IC are concerned they are *opaque* binary blobs with a length between 0 and 29 bytes, and there is intentionally no mechanism to tell canister ids and user ids apart.

There is, however, some structure to them to encode specific authentication and authorization behavior.

#### Special forms of Principals {#id-classes}

In this section, `H` denotes SHA-224, `·` denotes blob concatenation and `|p|` denotes the length of `p` in bytes, encoded as a single byte.

There are several classes of ids:

1.  *Opaque ids*.

    These are always generated by the IC and have no structure of interest outside of it.

:::note

Typically, these end with the byte `0x01`, but users of the IC should not need to care about that.

:::

2.  *Self-authenticating ids*.

    These have the form `H(public_key) · 0x02` (29 bytes).

    An external user can use these ids as the `sender` of a request if they own the corresponding private key. The public key uses one of the encodings described in [Signatures](#signatures).

3.  *Derived ids*

    These have the form `H(|registering_principal| · registering_principal · derivation_nonce) · 0x03` (29 bytes).

    These ids are treated specially when an id needs to be registered. In such a request, whoever requests an id can provide a `derivation_nonce`. By hashing that together with the principal of the caller, every principal has a space of ids that only they can register ids from.

:::note

Derived IDs are currently not explicitly used in this document, but they may be used internally or in the future.

:::

4.  *Anonymous id*

    This has the form `0x04`, and is used for the anonymous caller. It can be used in call and query requests without a signature.

5.  *Reserved ids*

    These have the form of `blob · 0x7f`, `0 ≤ |blob| < 29`.

    These ids can be useful for applications that want to re-use the [Textual representation of principals](#textual-ids) but want to indicate explicitly that the blob does not address any canisters or a user.

When the IC creates a *fresh* id, it never creates a self-authenticating id, reserved id, an anonymous id or an id derived from what could be a canister or user.

#### Textual representation of principals {#textual-ids}

We specify a *canonical textual format* that is recommended whenever principals need to be printed or read in textual format, e.g. in log messages, transactions browser, command line tools, source code.

The textual representation of a blob `b` is `Grouped(Base32(CRC32(b) · b))` where

-   `CRC32` is a four byte check sequence, calculated as defined by ISO 3309, ITU-T V.42, and [elsewhere](https://www.w3.org/TR/2003/REC-PNG-20031110/#5CRC-algorithm), and stored as big-endian, i.e., the most significant byte comes first and then the less significant bytes come in descending order of significance (MSB B2 B1 LSB).

-   `Base32` is the Base32 encoding as defined in [RFC 4648](https://datatracker.ietf.org/doc/html/rfc4648#section-6), with no padding character added.

-   The middle dot denotes concatenation.

-   `Grouped` takes an ASCII string and inserts the separator `-` (dash) every 5 characters. The last group may contain less than 5 characters. A separator never appears at the beginning or end.

The textual representation is conventionally printed with *lower case letters*, but parsed case-insensitively.

Because the maximum size of a principal is 29 bytes, the textual representation will be no longer than 63 characters (10 times 5 plus 3 characters with 10 separators in between them).

:::tip

The canister with id `0xABCD01` has check sequence `0x233FF206` ([online calculator](https://crccalc.com/?crc=ABCD01&method=crc32&datatype=hex&outtype=hex)); the final id is thus `em77e-bvlzu-aq`.

Example encoding from hex, and decoding to hex, in bash (the following can be pasted into a terminal as is):
```
function textual_encode() {
  ( echo "$1" | xxd -r -p | /usr/bin/crc32 /dev/stdin; echo -n "$1" ) |
  xxd -r -p | base32 | tr A-Z a-z |
  tr -d = | fold -w5 | paste -sd'-' -
}

function textual_decode() {
  echo -n "$1" | tr -d - | tr a-z A-Z |
  fold -w 8 | xargs -n1 printf '%-8s' | tr ' ' = |
  base32 -d | xxd -p | tr -d '\n' | cut -b9- | tr a-z A-Z
}
```

:::

### Canister lifecycle {#canister-lifecycle}

Dapps on the Internet Computer are called *canisters*. Conceptually, they consist of the following pieces of state:

-   A canister id (a [principal](#principal))

-   Their *controllers* (a possibly empty list of [principal](#principal))

-   A cycle balance

-   A reserved cycles balance, which are cycles set aside from the main cycle balance for resource payments.

-   The *canister status*, which is one of `running`, `stopping` or `stopped`.

-   Resource reservations

A canister can be *empty* (e.g. directly after creation) or *non-empty*. A non-empty canister also has

-   code, in the form of a canister module

-   memories (heap and stable memory)

-   globals

-   possibly further data that is specific to the implementation of the IC (e.g. queues)

Canisters are empty after creation and uninstallation, and become non-empty through [code installation](./management-canister.md#ic-install_code).

If an empty canister receives a response, that response is dropped, as if the canister trapped when processing the response. The cycles set aside for its processing and the cycles carried on the responses are added to the canister's *cycles* balance.

#### Canister cycles {#canister-cycles}

The IC relies on *cycles*, a utility token, to manage its resources. A canister pays for the resources it uses from its *cycle balances*. A *cycle\_balance* is stored as 128-bit unsigned integers and operations on them are saturating. In particular, if *cycles* are added to a canister that would bring its main cycle balance beyond 2<sup>128</sup>-1, then the balance will be capped at 2<sup>128</sup>-1 and any additional cycles will be lost.

When both the main and the reserved cycles balances of a canister fall to zero, the canister is *deallocated*. This has the same effect as

-   uninstalling the canister (as described in [IC method](./management-canister.md#ic-uninstall_code))

-   setting all resource reservations to zero

Afterwards the canister is empty. It can be reinstalled after topping up its main balance.

:::note

Once the IC frees the resources of a canister, its id, *cycle* balances, *controllers*, canister *version*, and the total number of canister changes are preserved on the IC for a minimum of 10 years. What happens to the canister after this period is currently unspecified.

:::

#### Canister status {#canister-status}

The canister status can be used to control whether the canister is processing calls:

-   In status `running`, calls to the canister are processed as normal.

-   In status `stopping`, calls to the canister are rejected by the IC with reject code `CANISTER_ERROR` (5), but responses to the canister are processed as normal.

-   In status `stopped`, calls to the canister are rejected by the IC with reject code `CANISTER_ERROR` (5), and there are no outstanding responses.

In all cases, calls to the [management canister](./management-canister.md#ic-management-canister) are processed, regardless of the state of the managed canister.

The controllers of the canister or subnet admins can initiate transitions between these states using [`stop_canister`](./management-canister.md#ic-stop_canister) and [`start_canister`](./management-canister.md#ic-start_canister), and query the state using [`canister_status`](./management-canister.md#ic-canister_status) (NB: this call returns additional information, such as the cycle balance of the canister). The canister itself can also query its state using [`ic0.canister_status`](./canister-interface.md#system-api-canister-status).

:::note

This status is orthogonal to whether a canister is empty or not: an empty canister can be in status `running`. Calls to such a canister are still rejected by the IC, but because the canister is empty.

:::

:::note

This status is orthogonal to whether a canister is frozen or not: a frozen canister can be in status `running`. Calls to such a canister are still rejected by the IC, but because the canister is frozen, the returned reject code is `SYS_TRANSIENT`.

:::

:::note

If a canister is in the `stopped` state, an additional boolean may be of interest: `ready_for_migration` indicates whether a stopped canister is ready to be migrated to another subnet (i.e., whether it has empty queues and flushed streams). This flag can only ever be `true` if the `status` is `stopped`. This property is guaranteed by the protocol, but deliberately not on the type level in order to facilitate backwards compatible service evolution.

:::

### Signatures {#signatures}

Digital signature schemes are used for authenticating messages in various parts of the IC infrastructure. Signatures are domain separated, which means that every message is prefixed with a byte string that is unique to the purpose of the signature.

The IC supports multiple signature schemes, with details given in the following subsections. For each scheme, we specify the data encoded in the public key (which is always DER-encoded, and indicates the scheme to use) as well as the form of the signatures (which are opaque blobs for the purposes of the rest of this specification).

In all cases, the signed *payload* is the concatenation of the domain separator and the message. All uses of signatures in this specification indicate a domain separator, to uniquely identify the purpose of the signature. The domain separators are prefix-free by construction, as their first byte indicates their length.

#### Ed25519 and ECDSA signatures {#ecdsa}

Plain signatures are supported for the schemes

-   [**Ed25519**](https://ed25519.cr.yp.to/index.html) or

-   [**ECDSA**](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf) on curve P-256 (also known as `secp256r1`), using SHA-256 as hash function, as well as on the Koblitz curve `secp256k1`.

-   Public keys must be valid for signature schemes Ed25519 or ECDSA and are encoded as DER.

    -   See [RFC 8410](https://datatracker.ietf.org/doc/html/rfc8410) for DER encoding of Ed25519 public keys.

    -   See [RFC 5480](https://datatracker.ietf.org/doc/html/rfc5480) for DER encoding of ECDSA public keys; the DER encoding must not specify a hash function. For curve `secp256k1`, the OID 1.3.132.0.10 is used. The points must be specified in uncompressed form (i.e. `0x04` followed by the big-endian 32-byte encodings of `x` and `y`).

-   The signatures are encoded as the concatenation of the 32-byte big endian encodings of the two values *r* and *s*.

#### Web Authentication {#webauthn}

The allowed signature schemes for web authentication are

-   [**ECDSA**](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf) on curve P-256 (also known as `secp256r1`), using SHA-256 as hash function.

-   [**RSA PKCS\#1v1.5 (RSASSA-PKCS1-v1\_5)**](https://datatracker.ietf.org/doc/html/rfc8017#section-8.2), using SHA-256 as hash function.

The signature is calculated by using the payload as the challenge in the web authentication assertion.

The signature is checked by verifying that the `challenge` field contains the [base64url encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-5) of the payload, and that `signature` verifies on `authenticatorData · SHA-256(utf8(clientDataJSON))`, as specified in the [WebAuthn w3c recommendation](https://www.w3.org/TR/webauthn/#op-get-assertion).

-   The public key is encoded as a DER-wrapped COSE key.

    It uses the `SubjectPublicKeyInfo` type used for other types of public keys (see, e.g., [RFC 8410, Section 4](https://datatracker.ietf.org/doc/html/rfc8410#section-4)), with OID 1.3.6.1.4.1.56387.1.1 (iso.org.dod.internet.private.enterprise.dfinity.mechanisms.der-wrapped-cose). The `BIT STRING` field `subjectPublicKey` contains the COSE encoding. See [WebAuthn w3c recommendation](https://www.w3.org/TR/webauthn/#sctn-encoded-credPubKey-examples) or [RFC 8152](https://datatracker.ietf.org/doc/html/rfc8152#section-13.1) for details on the COSE encoding.

:::tip

A DER wrapping of a COSE key is shown below. It can be parsed via the command `sed "s/#.*//" | xxd -r -p | openssl asn1parse -inform der`.

    30 5E                                       # SEQUENCE of length 94 bytes
      30 0C                                     # SEQUENCE of length 12 bytes
        06 0A 2B 06 01 04 01 83 B8 43 01 01     # OID 1.3.6.1.4.1.56387.1.1
      03 4E 00                                  # BIT STRING encoding of length 78,
        A501 0203 2620 0121 5820 7FFD 8363 2072 #    length is at byte boundary
        FD1B FEAF 3FBA A431 46E0 EF95 C3F5 5E39 #    contents is a valid COSE key
        94A4 1BBF 2B51 74D7 71DA 2258 2032 497E #    with ECDSA on curve P-256
        ED0A 7F6F 0009 2876 5B83 1816 2CFD 80A9
        4E52 5A6A 368C 2363 063D 04E6 ED

You can also view the wrapping in [an online ASN.1 JavaScript decoder](https://lapo.it/asn1js/#MF4wDAYKKwYBBAGDuEMBAQNOAKUBAgMmIAEhWCB__YNjIHL9G_6vP7qkMUbg75XD9V45lKQbvytRdNdx2iJYIDJJfu0Kf28ACSh2W4MYFiz9gKlOUlpqNowjYwY9BObt).

:::

-   The signature is a CBOR (see [CBOR](#cbor)) value consisting of a data item with major type 6 ("Semantic tag") and tag value `55799`, followed by a map with three mandatory fields:

    -   `authenticator_data` (`blob`): WebAuthn authenticator data.

    -   `client_data_json` (`text`): WebAuthn client data in JSON representation.

    -   `signature` (`blob`): Signature as specified in the [WebAuthn w3c recommendation](https://www.w3.org/TR/webauthn/#signature-attestation-types), which means DER encoding in the case of an ECDSA signature.

#### Canister signatures {#canister-signatures}

The IC also supports a scheme where a canister can sign a payload by declaring a special "certified variable".

This section makes forward references to other concepts in this document, in particular the section [Certification](./certification.md#certification).

-   The public key is a DER-wrapped structure that indicates the *signing canister*, and includes a freely choosable seed. Each choice of seed yields a distinct public key for the canister, and the canister can choose to encode information, such as a user id, in the seed.

    More concretely, it uses the `SubjectPublicKeyInfo` type used for other types of public keys (see, e.g., [RFC 8410, Section 4](https://datatracker.ietf.org/doc/html/rfc8410#section-4)), with OID 1.3.6.1.4.1.56387.1.2 (iso.org.dod.internet.private.enterprise.dfinity.mechanisms.canister-signature).

    The `BIT STRING` field `subjectPublicKey` is the blob `|signing_canister_id| · signing_canister_id · seed`, where `|signing_canister_id|` is the one-byte encoding of the the length of the `signing_canister_id` and `·` denotes blob concatenation.

-   The signature is a CBOR (see [CBOR](#cbor)) value consisting of a data item with major type 6 ("Semantic tag") and tag value `55799`, followed by a map with two mandatory fields:

    -   `certificate` (`blob`): A CBOR-encoded certificate as per [Encoding of certificates](./certification.md#certification-encoding).

    -   `tree` (`hash-tree`): A hash tree as per [Encoding of certificates](./certification.md#certification-encoding).

-   Given a payload together with public key and signature in the format described above the signature can be verified by checking the following two conditions:

    -   The `certificate` must be a valid certificate as described in [Certification](./certification.md#certification), with
        ```
        lookup_path(["canister", <signing_canister_id>, "certified_data"], certificate.tree) = Found (reconstruct(tree))
        ```

    where `signing_canister_id` is the id of the signing canister and `reconstruct` is a function that computes a root-hash for the tree.

    -   If the `certificate` includes a subnet delegation, then the `signing_canister_id` must be included in the delegation's canister id range (see [Delegation](./certification.md#certification-delegation)).

    -   The `tree` must be a `well_formed` tree with
        ```
        lookup_path(["sig", <s>, <m>], tree) = Found ""
        ```

    where `s` is the SHA-256 hash of the `seed` used in the public key and `m` is the SHA-256 hash of the payload.

### Supplementary Technologies {#supplementary-technologies}

#### CBOR {#cbor}

[Concise Binary Object Representation (CBOR)](https://www.rfc-editor.org/rfc/rfc8949) is a data format with a small code footprint, small message size and an extensible interface. CBOR is used extensively throughout the Internet Computer as the primary format for data exchange between components within the system.

[cbor.io](https://cbor.io) and [wikipedia.org](https://en.wikipedia.org/wiki/CBOR) contain a lot of helpful background information and relevant tools. [cbor.me](https://cbor.me) in particular, is very helpful for converting between CBOR hex and diagnostic information.

For example, the following CBOR hex:
```
82 61 61 a1 61 62 61 63
```

Can be converted into the following CBOR diagnostic format:
```
["a", {"b": "c"}]
```

Particular concepts to note from the spec are:

-   [Specification of the CBOR Encoding](https://www.rfc-editor.org/rfc/rfc8949#name-specification-of-the-cbor-e)

-   [CBOR Major Types](https://www.rfc-editor.org/rfc/rfc8949#name-major-types)

-   [CBOR Self-Describe](https://www.rfc-editor.org/rfc/rfc8949#self-describe)

#### CDDL {#cddl}

The [Concise Data Definition Language (CDDL)](https://datatracker.ietf.org/doc/html/rfc8610) is a data description language for CBOR. It is used at various points throughout this document to describe how certain data structures are encoded with CBOR.

## The system state tree {#state-tree}

Parts of the IC state are publicly exposed (e.g. via [Request: Read state](./https-interface.md#http-read-state) or [Certified data](./canister-interface.md#system-api-certified-data)) in a verified way (see [Certification](./certification.md#certification) for the machinery for certifying). This section describes the content of this system state abstractly.

Conceptually, the system state is a tree with labeled children, and values in the leaves. Equivalently, the system state is a mapping from paths (sequences of labels) to values, where the domain is prefix-free.

Labels are always blobs (but often with a human readable representation). In this document, paths are written suggestively with slashes as separators; the actual encoding is not actually using slashes as delimiters, and labels may contain the 0x2F byte (ASCII `/`) just fine. Values are either natural numbers, text values or blob values.

This section specifies the publicly relevant paths in the tree.

### Time {#state-tree-time}

-   `/time` (natural):

    All partial state trees include a timestamp, expressed in nanoseconds since 1970-01-01, indicating the time at which the state is current.

### Api boundary nodes information {#state-tree-api-bn}

The state tree contains information about all API boundary nodes (the source of truth for these API boundary node records is stored in the NNS registry canister).

- `/api_boundary_nodes/<node_id>/domain` (text)

    Domain name associated with a node. All domains are unique across nodes.
    Example: `api-bn1.example.com`.

- `/api_boundary_nodes/<node_id>/ipv4_address` (text)

    Public IPv4 address of a node in the dotted-decimal notation.
    If no `ipv4_address` is available for the corresponding node, then this path does not exist.  
    Example: `192.168.10.150`.

- `/api_boundary_nodes/<node_id>/ipv6_address` (text)

    Public IPv6 address of a node in the hexadecimal notation with colons.
    Example: `3002:0bd6:0000:0000:0000:ee00:0033:6778`.

### Subnet information {#state-tree-subnet}

The state tree contains information about the topology of the Internet Computer.

-   `/subnet/<subnet_id>/public_key` (blob)

    The public key of the subnet (a DER-encoded BLS key, see [Certification](./certification.md#certification))

-   `/subnet/<subnet_id>/type` (text)

    The subnet type of the subnet. Possible values are "application", "system", "verified_application", and "cloud_engine" (without quotes).

-   `/subnet/<subnet_id>/canister_ranges` (blob)

    The set of canister ids assigned to this subnet, represented as a list of closed intervals of canister ids, ordered lexicographically, and encoded as CBOR (see [CBOR](#cbor)) according to this CDDL (see [CDDL](#cddl)):
    ```
    canister_ranges = tagged<[*canister_range]>
    canister_range = [principal principal]
    principal = bytes .size (0..29)
    tagged<t> = #6.55799(t) ; the CBOR tag
    ```

-   `/subnet/<subnet_id>/metrics` (blob)

     A collection of subnet-wide metrics related to this subnet's current resource usage and/or performance. The metrics are a CBOR map with the following fields:

     - `num_canisters` (`nat`): The number of canisters on this subnet.
     - `canister_state_bytes` (`nat`): The total size of the state in bytes taken by canisters on this subnet since this subnet was created.
     - `consumed_cycles_total` (`map`): The total number of cycles consumed by all current and deleted canisters on this subnet. It's a map of two values, a low part of type `nat` and a high part of type `opt nat`.
     - `update_transactions_total` (`nat`): The total number of transactions processed on this subnet since this subnet was created.


:::note

Because this uses the lexicographic ordering of principals, and the byte distinguishing the various classes of ids is at the *end*, this range by construction conceptually includes principals of various classes. This specification needs to take care that the fact that principals that are not canisters may appear in these ranges does not cause confusion.

:::

-   `/subnet/<subnet_id>/node/<node_id>/public_key` (blob)

    The public key of a node (a DER-encoded Ed25519 signing key, see [RFC 8410](https://tools.ietf.org/html/rfc8410) for reference) with principal `<node_id>` belonging to the subnet with principal `<subnet_id>`.


### Canister ranges {#state-tree-canister-ranges}

The state tree also stores the canister ID ranges of subnets on the Internet Computer in a sharded form.

-   `/canister_ranges/<subnet_id>/<canister_id>` (blob)

    The set of canister IDs assigned to this subnet is represented as a **list of closed intervals of canister IDs, ordered lexicographically**.  
    This list is then split into **non-overlapping shards**, with each shard stored under a path of the above form and encoded as CBOR (see [CBOR](#cbor)).

    Specifically:
    1. Each shard contains a non-empty list of ranges.  
    2. The first range in the shard starts with the `<canister_id>` in its path.
    3. The next shard (if any) begins with a strictly greater starting canister ID.  
    4. All shards together cover the entire set of canister ID ranges for the subnet without overlap.  

    **Example:** Suppose a subnet has these canister ID ranges:  
    ```
    [1, 3], [5, 8], [10, 12], [20, 25]
    ```  
    They could be split into two shards:  
    - `/canister_ranges/<subnet_id>/1`  → `[1, 3], [5, 8]`  
    - `/canister_ranges/<subnet_id>/10` → `[10, 12], [20, 25]`  

    Each shard is represented as a CBOR-encoded list of ranges.  
    The encoding follows the same CDDL (see [CDDL](#cddl)) as for subnet-level canister ranges:

    ```
    canister_ranges = tagged<[*canister_range]> ; unlike before, this now represents a single shard
    canister_range = [principal principal]
    principal = bytes .size (0..29)
    tagged<t> = #6.55799(t) ; the CBOR tag
    ```

    **Difference from `/subnet/<subnet_id>/canister_ranges`:**  
    - `/subnet/<subnet_id>/canister_ranges` stores the complete set of ranges in one blob.  
    - `/canister_ranges/<subnet_id>/<canister_id>` stores the same ranges split into consecutive shards, each identified by its starting `<canister_id>` in the path. This facilitates e.g., binary searching.

### Request status {#state-tree-request-status}

For each update call request known to the Internet Computer, its status is in a subtree at `/request_status/<request_id>`. Please see [Overview of canister calling](./https-interface.md#http-call-overview) for more details on how update call requests work.

-   `/request_status/<request_id>/status` (text)

    One of `received`, `processing`, `replied`, `rejected` or `done`, see [Overview of canister calling](./https-interface.md#http-call-overview) for more details on what each status means.

-   `/request_status/<request_id>/reply` (blob)

    If the status is `replied`, then this path contains the reply blob, else it is not present.

-   `/request_status/<request_id>/reject_code` (natural)

    If the status is `rejected`, then this path contains the reject code (see [Reject codes](./https-interface.md#reject-codes)), else it is not present.

-   `/request_status/<request_id>/reject_message` (text)

    If the status is `rejected`, then this path contains a textual diagnostic message, else it is not present.

-   `/request_status/<request_id>/error_code` (text)

    If the status is `rejected`, then this path might be present and contain an implementation-specific error code (see [Error codes](./https-interface.md#error-codes)), else it is not present.

:::note

Immediately after submitting a request, the request may not show up yet as the Internet Computer is still working on accepting the request as pending.

:::

:::note

Request statuses will not actually be kept around indefinitely, and eventually the Internet Computer forgets about the request. This will happen no sooner than the request's expiry time, so that replay attacks are prevented.

:::

### Certified data {#state-tree-certified-data}

-   `/canister/<canister_id>/certified_data` (blob):

    The certified data of the canister with the given id, see [Certified data](./canister-interface.md#system-api-certified-data).

### Canister information {#state-tree-canister-information}

Users have the ability to learn about the hash of the canister's module, its current controllers, and metadata in a certified way.

-   `/canister/<canister_id>/module_hash` (blob):

    If the canister is empty, this path does not exist. If the canister is not empty, it exists and contains the SHA256 hash of the currently installed canister module. Cf. [IC method](./management-canister.md#ic-canister_status).

-   `/canister/<canister_id>/controllers` (blob):

    The current controllers of the canister. The value consists of a CBOR (see [CBOR](#cbor)) data item with major type 6 ("Semantic tag") and tag value `55799`, followed by an array of principals in their binary form (CDDL `#6.55799([* bytes .size (0..29)])`, see [CDDL](#cddl)).

-   `/canister/<canister_id>/metadata/<name>` (blob):

    If the canister has a [custom section](https://webassembly.github.io/spec/core/binary/modules.html#custom-section) called `icp:public <name>` or `icp:private <name>`, this path contains the content of the custom section. Otherwise, this path does not exist.

    It is recommended for the canister to have a custom section called "icp:public candid:service", which contains the UTF-8 encoding of [the Candid interface](https://github.com/dfinity/candid/blob/master/spec/Candid.md#core-grammar) for the canister.

<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->
