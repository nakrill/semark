---
id: k6xe7rn950ec
kind: note
sema: data
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-29, as a neutral test corpus for Sema's value-level checks in Vouch.
Nothing here has been checked by a person.
:::

# Data

## Restaurant

[[restaurant: group]]

- [[restaurant-name: text required "Name"]]
- [[cuisine: enum |thai=Thai|italian=Italian| required "Cuisine"]]
- [[offers-delivery: bool required "We deliver"]]
- [[delivery-radius: number required unit:km when:offers-delivery "Radius"]]
- [[status: enum of:statuses required "Status"]]

## Statuses

[[statuses: states |draft=Draft|live=Live|]]

## Order

[[order: group]]

- [[placed-at: date required "Placed"]]
- [[order-total: number required unit:EUR "Total"]]

## Orders

[[orders: collection of:order sort:-placed-at select:one]]

## Past orders

[[past-orders: collection of:order sort:-placed-at]]

## Live

[[live-orders: number derived refresh:2s..3s "Orders today"]]

## Contact

[[contact: group]]

- [[first-name: text required "First name"]]
- [[last-name: text required "Last name"]]
- [[contact-phone: phone required "Phone"]]

## Manager

[[manager: group]]

- [[shift-phone: phone optional "Phone on shift"]]
