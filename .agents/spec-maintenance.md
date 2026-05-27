# Spec maintenance

The following files are maintained directly in this repository. Update them manually when the IC team announces a new version of the relevant specification.

## Directly maintained files

| Local file | What it is | When to update |
|-----------|-----------|---------------|
| `public/references/ic.did` | Candid interface of the IC management canister | New management canister methods or changed types; update `docs/references/management-canister.md` and affected guides alongside |
| `public/references/_attachments/certificates.cddl` | Certificate CDDL schema | IC certification spec changes |
| `public/references/_attachments/requests.cddl` | Request CDDL schema | IC HTTPS interface spec changes |
| `public/references/_attachments/http-gateway.did` | HTTP Gateway Candid interface | HTTP Gateway spec changes |
| `docs/references/ic-interface-spec/` | IC Interface Spec (7 focused pages) | IC spec version bumps — apply changes to the matching file (see mapping below) |
| `docs/references/http-gateway-protocol-spec.md` | HTTP Gateway Protocol Spec | HTTP Gateway spec version bumps |

## IC Interface Spec — section-to-file mapping

| File | IC spec section |
|---|---|
| `index.md` | Introduction, Pervasive concepts, The system state tree |
| `https-interface.md` | HTTPS Interface |
| `canister-interface.md` | Canister module format, Canister interface (System API) |
| `management-canister.md` | The IC management canister, The IC Bitcoin API, The IC Provisional API |
| `certification.md` | Certification, The HTTP Gateway protocol |
| `abstract-behavior.md` | Abstract behavior |
| `changelog.md` | IC spec changelog |

