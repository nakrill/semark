---
id: k45xzz21mctg
sema: screen
status: ready
owner: tomas@larder.example
description: What the customer is about to order
area: Design
---

# Basket

[[basket-screen: screen present:page for:customer "Your basket"]]

## Lines

[[basket-lines: section]]

- [[basket > table]]
  - [[line-dish]]
  - [[quantity > input.number]]
  - [[line-total]]
  - [[remove-line: action > action.secondary "Remove"]] takes the dish out of the basket

## Totals

[[order-summary]]

## Actions

[[basket-actions: region]]

- [[to-checkout: action > action.primary "Go to checkout" -> checkout-screen enabled:basket!=empty]]

## States

- [[empty-basket: state given:basket=empty]]
  - [[nothing-yet: feedback > feedback.empty "Your basket is empty. Add dishes from the menu."]]
- [[filled-basket: state given:basket!=empty]]
