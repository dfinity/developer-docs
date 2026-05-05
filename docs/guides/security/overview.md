---
title: "Security Overview"
description: "Introduction to the ICP security best practices for canister and web app developers."
sidebar:
  order: 1
---

This section provides security best practices for developing canisters and web apps served by canisters on ICP. These best practices are mostly inspired by issues found in security reviews.

The goal of these best practices is to enable developers to identify and address potential issues early during the development of new dapps, and not only in the end when (if at all) a security review is done. Ideally, this will make the development of secure dapps more efficient.

Some excellent canister best practices linked here are from [effective Rust canisters](https://mmapped.blog/posts/01-effective-rust-canisters.html) and [how to audit an ICP canister](https://www.joachim-breitner.de/blog/788-How_to_audit_an_Internet_Computer_canister). The relevant sections are linked in the individual best practices.

## Target audience

The target audience for these documents is any developer working on ICP canisters or web apps and anyone who reviews such code.

## Disclaimers and limitations

The collection of best practices may grow over time. While it is useful to improve the security of dapps on ICP, such a list will never be complete and will never cover all potential security concerns. For example, there will always be attack vectors very specific to a dapp's use cases that cannot be covered by general best practices. Thus, following the best practices can complement, but not replace, security reviews. Especially for security-critical dapps, it is recommended to perform security reviews or audits. Furthermore, please note that the best practices are currently not ordered according to risk or priority.

## Further reading

Below are resources covering security best practices for technologies commonly used in ICP dapps. These are equally important as the ICP-specific guidelines and should be studied carefully.

### General
* [How to audit an Internet Computer canister](https://www.joachim-breitner.de/blog/788-How_to_audit_an_Internet_Computer_canister) by Joachim Breitner
* [OWASP application security verification standard](https://owasp.org/www-project-application-security-verification-standard/)
* [OWASP top ten](https://owasp.org/www-project-top-ten/)

### Rust
* [Secure Rust guidelines](https://anssi-fr.github.io/rust-guide/01_introduction.html), in particular [unsafe code](https://anssi-fr.github.io/rust-guide/04_language.html#unsafe-code), [overflows](https://anssi-fr.github.io/rust-guide/04_language.html#integer-overflows) and [Cargo-audit](https://anssi-fr.github.io/rust-guide/03_libraries.html#cargo-audit)
  * For overflowing operations, consider using `saturated` or `checked` variants, such as `saturated_add`, `saturated_sub`, `checked_add`, `checked_sub`. See the [Rust docs](https://doc.rust-lang.org/std/primitive.u32.html#method.saturating_add) for `u32`.

### Crypto
* [OWASP cryptographic failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/) points out issues related to cryptography, or the lack thereof.
* [OWASP application security verification standard](https://owasp.org/www-project-application-security-verification-standard/) (see Section V6)
* **Use the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).** Storing key material in the browser storage (such as [sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) or [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)) is considered unsafe because these keys can be accessed by JavaScript code, e.g. in an XSS attack. To protect the private key from direct access, use Web Crypto's [generateKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey) with `extractable=false`.

### Web security {#web-security}
* Resources for setting security headers:
  * [securityheaders.com](https://securityheaders.com/)
  * [Permissions policy generator](https://www.permissionspolicy.com/)
  * [Content security policy evaluator](https://csp-evaluator.withgoogle.com/) and [strict CSP](https://csp.withgoogle.com/docs/strict-csp.html)
  * [OWASP secure headers project](https://owasp.org/www-project-secure-headers/)
* [SSL server test](https://www.ssllabs.com/ssltest/)
* Don't use features that could lead to an XSS vulnerability, such as [@html in Svelte](https://svelte.dev/docs#template-syntax-html).
* **Log out securely.** Clear all session data (especially [sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) and [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)), clear [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), etc. on logout. Make sure other browser tabs showing the same origin are logged out if the logout is triggered in one tab. This may not happen automatically when the ICP JavaScript agent is used, since the ICP JavaScript agent keeps the private key in memory once initialized.

### Testing
* In [effective Rust canisters](https://mmapped.blog/posts/01-effective-rust-canisters.html): [test upgrades](https://mmapped.blog/posts/01-effective-rust-canisters.html#test-upgrades), [make code target-independent](https://mmapped.blog/posts/01-effective-rust-canisters.html#target-independent)
* Consider [PocketIC](../testing/pocket-ic.md) for canister testing

<!-- Upstream: sync from dfinity/portal — building-apps/security/overview.mdx, building-apps/security/resources.mdx -->
