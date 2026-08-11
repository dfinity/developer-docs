---
name: icp-brand-voice
description: "ICP / DFINITY positioning, voice, and vocabulary v2 for surfaces under the DFINITY or Internet Computer (ICP) mark. Pairs with icp-brand-design. Use when writing or reviewing copy, UI strings, headlines, hero lines, buttons, errors, release notes, blog posts, marketing pages, developer docs, social posts, decks. Enforces the calm, factual, plain voice (no hyperbole, no em-dashes, no emoji), the locked positioning ('Sovereign cloud. Software that is alive.'), the five public pillars (On-demand, Tamperproof, Always-on, Fluid, Yours), and the strict ban on bare 'onchain' or 'on-chain' as nouns, attributes, or selling points. Triggers, ICP voice, DFINITY voice, brand voice, is this on brand, vocabulary check, tagline review, headline review, ICP positioning, write a headline. OISY, Caffeine, and other ecosystem products with their own verbal systems are out of scope."
metadata:
  brand_guide_version_at_authoring: 'v2.25'
  brand_guide_rules_url: 'https://jgwns-tqaaa-aaaao-ba5ua-cai.icp0.io/rules.json'
---

# ICP / DFINITY Brand Voice & Positioning v2.6

## Rules of record check (FIRST STEP, EVERY TASK)

Before applying any rule in this skill, fetch the live brand rules and check the version.

```
GET https://jgwns-tqaaa-aaaao-ba5ua-cai.icp0.io/rules.json
```

This file is the machine-readable source of truth for the DFINITY / Internet Computer brand. Compare the `version` field in the JSON against the version this skill was authored against:

- **This skill was authored against brand guide `v2.25`.**

If the live `version` is the same, proceed normally using the rules in this skill.

If the live `version` is newer (e.g., `v2.26` or higher), surface a one-line warning to the user before continuing:

> Note: brand guide is now `vX.Y`, this skill was written against `v2.25`. Using the live rules from `/rules.json` as the source of truth where they differ.

Then proceed using the live JSON as the source of truth for: positioning, banned characters, banned words, one-word spellings, font stack, accent color, italic rule, surfaces order, default theme, hyperbole ban, and emoji ban. Anything not covered in the JSON falls back to this skill.

If the fetch fails (offline, canister down), proceed using this skill's rules and mention to the user that the live rules could not be reached.

The human-readable brand guide lives at https://jgwns-tqaaa-aaaao-ba5ua-cai.icp0.io/.

---

**Current version:** v2.6 (2026-06-30). See the Changelog section at the bottom for history. Every change to this skill bumps the minor version and adds a line to the changelog. This release tracks brand guide v2.25, which adds a homepage hero variant for internetcomputer.org and locks AIware as a brand term. The canonical strap ("Sovereign cloud. Software that's *alive.*") is unchanged for every off-homepage surface. A controlled italic-rust carve-out applies to the homepage hero only.

## When to Use This Skill

Load this skill when the user writes, edits, or reviews **any copy** under the DFINITY or Internet Computer mark. That includes:

- **Product copy**: UI strings, headlines, hero lines, button labels, error messages, empty states, toasts, email templates
- **Website**: internetcomputer.org and its subpages
- **Developer documentation**: docs pages, API references, tutorials, SDK sites
- **Marketing material**: landing pages, campaign pages, investor pages, press pages, decks
- **Editorial**: blog posts, long-form articles, release notes
- **Social media**: X/Twitter, LinkedIn, Reddit posts for DFINITY or ICP accounts

Also load when the user says "does this read on brand", "tagline review", "headline check", "vocabulary review", "how should we describe ICP", "make this sound like ICP".

For **how it should look** (colors, type, components), load `icp-brand-design`. The two skills are designed to be used together.

Do NOT use this skill for:

- **OISY wallet.** Own voice and brand identity. Out of scope.
- **Caffeine.** Own voice and brand identity. Out of scope.
- **Any other ecosystem product with its own established verbal system.**

