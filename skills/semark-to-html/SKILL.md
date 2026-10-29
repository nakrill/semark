---
name: semark-to-html
description: Build a working HTML prototype from a Sema design with no design system — the draw job of the semark skill, with the rules that kept one build honest.
---

# Sema to HTML

Read `skills/semark/SKILL.md` first; this file extends its Draw job for one binding: a single HTML page with no design system.
The worked example is the build test of 29 October 2026 (`studies/build-test-2026-10-29.md`): six screens and two dialogs from the sample corpus, in one file.

## Before drawing

1. Run `semark check <corpus-root>`. Draw only from a design with no errors; a warning is a note to carry into the prototype, not a reason to stop.
2. Read the design's pages in reading order: `index.md`, the flows, `data.md`, `states.md`, then the screens as the flows reach them, each followed by the widgets it places.
3. Write down, before any code, what the design does not say and what you will assume for it. This list is part of the deliverable.

## Drawing

- Draw what the tokens say and nothing more. A field with no pattern is its value as text; only `> pattern` makes a control.
- Keep the Sema names as the element names (`id`, data attributes, variables), so a change in the design is a `grep` in the prototype.
- One state is one frame's worth of truth: `given:` settles conditions; what a state does not settle is drawn and marked, never hidden.
- `enabled:` disables, `when:` hides; a reference inherits its definition's `when:`.
- `"?"` is drawn as a hatched placeholder carrying the token's name; never invent the words. Partial copy keeps its ellipsis.
- `? default:x` draws `x`; `?` alone draws as optional and is listed as a question.
- `to-be` is drawn as product UI with a visible "to be" tag.
- `#a…` is drawn as decided and listed as an assumption.
- `is:` lines become one function: first condition that holds wins, the line without a condition last.
- `for:` is a role switch outside the product frame; a screen that is not for the current role is not shown.
- Conventions the design leaves open (currency and date formats, the required marker, the missing value, the shell, a way back) are chosen once, used everywhere, and listed.
- Sample content (records, prices, names) is invented, marked as sample, and listed as the first decision.

## Prototype controls

Anything that is not product UI goes in a bar under the product frame: a role switch, a way to step statuses that come from outside the screen, a way to toggle derived facts the prototype cannot compute, and a fold-out list titled "What the Sema did not say".

## Hand back

- the prototype;
- the list of decisions the design did not make, each pointing at the file and the line it would be settled in;
- the gaps found by building: a field collected with no record to keep it, an action with no outcome, a state with no visible content, a flow with no way back;
- false positives of the checker, if any, with the token that triggered them.

## What the first build measured

- one read of about 200 lines per design; no word a customer reads had to be invented;
- 13 decisions the design did not make on the first flow, 19 on the full one, about a third of them conventions;
- about one prototype edit per changed Sema line on the second pass, every edit found by name;
- the checker caught 14 of the writer's mistakes before a save and missed one planted wrong enum value that the `enum-value` rule now catches.
