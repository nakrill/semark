---
id: sweszxr77xwr
sema: flow
status: in-review
description: From a postcode to a full basket
area: Design
---

::: note
Written by an agent (Claude), run by Ivan Aleksieiev, 29 October 2026, to widen the ordering flow for a coverage test of Sema in Vouch.
Nothing here has been checked by a person.
:::

# Find food

[[find-food: flow]]

A customer finds a restaurant and fills a basket; the basket itself belongs to the ordering design.

- [[restaurants -> menu with:restaurant-card]] the customer picks a restaurant
- [[menu -> add-dish with:dish]] and opens a dish
- [[add-dish -> menu]] adds it to the basket, or changes their mind
- [[menu -> ordering/basket-screen when:ordering/basket!=empty]] and goes to the basket once something is in it
