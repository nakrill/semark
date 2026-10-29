---
id: nnp85bcwn4e3
status: ready
owner: tomas@larder.example
description: How Larder writes product designs in Sema, and where to start reading
area: Design
---

# Designs

Every screen Larder builds is written down here first, in Sema: Markdown with the decisions in `[[double brackets]]`.
Prose is for people; the tokens are for people and for the checker.
Open any page in Vouch and the drawing beside it shows the screen, flow or map the page describes.

## Where to start

- [Restaurant onboarding](onboarding/index.md): a restaurant signs up and lands in the menu editor.
- [Menu builder](menu-builder/index.md): a restaurant writes and publishes its menu.
- [Ordering](ordering/index.md): a customer fills a basket, checks out and follows the order.

## Shared vocabulary

- [Patterns](patterns.md) say which interaction a field uses, never which component draws it.
- [Words](words.md) are the words more than one screen uses.
- [Roles](roles.md) say who sees what.

## How we work

One token per line, so the history of a line is the history of one decision.
A word nobody has written yet is `"?"`, never invented.
A question nobody has answered is `?`, with who answers it (`asks:`) and what to draw meanwhile (`default:`).
A design is ready when every screen in it says ready in the map; the checker counts it, not the designer.
