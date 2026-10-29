# Sema test corpus

::: note
Written by an agent (Claude), run by Ivan, 2026-10-21, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

A small, neutral corpus for Vouch's Sema library: a restaurant joining a food-delivery platform (`onboarding`), and the menu editor it leads to (`menu-builder`).
It is not client material.
Every page plants one or more of the traps in the implementation brief on purpose; `test/unit/sema.test.js` asserts what a correct implementation reports here.

The shared vocabulary — `patterns.md`, `words.md`, `roles.md` — lives at this root, so the checker must be run over this whole folder.
