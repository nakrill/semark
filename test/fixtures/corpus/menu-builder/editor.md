---
id: cap75g9ase1a
kind: note
sema: screen
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-21, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

# Editor

[[editor: screen]]

## Dishes

[[dish-table: section "Your dishes"]]

- [[dishes > table]]
  - [[dish-name]]
  - [[price]]
- [[cheapest: number derived from:dishes.first.price "Cheapest dish"]]
- [[add-dish: action > action.primary "Add a dish"]]

## States

- [[no-dishes: state given:dishes=empty]]
- [[some-dishes: state given:dishes.count>2]]
