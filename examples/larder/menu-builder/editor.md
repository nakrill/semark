---
id: kb5vxqrxemn7
sema: screen
status: ready
owner: tomas@larder.example
description: The list of dishes, where a restaurant spends most of its time
area: Design
vouch:
  - by: maya@larder.example
    at: '2026-10-09T09:00:00Z'
    body: sha256:3bff592ae535d5bca9511ffa8634335791f873bdead39e5a985867e27107b15e
  - by: priya@larder.example
    at: '2026-10-09T09:30:00Z'
    body: sha256:3bff592ae535d5bca9511ffa8634335791f873bdead39e5a985867e27107b15e
---

# Menu editor

[[editor: screen present:page for:owner,staff "Your menu"]]

## Header

[[editor-header: region]]

- [[menu.menu-status > status.badge]]
- [[dish-count: number derived from:dishes.count "Dishes"]]
- [[publish: action > action.primary "Publish menu" -> publish-dialog enabled:dishes!=empty for:owner]]

## Dishes

[[dish-list: section "Dishes"]]

- [[find-dish: text > input.search placeholder:"Find a dish"]]
- [[section-filter: enum of:menu-sections > filter.choice options:values select:one "{words/all}"]]
- [[dishes > table]]
  - [[dish-name]]
  - [[menu-section]]
  - [[price]]
  - [[available]]
- [[add-dish: action > action.secondary "Add a dish" -> dish-dialog]]

## States

- [[no-dishes: state given:dishes=empty]]
  - [[first-dish: feedback > feedback.empty "No dishes yet. Add your first one to start your menu."]]
- [[some-dishes: state given:dishes!=empty&menu.menu-status=draft]]
- [[published: state given:dishes!=empty&menu.menu-status=published]]
- [[searching: state given:dishes!=empty&searched]]
