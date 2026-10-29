---
id: wn516fb0n5wb
sema: data
status: in-review
owner: tomas@larder.example
description: Baskets, orders and where an order goes
area: Design
---

# Data

## Basket line

[[basket-line: group]]

- [[line-dish: text derived "Dish"]]
- [[quantity: number required range:1..20 initial:1 "Quantity"]]
- [[line-total: number derived unit:EUR "Total"]]

## Basket

[[basket: collection of:basket-line]]

## Order

[[order: group]]

- [[order-number: text derived "Order"]]
- [[fulfilment: enum |delivery=Delivery|pickup=Collect from the restaurant| required initial:delivery "How"]]
- [[order-status: enum of:order-statuses initial:placed derived "Status"]]
- [[subtotal: number derived unit:EUR "Subtotal"]]
- [[delivery-fee: number derived unit:EUR when:fulfilment=delivery "Delivery"]] nothing to pay when the customer collects
- [[total: number derived unit:EUR "Total"]]
- [[late: bool derived "Running late"]] more than 15 minutes past the time we promised
- [[delivery-address: group > group.address when:fulfilment=delivery]]
  - [[street: text required "Street and number"]]
  - [[postcode: text required "Postcode"]]
  - [[city: text required "City"]]
  - [[door-note: text required "For the courier" hint:"Floor, door code, where to leave it"]]
- [[delivery-time: enum |asap=As soon as possible|later=Later today| required initial:asap "When"]]
- [[delivery-slot: enum |1800=18:00|1830=18:30|1900=19:00|1930=19:30| required when:delivery-time=later "Time"]]
- [[payment: enum |card=Card|cash=Cash at the door| required initial:card "Payment"]]

## Problem

[[problem: group]]

- [[problem-kind: enum |never-arrived=It never arrived|missing-dish=A dish was missing or wrong|late=It arrived more than an hour late|other=Something else| required "What went wrong"]] #refunds
- [[which-dish: text optional when:problem-kind=missing-dish "Which dish"]]
- [[note: longtext optional "Tell us more"]]
- [[photo: image optional "A photo, if it helps"]]
- [[asked-at: date derived]]
- [[refund-amount: number derived unit:EUR "We refund"]] #refunds
  - [[refund-amount is:total when:problem-kind=never-arrived]] the whole order, including the delivery fee
  - [[refund-amount is:delivery-fee when:problem-kind=late&fulfilment=delivery]]
  - [[refund-amount ? asks:operations default:optional when:problem-kind=missing-dish]] that dish's price, once we know which line it was
  - [[refund-amount is:0]]
- [[refund-window: number derived unit:d "Days to ask"]] #refunds
  - [[refund-window is:30 when:@user.member to-be]] members, once membership exists
  - [[refund-window is:14]]
- [[can-ask: bool derived "Can still ask"]] delivered less than {refund-window} days ago #a2

## History

[[order-events: collection of:order-event sort:happened-at]]

## Event

[[order-event: group]]

- [[event-status: enum of:order-statuses derived "Status"]]
- [[happened-at: date derived "At"]]

## Statuses

[[order-statuses: states |placed=Placed|accepted=Accepted|preparing=Being prepared|ready=Ready to collect when:order.fulfilment=pickup|on-the-way=On the way when:order.fulfilment=delivery|collected=Collected when:order.fulfilment=pickup|delivered=Delivered when:order.fulfilment=delivery|cancelled=Cancelled|]]
