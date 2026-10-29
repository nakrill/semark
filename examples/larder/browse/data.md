---
id: enrf8bphd8qy
sema: data
status: in-review
description: Where the customer is, what they see of a restaurant, and the dish they are choosing
area: Design
---

::: note
Written by an agent (Claude), run by Ivan Aleksieiev, 29 October 2026, to widen the ordering flow for a coverage test of Sema in Vouch.
Nothing here has been checked by a person.
:::

# Data

## Where the customer is

[[customer-place: context]]

- [[postcode: text required "Your postcode" placeholder:"e.g. 40-001"]] asked once and kept for the session

## Restaurant card

[[restaurant-card: group like:onboarding/restaurant]] what a customer sees of a restaurant: the record it gave at sign-up, plus what we work out

- [[open-now: bool derived "Open now"]] from the restaurant's [[onboarding/opening-hours]] and the time of day
- [[serves-here: bool derived "Delivers to you"]] the customer's postcode is inside the delivery radius #a1
- [[minimum-order: number derived unit:EUR ? asks:product default:optional "Minimum order"]] whether restaurants may set one is not decided
- [[rating: number to-be range:1..5 "Rating"]] ratings are not in the product yet

## Restaurants

[[restaurants-nearby: collection of:restaurant-card where:serves-here sort:name]]

## Menu

[[menu-dishes: collection of:menu-builder/dish where:available sort:menu-section]] the dishes come from the menu the restaurant published

## Basket

[[basket-count: number derived "In the basket"]] how many lines [[ordering/basket]] has

## Chosen dish

[[dish-choice: group]]

- [[portions: number required range:1..20 initial:1 "How many"]]
- [[special-request: longtext optional "Anything the kitchen should know" hint:"Allergies, no onions, extra spicy"]]
- [[line-price: number derived unit:EUR "Price"]] the dish's price times the portions
