# Sema value checks: test corpus

::: note
Written by an agent (Claude), run by Ivan, 2026-10-29, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

A second, small corpus for the value-level rules of Sema v0.8, kept apart from `test/fixtures/sema` so that corpus's hand-counted numbers stay put.
The design `values` has one page per rule; each page makes the rule's mistake once and writes its correct form once.
`test/semark.test.js` asserts that the checker reports each mistake exactly once, under the rule's code.
