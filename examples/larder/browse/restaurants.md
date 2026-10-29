---
id: ph3zf2d45rc5
sema: screen
status: in-review
description: The restaurants that serve the customer's postcode
area: Design
---

::: note
Written by an agent (Claude), run by Ivan Aleksieiev, 29 October 2026, to widen the ordering flow for a coverage test of Sema in Vouch.
Nothing here has been checked by a person.
:::

# Restaurants

[[restaurants: screen present:page for:customer "Restaurants near you"]]

## Where

[[where-section: section]]

- [[customer-place.postcode > input.text]]
- [[find: action > action.primary "Find restaurants" enabled:valid]]

## Narrow down

[[filters: region]]

- [[restaurant-card.kitchen-type > filter.choice options:present select:one "{words/all}"]]
- [[restaurant-card.name > input.search placeholder:"Restaurant name"]]

## List

[[restaurant-list: section]]

- [[restaurants-nearby > list.cards]]
  - [[restaurant-card.name]]
  - [[restaurant-card.kitchen-type > status.badge]]
  - [[restaurant-card.open-now]]
  - [[restaurant-card.minimum-order]]
  - [[restaurant-card.rating]]
  - [[open-menu: action > action.primary "See the menu" -> menu with:restaurant-card]]
- [[pages: nav > nav.pages per:10]]

## States

- [[before-search: state given:!searched]]
- [[found: state given:searched&restaurants-nearby!=empty]]
- [[no-restaurants: state given:searched&restaurants-nearby=empty]]
  - [[none-here: feedback > feedback.empty "No restaurant delivers to {customer-place.postcode} yet."]]
- [[filtered-by-kitchen: state given:searched&restaurant-card.kitchen-type~thai]]
