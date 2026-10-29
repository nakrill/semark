---
id: rdwzsjd18zzf
sema: data
status: ready
owner: tomas@larder.example
description: A menu, its sections and its dishes
area: Design
---

# Data

## Menu

[[menu: group]]

- [[menu-status: enum of:menu-statuses initial:draft derived "Menu"]]
- [[published-at: date derived "Published"]]

## Dish

[[dish: group]]

- [[dish-name: text required "Dish"]]
- [[description: longtext optional "Description" hint:"One or two sentences. Customers read this on their phone."]]
- [[price: number required unit:EUR range:0.5..200 "Price"]]
- [[menu-section: enum of:menu-sections required "Section"]]
- [[allergens: list of:allergen-names optional "Allergens"]]
- [[available: bool required initial:true "Available today"]]

## Dishes

[[dishes: collection of:dish sort:dish-name]]

## Sections

[[menu-sections: states |starters=Starters|mains=Mains|sides=Sides|desserts=Desserts|drinks=Drinks|]]

## Allergens

[[allergen-names: states |gluten=Gluten|nuts=Nuts|dairy=Dairy|egg=Egg|fish=Fish|soy=Soy|]]

## Statuses

[[menu-statuses: states |draft=Draft|published=Published|]]
