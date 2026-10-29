---
id: w715er90zprk
sema: screen
status: in-review
description: Choosing how many of a dish, and adding it to the basket
area: Design
---

::: note
Written by an agent (Claude), run by Ivan Aleksieiev, 29 October 2026, to widen the ordering flow for a coverage test of Sema in Vouch.
Nothing here has been checked by a person.
:::

# Add a dish

[[add-dish: screen present:dialog over:menu for:customer "{menu-builder/dish.dish-name}"]]

Opened for one dish.

## Dish

[[dish-details: section]]

- [[menu-builder/dish.description]]
- [[menu-builder/dish.allergens > choice.chips readonly]]
- [[menu-builder/dish.price]]

## Choose

[[choose-section: section]]

- [[dish-choice.portions > input.number]]
- [[dish-choice.special-request > input.text.long]]
- [[dish-choice.line-price > summary.total]]

## Actions

[[dish-actions: region]]

- [[add-to-basket: action > action.primary "Add {dish-choice.portions} to basket" -> menu enabled:valid]]
- [[never-mind: action > action.dismiss "{words/cancel}" -> menu]]

## States

- [[one-portion: state given:dish-choice.portions=1]]
- [[many-portions: state given:dish-choice.portions>1]]
- [[with-allergens: state given:menu-builder/dish.allergens!=empty]]