## What ICP is (positioning, locked)

This section is the source of truth for how to describe ICP. If any copy you are reviewing disagrees with this section about what ICP *is*, the copy is wrong.

**Top line, locked (canonical, master):** *Sovereign cloud. Software that's alive.* (italic-rust on *alive*, with the period inside the italic span)

This is the master strap. Two sentences separated by a period. The italic-rust word is `alive`, which carries the claim that software on ICP is fluid: generated through AI chat on demand and extending itself with new natural-language functionality over time. The canonical strap ships on every off-homepage surface: decks, social banners, video conference backgrounds, email signatures, deck covers, investor pages, press pages, this guide. Do not reframe to "onchain", "World Computer", "trustless", "frontier cloud / for AI that builds" (the previous v2.17 strap, retired at v2.19), or any other variant on off-homepage surfaces.

### Homepage hero variant (internetcomputer.org only)

The internetcomputer.org homepage runs a product-led variant of the H1 that names the artifact ICP runs, rather than the metaphor that describes it. The canonical strap and the homepage variant coexist on purpose: *alive.* describes what the network is, AIware names what runs on it.

- **Eyebrow.** § Internet Computer Protocol (ICP) · The internet overlay for AIware
- **Hero H1, line one (static).** Sovereign cloud.
- **Hero H1, line two (rotation).** Alternates between *Runs AIware.* and *Tamperproof, always-on.* Both phrases are italic-rust in full.
- **Sub-strap.** Create custom AIware apps and SaaS on-demand, which have *fluid functionality*. Italic-rust on *fluid functionality* only.

**Italic-rust on the full line-two phrase** (and on the two-word phrase *fluid functionality* in the sub-strap) is a controlled exception to the one-italic-word rule. It is scoped strictly to the homepage hero. Off-homepage surfaces continue to ship the canonical strap with italic-rust on *alive.* only, and the one-italic-word rule still applies there.

**Where this variant is allowed.** internetcomputer.org homepage and product pages on the same domain that talk about what ICP runs. Nowhere else.

### AIware (locked product noun)

- **Spelling, locked.** Always `AIware` as one word: capital A, capital I, lowercase ware. Never `AIWare`, `aiware`, `AI-ware`, `AIWARE`, or `AI ware`. Treat as a proper noun.
- **What it means.** A new category of software that AI agents generate, extend, and operate on demand. AIware apps are generated through AI chat, expose their data and logic to the agent so it can add new functionality on the fly, and run end-to-end on the Internet Computer so they stay tamperproof, always-on, and under the user's control.
- **Part of speech.** Noun and adjective. *Runs AIware* (noun). *AIware apps* (adjective). *Sophisticated AIware* (noun). The same word does both jobs without modification.
- **Do not substitute.** Do not replace AIware with *AI agents*, *agentic apps*, *AI-native apps*, or *agent-built apps* on surfaces that reference the internetcomputer.org product noun. Those phrases describe the actors or the building style; AIware is the artifact.
- **Relationship to the canonical strap.** *alive.* describes what the network is. AIware names what runs on it. Both are correct, and both can appear on the same page when it serves the audience. The canonical strap stays the master line on off-homepage surfaces.

**Five public pillars, locked order:** *On-demand · Tamperproof · Always-on · Fluid · Yours* (italic on *Yours*)

The pillar row is the second piece of the positioning system. It appears on the homepage strap, on social banners, on video call backgrounds, in the email signature, and on deck covers. The five pillars are locked, in this order, with italic on *Yours*. On narrow social crops where five pillars do not fit, drop the first two and ship the compressed row *Always-on · Fluid · Yours*. Never drop *Yours*.

**Long form**

ICP is a **sovereign cloud where the software itself is alive**. Apps are generated on demand through AI chat at the speed of conversation, and they keep extending themselves over time with new natural-language functionality. The network underneath runs them tamperproof, always-on, and under the user's control, on hardware the user picks. It runs the whole app on the network itself: the frontend, the data, and the backend logic.

