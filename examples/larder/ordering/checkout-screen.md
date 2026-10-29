---
id: x55x10v453fb
sema: screen
status: in-review
owner: tomas@larder.example
description: Where the order goes, when, and how it is paid
area: Design
---

# Checkout

[[checkout-screen: screen present:page for:customer "Checkout"]]

## How

[[how-section: section "How"]]

- [[order.fulfilment > choice.single]]

## Address

[[order.delivery-address]]

- [[street > input.text]]
- [[postcode > input.text]]
- [[city > input.text]]
- [[door-note > input.text]]

## When

[[when-section: section "When"]]

- [[order.delivery-time > choice.single]]
- [[order.delivery-slot > choice.dropdown]]

## Payment

[[payment-section: section "Payment"]]

- [[order.payment > choice.single]]
- [[cash-note: help > notice.info "Have the exact amount ready if you can." when:order.payment=cash]]

## Totals

[[order-summary]]

## Actions

[[checkout-actions: region]]

- [[place-order: action > action.primary "Place order" -> order-screen]]
- [[to-basket: action > action.secondary "{words/back}" -> basket-screen]]

## States

- [[asap: state given:!submitted]]
- [[later-today: state given:order.delivery-time=later&!submitted]]
- [[paying-cash: state given:order.payment=cash&!submitted]]
- [[collecting: state given:order.fulfilment=pickup&!submitted]]
- [[missing-address: state given:!valid&submitted]]
