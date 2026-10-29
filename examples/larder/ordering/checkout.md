---
id: z46s7c082a3r
sema: flow
status: ready
owner: tomas@larder.example
description: From a basket to a placed order
area: Design
---

# Checkout

[[checkout: flow]]

Three screens; the order is placed on the second.

- [[basket-screen -> checkout-screen when:basket!=empty]] the customer goes to checkout with something in the basket
- [[checkout-screen -> order-screen]] it places the order and follows it
- [[checkout-screen -> basket-screen]] it goes back to change the basket
