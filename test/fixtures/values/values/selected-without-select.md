---
id: scr58e9kgy7x
kind: note
sema: screen
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-29, as a neutral test corpus for Sema's value-level checks in Vouch.
Nothing here has been checked by a person.
:::

# Selected without select

[[selected-without-select: screen]]

- [[order-detail: section of:orders.selected when:orders.selected!=empty "Order"]] right: orders has select:one
- [[past-detail: section of:past-orders.selected "Past order"]] wrong: past-orders has no select:
