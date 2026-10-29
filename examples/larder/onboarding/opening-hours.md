---
id: c36dk9zdt019
sema: widget
status: ready
owner: tomas@larder.example
description: The opening-hours card the sign-up form places
area: Design
---

# Opening hours

## Card

[[opening-hours-card: region "Opening hours"]]

- [[opens-at > input.time]]
- [[closes-at > input.time]]
- [[days > choice.chips]]

## Data

[[opening-hours: group]]

- [[opens-at: text required format:h:mm "Opens at"]]
- [[closes-at: text required format:h:mm "Closes at"]]
- [[days: list of:weekdays required "Open on"]]

## Days of the week

[[weekdays: states |mon=Mon|tue=Tue|wed=Wed|thu=Thu|fri=Fri|sat=Sat|sun=Sun|]]