- **On-demand.** Apps, SaaS, and websites are generated through AI chat at the speed of conversation. No team to provision, no infrastructure to set up first. Caffeine and the ICP skill library make this work across Claude, Codex, Copilot, Cursor, and Perplexity.
- **Tamperproof.** Security is a property of the network, not a team. Tamperproof execution, replication, and code integrity are enforced by math across the nodes. No security team, no sysadmin, no compliance officer needed for what the network already enforces. In a world where attackers are AI agents too, this is the only model that scales.
- **Always-on.** A cloud engine is a set of nodes running the ICP protocol. Engines run on bare metal, on AWS, Google Cloud, Azure, on local cloud providers, or across a mix of them. Nodes are distributed across independent locations, so an app keeps serving users even if a whole data centre goes down. No patch windows, no maintenance pages.
- **Fluid.** Software on ICP is not a static binary. AI can see the data inside the running app and extend its functionality on the fly through natural-language interfaces. Same app, new capability, no redeploy. This is what makes the software *alive*.
- **Yours.** An app deployed to ICP is not locked to a cloud vendor. Pick the hardware, the operators, and the jurisdiction. Move between providers, or off them entirely, without downtime. Users can pick cloud engines by jurisdiction, by operator, or by policy.

**Out of scope.** Products with their own brand identity, such as OISY and Caffeine, are not covered by this skill. They have their own voice.

## Voice

DFINITY copy is calm, factual, and confident. It reads like The Economist, not a startup pitch deck. The voice grew out of the "Escaping Web3 Jargon" initiative. The goal is to sound like a frontier cloud where agents build apps, services, and systems, not a crypto project.

### Four voice attributes (internal writing guardrails)

These describe **how copy should sound**. They are not the public pillars (above). They are not shown to readers as a list.

1. **Factual.** Every sentence states something concrete. If you can remove a sentence without losing information, remove it.
2. **Plain.** Read every sentence aloud. If you would not say it to a smart non-specialist friend, rewrite it.
3. **Calm.** No hype, no urgency theatre, no exclamation marks, no emoji. The product is self-evidently interesting.
4. **Sovereign by math.** When security, uptime, or tamperproof execution come up, the subject of the sentence is the network, not DFINITY and not the cloud underneath. Prefer "the network enforces", "replicated across the nodes", "cannot be changed without governance" over "we secure", "our team monitors", or anything that implies the guarantee comes from which cloud the nodes run on.

### Hyperbole vs. factual metaphor

The ban on hyperbole stands. No "revolutionary", "world-first", "unprecedented", "game-changing", "mind-blowing", "next-generation", "cutting-edge", "paradigm shift". State the property factually instead.

Factual metaphors that describe a real product property are allowed in hero lines and lede paragraphs. Two are currently sanctioned:

- ***alive*** for fluid, AI-generated, self-extending software. This is the metaphor in the locked top line. It describes the actual behaviour of apps on ICP, not their rank or novelty.
- ***immune*** for the tamperproof property. As in "immune to infrastructure hacks". This describes a real protocol guarantee, not a marketing claim.

The distinction is rank/novelty (banned) versus property-description (allowed). If a metaphor describes a real, demonstrable behaviour of the product, it is on-brand. If it describes how impressive or how new the product is, it is not.

### Style rules

- **Sentence case** for headlines, body, page titles, nav. Title Case only for proper nouns.
- **UPPERCASE** is reserved for two specific patterns: short eyebrows above sections (Inter typography in the design system) and small button labels. Sentence case everywhere else.
- Oxford comma. Straight apostrophes and quotes. US spelling.
- **No em-dash** (the U+2014 character). Replace with a colon, period, or parentheses. This is a strict ban: zero em-dashes in shipped copy.
- No emoji in product UI, marketing copy, or social posts from official accounts.
- No exclamation marks.
- Numbers: write out one through nine, use digits for 10+. Always digits for metrics.
- Active voice. Short sentences. Specific claims.

### Italic

Italic is reserved. In headings, hero straps, and pillar rows, one italic word per line. The italic word lands on one of three targets:

- **(a) Subject noun** (default). The noun or noun phrase the line is about. Example: *What ICP is*.
- **(b) Metaphor carrying the claim.** The factual metaphor that describes the product property. Example: *Sovereign cloud. Software that's alive.* (italic on *alive*).
- **(c) Possessive pronoun asserting sovereignty.** Used in pillar rows. Example: *On-demand · Tamperproof · Always-on · Fluid · Yours* (italic on *Yours*).

Never italicise a verb, copula, article, or connector. Never italicise more than one word per line. Use the removal test: can the line still stand if the italic word is removed. If yes, the emphasis is on the wrong word.

**Homepage hero carve-out (v2.25).** The internetcomputer.org homepage H1 line two (*Runs AIware.* / *Tamperproof, always-on.*) and the sub-strap fragment *fluid functionality* are italic-rust in full as a controlled exception. This exception is scoped strictly to the homepage hero and sub-strap. Every other surface (off-homepage product pages, decks, banners, signatures, video conference backgrounds, this guide) ships one italic word per line.

Italic also carries:

- Asides ("e.g. ...")
- Captions, attributions, figure labels
- Book and publication titles

Never italic for stress in body copy. Never italic for entire blocks.

### Button labels (examples)

- Good: "Get started", "Create account", "Deploy canister", "View proposal", "Start at opencloud.org", "Read the source"
- Bad: "Let's go!", "Unlock the future", "Dive in", "Learn more 🚀"

## Vocabulary

### Banned on top-of-funnel and in product UI

Top-of-funnel means the front page, hero, landing pages, investor-facing material, press, and any surface where an ICP newcomer might first meet us. On deep technical pages these terms can be used when accuracy requires them, but always with plain-language explanation.

- Web3, blockchain, crypto, token (as primary descriptors)
- DeFi, smart contract, dapp
- "decentralized" as the main selling point
- "blockchain platform"
- **"onchain" or "on-chain" as a noun, attribute, or selling point.** Always replace with the underlying app attribute (tamperproof, unstoppable, sovereign, end-to-end on the network, replicated across nodes). See the onchain replacement table below. This rule is non-negotiable.
- "tamper-proof" as two words or hyphenated. Always one word: **tamperproof**.
- "platform for building AI agents" (wrong frame: we are the platform agents build on, not the platform to build agents)
- "autonomous, always-on agents" (overclaims; implies the network runs the agent)
- "workload" (use throughput metrics instead)
- `dfx` or "Install dfx" anywhere in docs, tutorials, or UI. The CLI is `icp`.
- Unexplained jargon: subnet, cycles (define on first use if you must ship them)
- Hype words: revolutionizing, next-generation, paradigm shift, bleeding-edge, game-changing, unlock, seamless, disrupt
- Community slang: hodl, moon, fam, WAGMI, GM, ser, anon

### Preferred framing

- **What ICP is:** a sovereign cloud. A sovereign cloud where software is alive. A network. A tamperproof, always-on platform.
- **What ICP does:** runs end-to-end on the network. Hosts apps that are tamperproof, always-on, and fluid. Generates apps on demand through AI chat. Provides tamperproof, always-on infrastructure.
- **Who it's for:** agents that build secure, tamperproof apps. Non-technical entrepreneurs deploying enterprise-grade apps. Developers who want sovereignty and vendor independence.
- **CLI:** the `icp` CLI. "Install the icp CLI." Never `dfx`.
- **Backends:** canisters, or "agent-built app backends." Never "smart contracts" in a developer pitch, never "workloads."
- **Metrics:** query throughput, update throughput, inference capacity, fault tolerance.
- **Attribution:** "Built on the Internet Computer" only when useful to the audience.

