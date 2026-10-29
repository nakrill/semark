---
id: vd5c8mhgkx9m
sema: screen
status: ready
owner: tomas@larder.example
description: Adding or changing one dish
area: Design
---

# Dish

[[dish-dialog: screen present:dialog over:editor "Dish"]]

## Fields

[[dish-fields: section]]

- [[dish.dish-name > input.text]]
- [[dish.description > input.text.long]]
- [[dish.price > input.number]]
- [[dish.menu-section > choice.dropdown]]
- [[dish.allergens > choice.chips]]
- [[dish.available > choice.binary]]

## Actions

[[dish-actions: region]]

- [[save-dish: action > action.primary "{words/save}" -> editor]]
- [[cancel-dish: action > action.dismiss "{words/cancel}" -> editor]]

## States

- [[new-dish: state given:!submitted]]
- [[missing-price: state given:!valid&submitted]]
