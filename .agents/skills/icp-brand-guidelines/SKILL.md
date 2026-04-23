---
name: icp-brand-guidelines
description: "ICP / DFINITY brand guidelines: visual and verbal standards for every surface under the DFINITY or Internet Computer (ICP) mark. Use when building, updating, or reviewing products (NNS, ICP.app, Internet Identity, dashboards, developer tools), the main website (internetcomputer.org), developer documentation, marketing material, blog posts, release notes, or internal tools. Enforces the Anthropic-inspired visual system from skills.internetcomputer.org (serif headings, parchment / cream off-white palette, terracotta accent, light mode default, dark mode opt-in) and the 'Escaping Web3 Jargon' voice (calm, factual, no hyperbole, no em-dashes, banned vocab list). Trigger phrases: ICP brand, DFINITY brand, brand compliance, is this on brand, design review ICP, product guideline, NNS redesign, ICP.app design, ICP style, does this fit our brand. Products with their own brand identity (OISY wallet, Caffeine, and any future ecosystem product with its own visual and verbal system) are explicitly out of scope."
license: MIT
metadata:
  version: '1.0'
  source: https://skills.internetcomputer.org
  author: Pierre Samaties
---

# ICP / DFINITY Brand Guidelines

## When to Use This Skill

Load this skill when the user works on any surface that carries the DFINITY or Internet Computer mark. That includes:

- **Products**: NNS, ICP.app, Internet Identity, the IC dashboard, developer portals, explorers, internal tools
- **The main website**: internetcomputer.org and its subpages
- **Developer documentation**: docs pages, API references, tutorials, SDK sites
- **Marketing material**: landing pages, campaign pages, investor pages, press pages, decks
- **Editorial**: blog posts, long-form articles, release notes
- **Reviews**: design reviews, brand checks, compliance audits, PR or mockup reviews
- **Copy**: headlines, hero lines, button labels, error messages, empty states, email templates

Also load when the user says phrases like "make this on brand", "does this fit ICP", "ICP style", "DFINITY look", "NNS redesign", "redo the website", "fix the docs", "Anthropic-style but for ICP".

Do NOT use this skill for:

- **OISY wallet.** OISY has its own product identity and is explicitly out of scope.
- **Caffeine.** Caffeine is an AI-powered app builder with its own brand identity and voice. Out of scope.
- **Any other ecosystem product with its own established brand system.** If a product already ships under its own visual and verbal identity, leave it alone. This skill governs products that sit directly under the DFINITY / Internet Computer mark.
- Third-party dapps that happen to run on ICP but are not DFINITY products.
- Pure protocol / canister code. Use the ICP development skills for that.

## North Star

