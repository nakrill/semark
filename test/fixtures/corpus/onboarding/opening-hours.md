---
id: n5q9y4vve7t8
kind: note
sema: widget
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-21, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

# Opening hours

## Card

[[opening-hours-card: region "Opening hours"]]

- [[opens-at > input.text]]
- [[closes-at > input.text]]
- [[days > choice.single]]

## Data

[[opening-hours: group]]

- [[opens-at: text required format:h:mm "Opens at"]]
- [[closes-at: text ? default:"22:00" "Closes at"]]
- [[days: enum |weekdays=Weekdays|every-day=Every day| initial:every-day "Open on"]]
