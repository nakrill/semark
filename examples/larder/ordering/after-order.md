---
id: va3qd07zm4sb
sema: flow
status: in-review
description: What a customer can do once the order is there
area: Design
---

::: note
Written by an agent (Claude), run by Ivan Aleksieiev, 29 October 2026, to widen the ordering flow for a coverage test of Sema in Vouch.
Nothing here has been checked by a person.
:::

# After the order

[[after-order: flow]]

Once the order is delivered or collected, the customer can tell us what went wrong.

- [[order-screen -> problem-dialog when:order.order-status=delivered,order.order-status=collected]] something went wrong
- [[problem-dialog -> order-screen]] the problem is sent, or dropped
