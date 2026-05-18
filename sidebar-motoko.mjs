/**
 * Motoko sidebar section.
 *
 * Extracted here so it can be maintained alongside the synced content without
 * cluttering the main sidebar.mjs. Update this file when pages are added,
 * removed, or reordered in the Motoko section.
 *
 * Sections:
 *   - fundamentals/: explicit items list — subdirectory order cannot be derived
 *     automatically after numeric prefixes are removed (alphabetical sort does
 *     not match display order). Update this list when fundamentals pages change.
 *   - icp-features/: autogenerate — order controlled by sidebar.order in each
 *     file's frontmatter (set upstream). New pages appear automatically.
 *   - reference/: autogenerate — order controlled by sidebar.order in each
 *     file's frontmatter (set upstream). New pages appear automatically.
 */

export const motokoSidebar = {
  label: "Motoko",
  collapsed: true,
  items: [
    { slug: "languages/motoko", label: "Overview" },
    {
      label: "Fundamentals",
      collapsed: false,
      items: [
        { slug: "languages/motoko/fundamentals/hello-world" },
        {
          label: "Basic syntax",
          collapsed: true,
          items: [
            { slug: "languages/motoko/fundamentals/basic-syntax/defining-an-actor" },
            { slug: "languages/motoko/fundamentals/basic-syntax/imports" },
            { slug: "languages/motoko/fundamentals/basic-syntax/printing-values" },
            { slug: "languages/motoko/fundamentals/basic-syntax/numbers" },
            { slug: "languages/motoko/fundamentals/basic-syntax/characters-text" },
            { slug: "languages/motoko/fundamentals/basic-syntax/literals" },
            { slug: "languages/motoko/fundamentals/basic-syntax/identifiers" },
            { slug: "languages/motoko/fundamentals/basic-syntax/functions" },
            { slug: "languages/motoko/fundamentals/basic-syntax/operators" },
            { slug: "languages/motoko/fundamentals/basic-syntax/comments" },
            { slug: "languages/motoko/fundamentals/basic-syntax/whitespace" },
            { slug: "languages/motoko/fundamentals/basic-syntax/traps" },
          ],
        },
        {
          label: "Actors",
          collapsed: true,
          items: [
            { slug: "languages/motoko/fundamentals/actors/actors-async" },
            { slug: "languages/motoko/fundamentals/actors/state" },
            { slug: "languages/motoko/fundamentals/actors/data-persistence" },
            { slug: "languages/motoko/fundamentals/actors/compatibility" },
            { slug: "languages/motoko/fundamentals/actors/messaging" },
            {
              label: "Orthogonal persistence",
              collapsed: true,
              items: [
                { slug: "languages/motoko/fundamentals/actors/orthogonal-persistence/overview" },
                { slug: "languages/motoko/fundamentals/actors/orthogonal-persistence/enhanced" },
                { slug: "languages/motoko/fundamentals/actors/orthogonal-persistence/classical" },
              ],
            },
            { slug: "languages/motoko/fundamentals/actors/mixins" },
            { slug: "languages/motoko/fundamentals/actors/enhanced-multi-migration" },
          ],
        },
        {
          label: "Types",
          collapsed: true,
          items: [
            { slug: "languages/motoko/fundamentals/types/primitive-types" },
            { slug: "languages/motoko/fundamentals/types/shared-types" },
            { slug: "languages/motoko/fundamentals/types/function-types" },
            { slug: "languages/motoko/fundamentals/types/tuples" },
            { slug: "languages/motoko/fundamentals/types/records" },
            { slug: "languages/motoko/fundamentals/types/objects-classes" },
            { slug: "languages/motoko/fundamentals/types/variants" },
            { slug: "languages/motoko/fundamentals/types/immutable-arrays" },
            { slug: "languages/motoko/fundamentals/types/mutable-arrays" },
            { slug: "languages/motoko/fundamentals/types/options" },
            { slug: "languages/motoko/fundamentals/types/results" },
            { slug: "languages/motoko/fundamentals/types/advanced-types" },
            { slug: "languages/motoko/fundamentals/types/stable-types" },
            { slug: "languages/motoko/fundamentals/types/subtyping" },
            { slug: "languages/motoko/fundamentals/types/type-conversions" },
          ],
        },
        {
          label: "Declarations",
          collapsed: true,
          items: [
            { slug: "languages/motoko/fundamentals/declarations/variable-declarations" },
            { slug: "languages/motoko/fundamentals/declarations/function-declarations" },
            { slug: "languages/motoko/fundamentals/declarations/object-declaration" },
            { slug: "languages/motoko/fundamentals/declarations/class-declarations" },
            { slug: "languages/motoko/fundamentals/declarations/type-declarations" },
            { slug: "languages/motoko/fundamentals/declarations/expression-declarations" },
            { slug: "languages/motoko/fundamentals/declarations/module-declarations" },
          ],
        },
        {
          label: "Control flow",
          collapsed: true,
          items: [
            { slug: "languages/motoko/fundamentals/control-flow/basic-control-flow" },
            { slug: "languages/motoko/fundamentals/control-flow/loops" },
            { slug: "languages/motoko/fundamentals/control-flow/conditionals" },
            { slug: "languages/motoko/fundamentals/control-flow/blocks" },
            { slug: "languages/motoko/fundamentals/control-flow/switch" },
          ],
        },
        { slug: "languages/motoko/fundamentals/modules-imports" },
        { slug: "languages/motoko/fundamentals/pattern-matching" },
        { slug: "languages/motoko/fundamentals/error-handling" },
        { slug: "languages/motoko/fundamentals/contextual-dot" },
        { slug: "languages/motoko/fundamentals/implicit-parameters" },
      ],
    },
    {
      label: "ICP features",
      collapsed: true,
      autogenerate: { directory: "languages/motoko/icp-features" },
    },
    {
      label: "Reference",
      collapsed: true,
      items: [
        { slug: "languages/motoko/reference/language-manual" },
        { slug: "languages/motoko/reference/error-codes" },
        { slug: "languages/motoko/reference/motoko-grammar" },
        { slug: "languages/motoko/reference/style-guide" },
        { slug: "languages/motoko/reference/compiler-ref" },
        { slug: "languages/motoko/reference/changelog" },
      ],
    },
  ],
};
