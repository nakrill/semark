# Study 01 — Sema against a control, one pass from brief to drawing

::: note
Run in October 2026 inside the first project, on one feature; rewritten here with the product's names taken out.
The numbers are the ones recorded at the time; nothing here was re-run.
:::

## The question

Does writing a design in Sema first make an agent's first drawing better than going from the brief straight to the drawing tool?

## The two arms

Two fresh agents, the same brief, the same sources, the same drawing tool and the same library.

- **Sema arm:** brief → Sema design (checked) → binding → frames in the drawing tool.
- **Control:** brief → frames in the drawing tool, with no intermediate design.

Both arms were scored on the same key: the conflicts and gaps the brief contained, the screens and states the feature needed, the words carried from the sources, and the consistency of the frames.

## What was measured

| | Sema | Control |
| --- | --- | --- |
| Key-based score | 60.2 | 60.9 |
| Conflicts in the brief found | nearly all | nearly all |
| Findings deepened without adding one | 3 | — |
| Tool calls | 56 | 57 |
| Of which spent on Sema | 14 | — |
| Of which spent in the drawing tool | fewer by 13 | — |
| Date format across frames | one | mixed |
| Rows per page | one value, as the sources say | a value the agent chose |

## What it showed

- **On one pass, Sema tied with the control.** Both fresh agents found nearly every conflict in the brief; Sema deepened three findings and added none.
- **The early catching credited to Sema in the two earlier runs was mostly the brief's.** A good brief finds the conflicts; Sema makes them addressable afterwards.
- **Sema did not cost more.** The fourteen calls spent writing Sema came back as thirteen fewer in the drawing tool.
- **What Sema carried was convention.** The Sema arm kept one date format and one page size without being told; the control mixed formats and chose its own page size. A definition written once and referenced is a definition nobody drifts from.

## Why the control's frames looked more consistent

The drawing instructions, not Sema, made the Sema arm's frames drift.
That agent rebuilt every state from scratch; the control built one template and cloned it.
The Sema arm's instructions also put annotation boxes inside the screens, and gave no canvas layout and no check across frames.

Sema is the better tool for cloning, and it was not used that way: a state's `given:` is exactly the diff from the base state.
The drawing skill now says: write the diff, draw the base once, clone, apply only the diff, then check that every difference between frames traces to a state.
For a rerun, both arms need the same drawing guidance, or the study measures the instructions again.

## Limits

- One pass, one feature, one agent per arm.
- The drawing guidance was not equalised across arms.
- The score measured the first drawing; nothing after it was measured.

The authors' own conclusion: the value of Sema has to be tested after the first draw.

## Study 02 — not yet run

**Question.** When a decision changes after the first drawing, does an agent with Sema update more of the design correctly than an agent with prose?

**Protocol.**

1. Take one finished design, drawn once in both arms with the same drawing guidance (the sample corpus's ordering design is a candidate: seven pages, three screens, one widget).
2. Change one decision in the sources: a field becomes required, a status is renamed, a fulfilment option is added.
3. In the Sema arm, the agent changes the design, runs the checker, and redraws; in the control, the agent changes the prose spec and redraws.
4. Count, per arm: screens that needed a change; screens changed correctly; screens changed that did not need it; words invented; tool calls; and whether a reviewer can locate every change from the diff alone.
5. Repeat for a second change of a different kind (a cross-cutting one that touches data, two screens and a vocabulary).

**What would count as a result.** A difference in screens changed correctly, or in the reviewer's ability to locate the changes from the diff, in either direction.
The build test of 29 October 2026 (`build-test-2026-10-29.md`) rehearsed steps 1 to 3 with one agent and no control: about one prototype edit per changed Sema line, every edit found by name.
That is the claim this study would test.
