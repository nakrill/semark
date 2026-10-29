---
id: m4stk9pq2hzr
kind: note
sema: data
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-29, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

# Mistakes

Each line under Planted makes one mistake a designer makes before reading the syntax, and the checker names each one with its fix.
`test/semark.test.js` asserts exactly this set; the other pages of the corpus are left as they were.

## Planted

[[planted: group]]

- [[Restaurant name: text]] a name with a space
- [[cuisine:text]] no space after the colon
- [[Website: Text]] a type in capitals, so no type at all
- [[tagline: text required-field]] a mark Sema does not have
- [[price-band: enum |low=Low| mid=Mid|]] a space inside the value list
- [[short-name: text "Short name" "Name"]] two labels
- [[logo: image asks:the product team]] a value with spaces and no quotes
- [[Restaurant.Name]] a path in the wrong case
- [[signatory.signed-at]] a path through a token that opened no scope
