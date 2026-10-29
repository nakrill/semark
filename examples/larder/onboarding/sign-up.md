---
id: akhdy90vn4vg
sema: flow
status: ready
owner: tomas@larder.example
description: The steps from the sign-up form to the menu editor
area: Design
vouch:
  - by: priya@larder.example
    at: '2026-09-28T08:12:00Z'
    body: sha256:13c711ff2cf49281c89ba50f4eaa4c04f2098282bb988c0224461749226ad4dd
---

# Sign up

[[sign-up: flow]]

A restaurant gives its details, checks them, sends them, and goes straight on to its menu.
Nobody waits for the review to start working.

- [[form -> check-details]] the restaurant fills in its details
- [[check-details -> sent-dialog]] it checks them and sends them
- [[sent-dialog -> menu-builder/editor]] it starts on its menu while we review
- [[form -> discard-dialog]] it can leave at any point before sending
