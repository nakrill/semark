---
id: bfrmgsqepp6x
sema: screen
status: ready
owner: tomas@larder.example
description: Where a restaurant reads back its answers before sending them
area: Design
vouch:
  - by: priya@larder.example
    at: '2026-10-02T14:00:00Z'
    body: sha256:bbfbc2b63cc1d4ff7b258aa50440a04c6f07c2fc777eedb9d8d590c250e639dc
  - by: tomas@larder.example
    at: '2026-10-23T12:15:00Z'
    body: sha256:4db4975d572c34faec3bd3138854c05bfede130fe4e4e43ec2274ca07a4b3904
---

# Check your details

[[check-details: screen present:page for:owner "Check your details"]]

Nothing here can be edited: going back to the form is one click, and keeps everything.

## Summary

[[check-summary: section "Is this right?" > summary.key-value]]

- [[restaurant.name]]
- [[restaurant.kitchen-type]]
- [[restaurant.delivery-radius]]
- [[contact.first-name]]
- [[contact.email-address]]
- [[application.status > status.badge]]

## Actions

[[check-actions: region]]

- [[send: action > action.primary "Send application" -> sent-dialog]]
- [[go-back: action > action.secondary "{words/back}" -> form]]

## States

- [[review: state given:!submitted]]
- [[review-delivering: state given:restaurant.offers-delivery&!submitted]]
