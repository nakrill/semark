---
id: zn47xy4yky0q
kind: note
sema: data
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-21, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

# Data

## Menu

[[menu: group]]

- [[submitted: bool derived]] the menu has been sent for review
- [[menu-name: text required "Menu name"]]

## Dish

[[dish: group]]

- [[dish-name: text required "Dish"]]
- [[price: number required unit:EUR "Price"]]

## Dishes

[[dishes: collection of:dish sort:dish-name]]
