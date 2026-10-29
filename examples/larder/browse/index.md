---
id: f2de22tpbhfg
sema: design
status: in-review
description: How a customer finds a restaurant and picks dishes from its menu
area: Design
---

::: note
Written by an agent (Claude), run by Ivan Aleksieiev, 29 October 2026, to widen the ordering flow for a coverage test of Sema in Vouch.
Nothing here has been checked by a person.
:::

# Browse

[[browse: design]]

A customer says where they are, sees the restaurants that will serve them, reads a menu and puts dishes in the basket.
Every dish a customer can order comes from a menu the restaurant published: the record is [[menu-builder/dish]] and the list is [[menu-builder/dishes]].

- [[find-food]] from a postcode to a basket with something in it
- [[ordering/checkout]] what happens after the basket, written in the ordering design
