---
id: pmahqf1kbp62
sema: flow
status: ready
owner: tomas@larder.example
description: From a draft menu to a published one
area: Design
---

# Publish a menu

[[publish-menu: flow]]

Publishing is one click and can be undone by publishing again.

- [[editor -> dish-dialog]] the restaurant adds or changes a dish
- [[dish-dialog -> editor]] it saves the dish and returns to the list
- [[editor -> publish-dialog when:dishes!=empty]] with at least one dish, it publishes
- [[publish-dialog -> editor]] it confirms and is back in the editor, now published