Every DFINITY product should feel like it came from the same studio: quiet, editorial, confident. The reference implementation is [skills.internetcomputer.org](https://skills.internetcomputer.org). Canonical visual and verbal system lives at the deployed brand guide (see Resources).

Two non-negotiables:

1. **Light mode is the default.** Dark mode is opt-in per product via `data-theme="dark"` on the root. Never use `prefers-color-scheme` to auto-switch.
2. **No em-dashes.** Ever. Not in UI, not in marketing, not in docs. Use a colon, a period, or parentheses.

## What ICP is (positioning)

This section is the source of truth for how to describe ICP. If the voice section of this skill and the copy you are reviewing disagree about what ICP *is*, the copy is wrong.

**A frontier cloud where security is built into the network.**

- **One cloud, any hardware.** ICP is a cloud that runs your whole app on the network itself: the frontend, the data, and the backend logic. The apps are tamperproof and stay online by design. A cloud engine, which is just a set of nodes running the ICP protocol, can run on bare metal, on AWS, Google Cloud, Azure, on local cloud providers, or across a mix of them. The nodes are always distributed across independent locations, so an app keeps serving users even if a whole data centre goes down. The guarantees travel with the protocol, not the hardware.
- **Security is a property of the network, not a team.** Tamper-resistance, replication, and code integrity are enforced by math across the nodes. You do not need a security team to keep apps safe, a sysadmin to patch servers, or a compliance officer to prove the code has not been changed. The network does that work on every request. In a world where attackers are AI agents too, this is the only model that scales.
- **Sovereign by design.** An app deployed to ICP is not locked to a cloud vendor. It can move between providers, or off them entirely, without downtime. Users can pick cloud engines by jurisdiction, by operator, or by policy.
- **The frontier cloud for agents.** AI agents are starting to build and ship real apps, services, and systems. They need a place to build where what they produce is safe by construction. ICP is that place. The network makes every app, service, and system tamperproof, so an attacker, human or AI, cannot silently change the running code. And Motoko, the language designed for this era, is the first built for AI to write and operate software on tamperproof infrastructure without losing data when the code is upgraded. An agent that ships on ICP ships something that keeps running, keeps its data, and cannot be tampered with.

**Out of scope.** Products with their own brand identity, such as OISY and Caffeine, are not covered by this skill. They have their own visual and verbal systems.

## Instructions

### 1. Load the tokens

Use `assets/tokens.css` as the single source of truth for color, type, spacing, and radii. Ship it untouched, or mirror the same values into your framework config.

```html
<link rel="stylesheet" href="/tokens.css">
```

Never redefine the accent, background, or text colors with hex values in product code. Always reference the CSS custom properties (`var(--icp-bg)`, `var(--icp-fg)`, `var(--icp-accent)`, etc.).

### 2. Apply the visual system

**Colors (light, default)**

| Role          | Token              | Hex       | Notes                                      |
| ------------- | ------------------ | --------- | ------------------------------------------ |
| Page bg       | `--icp-bg`         | `#f8f5ef` | parchment, never pure white                |
| Elevated bg   | `--icp-bg-elev`    | `#fdfaf3` | cards, code headers, inputs                |
| Text          | `--icp-fg`         | `#1a1714` | ink, never pure black                      |
| Muted text    | `--icp-muted`      | `#6b6660` | captions, meta                             |
| Rule          | `--icp-rule`       | `#e5ddcf` | 1px hairlines, dividers                    |
| Accent        | `--icp-accent`     | `#cc5a2b` | terracotta, the one and only brand color   |
| Accent dim    | `--icp-accent-dim` | `#f2d7c7` | blush, callout backgrounds                 |
| Code bg       | `--icp-code-bg`    | `#efe8da` | sand                                       |

**Colors (dark, opt-in)**

| Role          | Hex       | Notes                                  |
| ------------- | --------- | -------------------------------------- |
| Page bg       | `#14110d` | deep bark, never pure black            |
| Elevated bg   | `#1b1812` | bark                                   |
| Text          | `#f0ebe0` | bone                                   |
| Muted         | `#a29a8d` | ash                                    |
| Rule          | `#2d2820` | soil                                   |
| Accent        | `#ff7a4d` | ember (warmer for dark surfaces)       |
| Accent dim    | `#3a2218` | hearth                                 |

**Rules**

- One accent color per page. Terracotta / ember only. No green, blue, or secondary brand colors.
- No gradients on brand surfaces. Flat color.
- No pure `#000` text and no pure `#fff` backgrounds.
- Hairlines are 1px in `--icp-rule`. No heavy borders.

**Typography**

- **Serif (headings):** Newsreader, 500 weight, letter-spacing `-0.01em` to `-0.015em` for h1/h2. Fallback stack: `"Newsreader", "Source Serif 4", "EB Garamond", ui-serif, Georgia, serif`.
- **Sans (body, UI, labels):** Inter. Fallback: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Mono (code):** system monospace stack.
- Body line-height `1.6`–`1.75`. Headings `1.15`–`1.25`.
- Headings in serif italic only for emphasis words inside an otherwise roman heading (see hero pattern on skills.internetcomputer.org).

**Layout and spacing**

- Container max width: `68rem` (~1088px).
- Prose max width: `48rem` (~768px). Never run body text wider.
- Horizontal gutter: `1.75rem` (28px).
- Generous vertical rhythm. Sections separated by 1px hairlines in `--icp-rule`, not boxes.

**Radii**

- Inline code: `3px`
- Buttons, pre blocks, meta cards: `6px`
- Search bars, callout right-hand side: `8px`
- No pills, no fully rounded shapes anywhere except circular avatars.

**Iconography and imagery**

- Line icons, 1.5px stroke, rounded joins. No filled or duotone icons in product chrome.
- Photography is rare. When used, warm-toned, documentary, no stock illustrations.
- No 3D renders, no isometric illustrations, no crypto iconography.

**Motion**

- Default transition: `0.15s ease` on `background`, `color`, and `border-color`.
- No bounce, no slide-ins on load. Respect `prefers-reduced-motion`.

### 3. Apply the voice

DFINITY copy is calm, factual, and confident. It reads like The Economist, not a startup pitch deck. The voice grew out of the "Escaping Web3 Jargon" initiative. The goal is to sound like a frontier cloud where agents build apps, services, and systems, not a crypto project.

**Four voice attributes**

1. **Factual.** Every sentence states something concrete. If you can remove a sentence without losing information, remove it.
2. **Plain.** Read every sentence aloud. If you would not say it to a smart non-specialist friend, rewrite it.
3. **Calm.** No hype, no urgency theatre, no exclamation marks, no emoji. The product is self-evidently interesting.
4. **Sovereign by math.** When security, uptime, or tamper-resistance come up, the subject of the sentence is the network, not DFINITY and not the cloud underneath. Prefer "the network enforces", "replicated across the nodes", "cannot be changed without governance" over "we secure", "our team monitors", or anything that implies the guarantee comes from which cloud the nodes run on.

**Banned on top-of-funnel and in product UI**

- Web3, blockchain, crypto, token (as primary descriptors)
- DeFi, smart contract, dapp
- "decentralized" as the main selling point
- "blockchain platform"
- "platform for building AI agents" (wrong frame: we are the platform agents build on, not the platform to build agents)
- "autonomous, always-on agents" (overclaims; implies the network runs the agent)
- "workload" (use throughput metrics instead)
- `dfx` or "Install dfx" anywhere in docs, tutorials, or UI. The CLI is `icp`.
- Unexplained jargon: subnet, cycles (define on first use if you must ship them)
- Hype words: revolutionizing, next-generation, paradigm shift, bleeding-edge, game-changing, unlock, seamless, disrupt
- Community slang: hodl, moon, fam, WAGMI, GM, ser, anon

**Preferred framing**

- **What ICP is:** a frontier cloud for agents building apps, services, and systems. A network. A tamperproof, unstoppable platform. Sovereign by design. The cloud where agent-built software is always on and resilient.
- **What ICP does:** runs end-to-end on the network. Hosts apps that are secure, tamperproof, and unstoppable. Provides tamperproof, unstoppable infrastructure.
- **Who it's for:** agents that build secure, tamperproof apps. Non-technical entrepreneurs deploying enterprise-grade apps. Developers who want sovereignty and vendor independence.
- **CLI:** the `icp` CLI. "Install the icp CLI." Never `dfx`.
- **Backends:** canisters, or "agent-built app backends." Never "smart contracts" in a developer pitch, never "workloads."
- **Metrics:** query throughput, update throughput, inference capacity, fault tolerance.
- **Attribution:** "Built on the Internet Computer" only when useful to the audience.

**Style rules**

- Sentence case for headlines, buttons, page titles, nav. Title Case only for proper nouns.
- Oxford comma. Straight apostrophes and quotes. US spelling.
- No em-dash (`—`). Replace with a colon, period, or parentheses.
- No emoji in product UI or marketing copy. Fine in internal Slack.
- Numbers: write out one through nine, use digits for 10+. Always digits for metrics.
- Active voice. Short sentences. Specific claims.

**Button labels (examples)**

- Good: "Get started", "Create account", "Deploy canister", "View proposal"
- Bad: "Let's go!", "Unlock the future", "Dive in", "Learn more 🚀"

**Do / don't pairs (high-signal substitutions)**

| Don't say                                    | Say instead                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Install dfx                                  | Install the icp CLI                                                                                         |
| dfx deploy                                   | icp deploy                                                                                                  |
| Platform for building AI agents              | Frontier cloud where AI agents build apps, services, and systems that stay tamperproof and keep their data across upgrades |
| Autonomous, always-on agents                 | Apps that are secure, tamperproof, and unstoppable                                                          |
| Blockchain platform                          | Frontier cloud / tamperproof, unstoppable infrastructure                                                   |
| Decentralized (as the pitch)                 | Tamperproof, unstoppable, sovereign                                                                         |
| Smart contracts (to developers)              | Canisters, or agent-built app backends                                                                      |
| Workload                                     | Query throughput / update throughput / fault tolerance                                                      |
| Revolutionizing / next-generation            | Name the specific capability                                                                                |
| Enterprise-grade / bank-grade security       | Tamperproof by the network, integrity enforced across the nodes                                             |
| We keep your data safe                       | The network keeps data replicated across the nodes                                                          |
| Trust us                                     | Verify it                                                                                                   |
| Secure hosting                               | Frontier cloud                                                                                             |
| No downtime                                  | Stays online if any node or cloud underneath fails                                                          |
| Hosted on AWS (as a positive)                | Portable across AWS, Google Cloud, Azure, local clouds, and bare metal                                      |
| Cyber security team (as a requirement)       | No security team required for what the network already enforces                                             |

**Do / don't pairs (long form)**

When rewriting legacy crypto-era copy, use these five rewrites as a reference. The "don't" column is the old voice we are leaving behind; the "do" column is where we are going.

1. **Don't:** "Get ready to revolutionize the next-gen decentralized future of Web3." **Do:** "Run your app end-to-end on a network instead of a single cloud. The app stays tamperproof and online whether the nodes run on AWS, Google Cloud, Azure, a local cloud, or bare metal."
2. **Don't:** "Deploy your dapp to our bleeding-edge blockchain and start building the future." **Do:** "Build and deploy your app by asking Caffeine, the ICP-native AI builder, or any other agent (Claude, Perplexity, Codex) using the ICP skill."
3. **Don't:** "Enterprise-grade security you can trust. Our team works 24/7 to keep your apps safe." **Do:** "You do not need a security team for apps that run on the network. Tamper-resistance is enforced by math, not a dashboard."
4. **Don't:** "Stay ahead of evolving cyber threats with our advanced protection." **Do:** "AI is now on both sides of every attack. Apps running on the Internet Computer remove most of what attackers target: no server to break into, no OS to patch, no secrets file to leak. And every change to the running code is replicated and verified by the network, so nothing can be altered silently."
5. **Don't:** "The platform for autonomous, always-on AI agents." **Do:** "The frontier cloud for agents building apps, services, and systems. What they ship stays tamperproof, keeps its data across upgrades, and stays online without anyone tending it."

### 4. Components (mirror the reference)

Use the component patterns from the brand guide directly. Never invent a new primary button, card, or callout without a review. Key patterns:

- **Primary CTA**: terracotta fill, white text, `6px` radius, sans-serif, no shadow.
- **Secondary CTA**: transparent with 1px rule border, fg text.
- **Eyebrow label**: uppercase, `0.06em` letter-spacing, muted color, small caps feel.
- **Callout**: blush (`--icp-accent-dim`) left stripe on cream card.
- **Meta card**: cream bg, 1px rule, serif title, sans body.
- **List row**: 1px bottom hairline, serif label, muted right-hand value.
- **Code block**: sand background, mono, no syntax colors beyond fg + muted.
- **Trust banner**: row of monochrome logos, no boxes.

### 5. Accessibility

- WCAG AA contrast minimum. The palette is designed to pass; verify on every surface.
- Real `<button>` and `<a>` elements. No div-buttons. Keyboard navigable.
- Focus rings must be visible: 2px `--icp-accent` outline with `2px` offset.
- Never convey meaning by color alone.

### 6. Review checklist

Before merging any ICP / DFINITY product change, confirm:

- [ ] Uses `tokens.css` variables, no hardcoded brand hex values
- [ ] Light mode is default. Dark mode only via explicit `data-theme="dark"`
- [ ] Newsreader for headings, Inter for body, system mono for code
- [ ] No em-dashes anywhere in copy
- [ ] No banned vocabulary in user-facing copy
- [ ] Sentence case on buttons and headlines
- [ ] One accent color on the page (terracotta / ember only)
- [ ] Body prose capped at `48rem`
- [ ] 1px hairlines in `--icp-rule`, no heavy borders
- [ ] Focus states visible, AA contrast verified
- [ ] No emoji, no exclamation marks, no stock illustration

If any box is unchecked, the work is not on brand.

### 7. When in doubt

Defer to [skills.internetcomputer.org](https://skills.internetcomputer.org) as the living reference. If the reference and this skill disagree, the reference wins and this skill should be updated.

## Resources

- **Canonical brand guide**: the HTML guideline page deployed from this system (shareable URL in the conversation)
- **Tokens file**: `assets/tokens.css` in this skill. Drop into any product as the single source of truth.
- **Reference site**: [skills.internetcomputer.org](https://skills.internetcomputer.org)
- **Out of scope**: products with their own brand identity (OISY wallet, Caffeine, and any future ecosystem product that ships under its own visual and verbal system). Do not apply this skill to those surfaces. If in doubt, check whether the product has its own brand guide; if it does, defer to that.

## Examples

**Example 1. Reviewing a PR**

User: "Here's a mockup for the new NNS proposal detail page. Does it fit our brand?"

Response: Walk the review checklist, flag hardcoded `#ffffff` background and em-dashes in the summary copy, recommend swapping to `var(--icp-bg)` and replacing em-dashes with colons, confirm serif h1 and terracotta CTA are correct.

**Example 2. Writing product copy**

User: "Write the hero headline for the ICP.app landing page."

Response: Produce a serif, sentence-case headline with one italicised emphasis word. No hyperbole, no "revolutionize", no em-dash. Example: "The frontier cloud your agents *actually* ship on."

**Example 3. New developer tool**

User: "I'm shipping a new IC explorer dashboard. Give me the starter styles."

Response: Hand over `tokens.css`, Inter + Newsreader font links, the primary / secondary CTA CSS, the meta card pattern, and a reminder that light mode is the default.