### Do / don't pairs (high-signal substitutions)

| Don't say                                    | Say instead                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Install dfx                                  | Install the icp CLI                                                                                         |
| dfx deploy                                   | icp deploy                                                                                                  |
| Platform for building AI agents              | Frontier cloud where AI agents build apps, services, and systems that stay tamperproof and keep their data across upgrades |
| Autonomous, always-on agents                 | Apps that are secure, tamperproof, and unstoppable                                                          |
| Blockchain platform                          | Sovereign cloud / tamperproof, always-on infrastructure                                                    |
| Decentralized (as the pitch)                 | Tamperproof, unstoppable, sovereign                                                                         |
| Smart contracts (to developers)              | Canisters, or agent-built app backends                                                                      |
| Workload                                     | Query throughput / update throughput / fault tolerance                                                      |
| Revolutionizing / next-generation            | Name the specific capability                                                                                |
| Enterprise-grade / bank-grade security       | Tamperproof by the network, integrity enforced across the nodes                                             |
| We keep your data safe                       | The network keeps data replicated across the nodes                                                          |
| Trust us                                     | Verify it                                                                                                   |
| Secure hosting                               | Sovereign cloud                                                                                             |
| No downtime                                  | Stays online if any node or cloud underneath fails                                                          |
| Hosted on AWS (as a positive)                | Portable across AWS, Google Cloud, Azure, local clouds, and bare metal                                      |
| Cyber security team (as a requirement)       | No security team required for what the network already enforces                                             |
| Build onchain apps                           | Build tamperproof, always-on apps on a sovereign cloud                                                     |
| Onchain governance                           | Tamperproof governance / governance enforced by the network                                                 |
| Onchain data                                 | Tamperproof data / data replicated across the nodes                                                         |
| Onchain identity                             | Sovereign identity / network-verified identity                                                              |
| Fully on-chain                               | End-to-end on the network / served and computed by the network                                              |
| Runs on-chain                                | Runs end-to-end on the network                                                                              |
| Onchain AI                                   | AI that ships tamperproof on a frontier cloud                                                               |
| Tamper-proof / tamper proof                  | Tamperproof (one word, always)                                                                              |

### Replacing "onchain" and "on-chain" (context-aware)

The word "onchain" hides what we actually mean. It is a category label, not a benefit. Always replace it with the specific attribute of the app or system being described. Pick the substitution that matches the claim being made:

| Underlying claim             | Use this language                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| Integrity / can't be altered | tamperproof, tamperproof by the network, integrity enforced across the nodes           |
| Availability                 | unstoppable, stays online if any node or cloud underneath fails, always available       |
| Where it runs                | end-to-end on the network, on a sovereign cloud, served and computed by the network     |
| Independence                 | sovereign, sovereign by design, no single operator can change or pull the app           |
| Verifiability                | verifiable, every change replicated and verified by the network                         |
| Data persistence             | data replicated across the nodes, no data loss across upgrades                          |
| Governance                   | governance enforced by the network, tamperproof governance                              |

**Examples:**

- "Build onchain apps" becomes "Build tamperproof, always-on apps on a sovereign cloud" (the user benefit is integrity and availability, not the venue).
- "Fully on-chain frontend" becomes "Frontend served end-to-end by the network" (the claim is about where it runs).
- "On-chain governance" becomes "Tamperproof governance" or "Governance enforced by the network" (the claim is about who can change the rules).
- "Your assets stay on-chain" becomes "Your assets stay tamperproof and replicated across the nodes" (the claim is about integrity and durability).
- "24/7 on-chain" as a stat label becomes "Always available" or "Tamperproof" (pick whichever attribute the surrounding stat is paired with).

**When the technical fact matters**: deep developer docs may need to say "runs on the Internet Computer" or "hosted by canisters on the network." Still avoid the bare word "onchain" as a noun or selling point.

### Do / don't pairs (long form)

