---
id: atg63t3xs5q2
sema: screen
status: in-review
description: One restaurant's menu, with the basket within reach
area: Design
---

::: note
Written by an agent (Claude), run by Ivan Aleksieiev, 29 October 2026, to widen the ordering flow for a coverage test of Sema in Vouch.
Nothing here has been checked by a person.
:::

# Menu

[[menu: screen present:page for:customer "{restaurant-card.name}"]]

Opened for one restaurant, from the list.

## Restaurant

[[restaurant-header: region]]

- [[restaurant-card.kitchen-type > status.badge]]
- [[restaurant-card.open-now]]
- [[closed-note: help > notice.warning "This restaurant is closed right now. You can read the menu and order when it opens." when:!restaurant-card.open-now]]
- [[minimum-note: help > notice.info "Minimum order {restaurant-card.minimum-order}" when:restaurant-card.minimum-order>0]]

## Dishes

[[dish-list: section]]

- [[by-section: nav > nav.jump]] jump to a section of the menu
- [[menu-dishes > list.cards]]
  - [[menu-builder/dish.dish-name]]
  - [[menu-builder/dish.description]]
  - [[menu-builder/dish.price]]
  - [[menu-builder/dish.allergens > choice.chips readonly]]
  - [[open-dish: action > action.secondary "Add" -> add-dish with:dish enabled:restaurant-card.open-now]]

## Basket

[[basket-bar: region]]

- [[go-to-basket: action > action.primary "Basket ({basket-count})" -> ordering/basket-screen enabled:ordering/basket!=empty]]

## States

- [[open: state given:restaurant-card.open-now]]
- [[closed: state given:!restaurant-card.open-now]]
- [[something-in-basket: state given:restaurant-card.open-now&ordering/basket!=empty]]
