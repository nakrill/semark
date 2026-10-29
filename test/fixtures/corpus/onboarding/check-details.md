---
id: nyqxft20sbre
kind: note
sema: screen
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-21, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

# Check details

[[check-details: screen present:page]]

Shows what the restaurant entered before it is sent.

## Summary

[[summary-section: section "Check your details" > summary.key-value]]

- [[restaurant.name]]
- [[restaurant.cuisine]]
- [[status: enum of:application-statuses > status.badge "Status"]]
- [[first-name]]

## Actions

- [[send: action > action.primary "Send" -> menu-builder/editor when:!submitted]]
- [[back: action > action.secondary "Back" -> form]]

## States

- [[review: state given:!submitted]]