When rewriting legacy crypto-era copy, use these five rewrites as a reference. The "don't" column is the old voice we are leaving behind; the "do" column is where we are going.

1. **Don't:** "Get ready to revolutionize the next-gen decentralized future of Web3." **Do:** "Run your app end-to-end on a network instead of a single cloud. The app stays tamperproof and online whether the nodes run on AWS, Google Cloud, Azure, a local cloud, or bare metal."
2. **Don't:** "Deploy your dapp to our bleeding-edge blockchain and start building the future." **Do:** "Build and deploy your app by asking Caffeine, the ICP-native AI builder, or any other agent (Claude, Perplexity, Codex) using the ICP skill."
3. **Don't:** "Enterprise-grade security you can trust. Our team works 24/7 to keep your apps safe." **Do:** "You do not need a security team for apps that run on the network. The code is tamperproof by the network, not by a dashboard."
4. **Don't:** "Stay ahead of evolving cyber threats with our advanced protection." **Do:** "AI is now on both sides of every attack. Apps running on the Internet Computer remove most of what attackers target: no server to break into, no OS to patch, no secrets file to leak. Every change to the running code is replicated and verified by the network, so nothing can be altered silently."
5. **Don't:** "The platform for autonomous, always-on AI agents." **Do:** "The frontier cloud for agents building apps, services, and systems. What they ship stays tamperproof, keeps its data across upgrades, and stays online without anyone tending it."

## Proper nouns

- **Internet Computer** (two words, both capitalised). **ICP** in short form.
- **DFINITY** in all caps.
- **NNS** (Network Nervous System). Expand on first use.
- **Motoko**, **Rust**, **Candid**. Capitalised.
- **Chain-key**, not "chainkey".
- **Tamperproof** is one word, never hyphenated, never two words.
- **AIware** as one word: capital A, capital I, lowercase ware. Proper noun. Never `AIWare`, `aiware`, `AI-ware`, `AIWARE`, or `AI ware`.
- `icp` CLI in lowercase code font. Never `dfx`.

## Copy review checklist

Before merging any ICP / DFINITY copy change, confirm:

**Copy QA before shipping (the lessons learned the hard way).** Every correction the user has had to flag on copy traces back to skipping one of the steps below. Treat each as mandatory, not aspirational:

- [ ] **Render the surface, then re-read every word at final size.** Hero straps, deck titles, signature lines, and banner straps read differently at 168px than they do in a code editor. Open the rendered output and re-read.
- [ ] **Locked strap audit.** Confirm "Sovereign cloud. Software that's *alive.*". The period sits inside the italic span (`<em>alive.</em>`, not `<em>alive</em>.`) so it inherits the rust accent on every surface that styles `em` in rust. Same rule applies to any closing punctuation on any styled fragment.
- [ ] **Pillar row order and italics.** On-demand · Tamperproof · Always-on · Fluid · *Yours*. Exact order, italic on *Yours* only, never drop *Yours*, never reorder.
- [ ] **One italic word per heading or strap.** Count the italics. More than one means the rule was broken; fewer than one (on a heading that needs emphasis) means the heading is flat.
- [ ] **Sweep every surface that quotes the strap.** Brand guide HTML, `rules.json`, the deck master, the email signature, the VC backgrounds, the social banners, the LinkedIn and X bios. A copy fix that only lands in one place ships inconsistent surfaces.
- [ ] **Em-dash sweep (`grep -c $'\xe2\x80\x94'`) returns 0** on every HTML, JSON, markdown, and skill file before deploy.
- [ ] **"Tamperproof" sweep returns 0** for "tamper-proof" and "tamper proof" across all surfaces.
- [ ] **Bare "onchain" / "on-chain" sweep returns 0** as a noun, attribute, or selling point. Replace with the specific attribute.

If any of the above is skipped, expect the user to flag it and ask why it was not caught.

---

**Standard checklist:**

- [ ] Describes ICP in line with the positioning section above ("Sovereign cloud. Software that's alive.")
- [ ] Pillar row, where used, follows the locked order (On-demand · Tamperproof · Always-on · Fluid · *Yours*) with italic on *Yours*
- [ ] No em-dashes anywhere (the U+2014 character)
- [ ] No banned vocabulary on top-of-funnel surfaces
- [ ] No bare "onchain" or "on-chain". Replaced with the specific attribute (tamperproof, unstoppable, sovereign, end-to-end on the network)
- [ ] "Tamperproof" written as one word, never "tamper-proof" or "tamper proof"
- [ ] Sentence case on headlines, body, page titles. UPPERCASE only on Inter eyebrows and small CTA labels.
- [ ] No hype words (revolutionize, unlock, paradigm shift, etc.)
- [ ] No emoji, no exclamation marks
- [ ] Italic used only for asides, captions, attributions, or a single heading emphasis word. Never italic for stress in body copy.
- [ ] Subject of security sentences is the network, not DFINITY
- [ ] Proper nouns correct (DFINITY, Internet Computer, ICP, NNS, Motoko)
- [ ] CLI references use `icp`, never `dfx`

If any box is unchecked, the copy is not on brand.

## When in doubt

Defer to the **ICP Brand Guidelines v2** site (link in `Resources`) and the live `internetcomputer.org` as the joint reference. If they disagree, the brand guide wins because it has been edited for consistency. If this skill and the brand guide disagree, the brand guide wins and this skill should be updated.

## Versioning

This skill follows semantic versioning at the brand level.

- **Major** (v2, v3, ...): a new verbal system. Locked positioning, voice attributes, or vocabulary core changes. Existing copy may need rewriting.
- **Minor** (v2.1, v2.2, ...): a refinement to the current system. New rule, corrected example, sharpened do/don't pair, vocabulary clarification. Existing copy remains valid; the change clarifies or sharpens.
- **Every edit to this skill bumps the minor version.** When you save a new version, update the version line at the top of the file and add a row to the Changelog section. Mirror the bump in the brand guide HTML (hero eyebrow, hero meta-row, footer changelog) and in the paired `icp-brand-design` skill so the version is consistent across all three.

## Changelog

- **v2.6** (2026-06-30). Tracks brand guide v2.25. Adds the *Homepage hero variant* sub-section to positioning, documenting the internetcomputer.org homepage H1 (line one: "Sovereign cloud." static; line two: rotation between *Runs AIware.* and *Tamperproof, always-on.*, italic-rust in full), the sub-strap (*Create custom AIware apps and SaaS on-demand, which have fluid functionality*, italic-rust on *fluid functionality*), and the eyebrow ("§ Internet Computer Protocol (ICP) · The internet overlay for AIware"). Adds *AIware* as a locked product noun: one word, capital A, capital I, lowercase ware, proper noun, noun and adjective, not substitutable with *AI agents*, *agentic apps*, *AI-native apps*, or *agent-built apps*. The canonical strap ("Sovereign cloud. Software that's *alive.*") is unchanged and remains the master line on every off-homepage surface. Italic rule gains a homepage-only carve-out for the line-two phrase and *fluid functionality*; one italic word per line still applies everywhere else. AIware added to the proper nouns list.
- **v2.5** (2026-06-15). Tracks brand guide v2.22. Adds a *Copy QA before shipping* sub-section to the copy review checklist, codifying the lessons from the v2.21 → v2.22 cycle: render the surface and re-read every word at final size; audit the locked strap including trailing punctuation (the period after *alive* must sit inside the italic span so it inherits the rust accent); confirm pillar row order and italics; sweep every surface that quotes the strap when copy changes. The trigger case was the trailing period after *alive* shipping in body ink because the markup placed it outside the rust-colored italic span on every surface. Strap and italic-target examples updated everywhere to wrap the punctuation inside the styled span.
- **v2.4** (2026-06-15). Tracks brand guide v2.20. Version bumped to stay in lockstep with `icp-brand-design` v2.4, which re-anchors the video conference background composition: the editorial lockup carrying the locked strap and pillar row moves from the bottom of the frame to the top so speaker tiles in Zoom, Meet, and Teams cannot cover it. No changes to positioning, voice attributes, vocabulary, italic rule, or any other verbal rule.
- **v2.3** (2026-06-15). Positioning reset aligning the skill with brand guide v2.19 and the internetcomputer.org refresh. New locked top line: "Sovereign cloud. Software that's *alive*." (italic on *alive*). New locked pillar row: "On-demand · Tamperproof · Always-on · Fluid · *Yours*" (italic on *Yours*). Italic rule widens to three targets: subject noun, metaphor carrying the claim, possessive pronoun asserting sovereignty. Hyperbole ban gains a carve-out for factual metaphors (*alive*, *immune*) that describe real product properties, distinct from superlatives that describe rank or novelty. Vocabulary table updated: "frontier cloud" replaced with "sovereign cloud" in do/don't pairs, "unstoppable" replaced with "always-on" in security framings. Long-form positioning rewritten around the five public pillars. The four voice attributes (Factual, Plain, Calm, Sovereign by math) are unchanged and clarified as internal writing guardrails, distinct from the public pillars.
- **v2.2** (2026-05-08). No voice changes. Version bumped to stay in lockstep with `icp-brand-design` v2.2, which sharpened the hero grid paper rule (now mandatory on hero) and the accent scope rule (single words or short phrases only).
- **v2.1** (2026-05-08). Italic emphasis rule clarified: italic word lands on the subject of the heading (the noun the line is about), never a verb, copula, article, or connector. Removal test added. Versioning rule introduced.
- **v2.0** (2026-05-08). Initial v2 release. Locked top line "Sovereign frontier cloud. Scaling AI that builds." Four voice attributes (Factual, Plain, Calm, Sovereign by math). Strict ban on bare "onchain" and "on-chain" as nouns, attributes, or selling points, with a context-aware replacement table. "Tamperproof" locked as one word. CLI references switched from `dfx` to `icp`. Em-dash ban (U+2014).

## Resources

- **Canonical brand guide v2**: the deployed HTML reference page (URL shared in conversation)
- **Reference site**: [internetcomputer.org](https://internetcomputer.org)
- **Paired skill**: `icp-brand-design` for colors, typography, layout, components, and accessibility.
- **Out of scope**: products with their own brand identity (OISY wallet, Caffeine, and any future ecosystem product that ships under its own verbal system).

## Examples

**Example 1. Writing a hero headline**

User: "Write the hero headline for the ICP.app landing page."

Response: Produce a Newsreader, sentence-case headline with one italicised emphasis word landing on the subject noun, the metaphor, or a possessive pronoun. No hyperbole, no "revolutionize", no em-dash. Example: "The sovereign cloud your agents *actually* ship on." Pair with an Inter eyebrow above ("FOR AGENTS BUILDING APPS, SERVICES, SYSTEMS") and a JetBrains Mono metadata strip beneath if metrics belong on the page.

**Example 2. Reviewing release notes**

User: "Does this release note read on brand?"

Response: Walk the copy review checklist. Flag any em-dashes, hype words, "decentralized" or "smart contract" framing, and any bare "onchain". Rewrite security claims with the network as the subject. If the release notes are for a developer audience, allow "canister" without explanation but still avoid "onchain" as a category label.

**Example 3. Positioning a new page**

User: "How should we describe ICP on this new investor page?"

Response: Lead with the locked top line: "Sovereign cloud. Software that's *alive*." Then ship the locked pillar row underneath: "On-demand · Tamperproof · Always-on · Fluid · *Yours*". Expand using the five pillar paragraphs in the long form section. Do not lead with "blockchain", "decentralized", "World Computer", "frontier cloud" (retired at v2.19), or any reframe of the locked strap.
